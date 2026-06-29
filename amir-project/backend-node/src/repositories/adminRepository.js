const { query, withTransaction, clientQuery } = require("../db/postgres")
const { getPublicUrl } = require("../utils/storage")

const PAGE_SIZE = 20

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value !== "string") return value
  try { return JSON.parse(value) } catch { return fallback }
}

function makePaginator(data, total, page, perPage) {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  return { data, current_page: page, last_page: lastPage, per_page: perPage, total }
}

// ── Orders ─────────────────────────────────────────────────────────────────

async function listOrders(config, { page = 1, status, search, perPage = PAGE_SIZE } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const safePerPage = Math.min(100, Math.max(1, Number(perPage) || PAGE_SIZE))
  const offset = (safePage - 1) * safePerPage

  const conditions = ["1=1"]
  const params = {}

  if (status) { conditions.push("orders.status = :status"); params.status = status }
  if (search) {
    conditions.push("(users.name LIKE :search OR users.email LIKE :search OR orders.order_number LIKE :search)")
    params.search = `%${search}%`
  }

  const where = conditions.join(" AND ")

  const [countRows, rows] = await Promise.all([
    query(config, `SELECT COUNT(*) AS total FROM orders LEFT JOIN users ON users.id = orders.user_id WHERE ${where}`, params),
    query(config, `
      SELECT orders.*, users.name AS user_name, users.email AS user_email,
             packages.name AS package_name
      FROM orders
      LEFT JOIN users ON users.id = orders.user_id
      LEFT JOIN packages ON packages.id = orders.package_id
      WHERE ${where}
      ORDER BY orders.created_at DESC
      LIMIT ${safePerPage} OFFSET ${offset}
    `, params),
  ])

  const total = Number(countRows[0]?.total || 0)
  return makePaginator(rows.map(r => ({
    ...r,
    user: r.user_name ? { id: r.user_id, name: r.user_name, email: r.user_email } : null,
    package: r.package_name ? { id: r.package_id, name: r.package_name } : null,
  })), total, safePage, safePerPage)
}

async function getOrderById(config, orderId) {
  const rows = await query(config, `
    SELECT orders.*, users.id AS uid, users.name AS user_name, users.email AS user_email,
           packages.name AS package_name, packages.price AS package_price
    FROM orders
    LEFT JOIN users ON users.id = orders.user_id
    LEFT JOIN packages ON packages.id = orders.package_id
    WHERE orders.id = :orderId LIMIT 1
  `, { orderId })

  if (!rows[0]) return null
  const r = rows[0]

  const files = await query(config, "SELECT * FROM order_files WHERE order_id = :orderId ORDER BY created_at DESC", { orderId })
  const payment = await query(config, "SELECT * FROM payments WHERE order_id = :orderId LIMIT 1", { orderId })

  return {
    ...r,
    user: { id: r.uid, name: r.user_name, email: r.user_email },
    package: { id: r.package_id, name: r.package_name, price: r.package_price },
    files,
    payment: payment[0] || null,
  }
}

async function updateOrderStatus(config, orderId, status, notes) {
  await query(config, `
    UPDATE orders SET status = :status, admin_notes = :notes, updated_at = NOW() WHERE id = :orderId
  `, { orderId, status, notes: notes || null })
  return getOrderById(config, orderId)
}

// ── Payments ───────────────────────────────────────────────────────────────

async function listPayments(config, { page = 1, status } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * PAGE_SIZE

  const conditions = ["1=1"]
  const params = {}
  if (status) { conditions.push("payments.status = :status"); params.status = status }
  const where = conditions.join(" AND ")

  const [countRows, rows] = await Promise.all([
    query(config, `SELECT COUNT(*) AS total FROM payments WHERE ${where}`, params),
    query(config, `
      SELECT payments.*, orders.order_number, orders.total_price,
             users.name AS user_name, users.email AS user_email
      FROM payments
      LEFT JOIN orders ON orders.id = payments.order_id
      LEFT JOIN users ON users.id = orders.user_id
      WHERE ${where}
      ORDER BY payments.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `, params),
  ])

  const total = Number(countRows[0]?.total || 0)
  return makePaginator(rows.map(r => ({
    ...r,
    order: { id: r.order_id, order_number: r.order_number, total_price: r.total_price },
    user: { name: r.user_name, email: r.user_email },
  })), total, safePage, PAGE_SIZE)
}

async function verifyPayment(config, paymentId, adminId) {
  await query(config, `
    UPDATE payments SET status = 'verified', verified_by = :adminId, verified_at = NOW(), updated_at = NOW()
    WHERE id = :paymentId
  `, { paymentId, adminId })

  const rows = await query(config, "SELECT order_id FROM payments WHERE id = :paymentId LIMIT 1", { paymentId })
  if (rows[0]) {
    await query(config, `UPDATE orders SET status = 'in_progress', updated_at = NOW() WHERE id = :orderId`, { orderId: rows[0].order_id })
  }
}

async function rejectPayment(config, paymentId, reason) {
  await query(config, `
    UPDATE payments SET status = 'rejected', rejection_reason = :reason, updated_at = NOW()
    WHERE id = :paymentId
  `, { paymentId, reason: reason || null })
}

// ── Users ──────────────────────────────────────────────────────────────────

async function listUsers(config, { page = 1, search } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * PAGE_SIZE

  const conditions = ["users.role != 'admin'"]
  const params = {}
  if (search) {
    conditions.push("(users.name LIKE :search OR users.email LIKE :search)")
    params.search = `%${search}%`
  }
  const where = conditions.join(" AND ")

  const [countRows, rows] = await Promise.all([
    query(config, `SELECT COUNT(*) AS total FROM users WHERE ${where}`, params),
    query(config, `
      SELECT users.id, users.name, users.username, users.email, users.phone,
             users.role, users.is_active, users.created_at,
             COUNT(DISTINCT orders.id) AS order_count
      FROM users
      LEFT JOIN orders ON orders.user_id = users.id
      WHERE ${where}
      GROUP BY users.id, users.name, users.username, users.email, users.phone,
               users.role, users.is_active, users.created_at
      ORDER BY users.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `, params),
  ])

  const total = Number(countRows[0]?.total || 0)
  return makePaginator(rows, total, safePage, PAGE_SIZE)
}

async function toggleUserActive(config, userId, isActive) {
  await query(config, "UPDATE users SET is_active = :isActive, updated_at = NOW() WHERE id = :userId", {
    userId, isActive: isActive ? 1 : 0,
  })
}

// ── Packages ───────────────────────────────────────────────────────────────

function pkgRow(row) {
  if (!row) return row
  return { ...row, features: parseJson(row.features, []) }
}

async function listPackagesAdmin(config) {
  const rows = await query(config, "SELECT * FROM packages ORDER BY sort_order ASC, created_at DESC")
  return rows.map(pkgRow)
}

async function createPackage(config, data) {
  const result = await query(config, `
    INSERT INTO packages (name, slug, short_description, description, price, price_aed, currency,
      delivery_days, revisions, is_featured, is_active, features, sort_order, created_at, updated_at)
    VALUES (:name, :slug, :shortDesc, :desc, :price, :priceAed, :currency,
      :deliveryDays, :revisions, :isFeatured, :isActive, :features, :sortOrder, NOW(), NOW())
  `, {
    name: data.name,
    slug: data.slug || slugify(data.name),
    shortDesc: data.short_description || null,
    desc: data.description || null,
    price: Number(data.price || 0),
    priceAed: data.price_aed != null ? Number(data.price_aed) : null,
    currency: data.currency || "USD",
    deliveryDays: Number(data.delivery_days || 7),
    revisions: data.revisions != null ? Number(data.revisions) : null,
    isFeatured: data.is_featured ? 1 : 0,
    isActive: data.is_active !== false ? 1 : 0,
    features: data.features ? JSON.stringify(data.features) : null,
    sortOrder: Number(data.sort_order || 0),
  })
  const rows = await query(config, "SELECT * FROM packages WHERE id = :id LIMIT 1", { id: result.insertId })
  return pkgRow(rows[0])
}

async function updatePackage(config, id, data) {
  const fields = []
  const params = { id }
  const allowed = ["name", "slug", "short_description", "description", "price", "price_aed",
    "currency", "delivery_days", "revisions", "sort_order"]
  const boolFields = ["is_featured", "is_active"]

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key]
    }
  }
  for (const key of boolFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key] ? 1 : 0
    }
  }
  if (data.features !== undefined) {
    fields.push('"features" = :features')
    params.features = data.features ? JSON.stringify(data.features) : null
  }

  if (fields.length > 0) {
    fields.push("updated_at = NOW()")
    await query(config, `UPDATE packages SET ${fields.join(", ")} WHERE id = :id`, params)
  }
  const rows = await query(config, "SELECT * FROM packages WHERE id = :id LIMIT 1", { id })
  return pkgRow(rows[0])
}

async function deletePackage(config, id) {
  await query(config, "DELETE FROM packages WHERE id = :id", { id })
}

// ── Addons ─────────────────────────────────────────────────────────────────

async function listAddonsAdmin(config) {
  return query(config, "SELECT * FROM addons ORDER BY created_at DESC")
}

async function createAddon(config, data) {
  const result = await query(config, `
    INSERT INTO addons (name, description, price, billing_type, is_active, created_at, updated_at)
    VALUES (:name, :desc, :price, :billingType, :isActive, NOW(), NOW())
  `, {
    name: data.name,
    desc: data.description || null,
    price: Number(data.price || 0),
    billingType: data.billing_type || "one_time",
    isActive: data.is_active !== false ? 1 : 0,
  })
  const rows = await query(config, "SELECT * FROM addons WHERE id = :id LIMIT 1", { id: result.insertId })
  return rows[0]
}

async function updateAddon(config, id, data) {
  const allowed = ["name", "description", "price", "billing_type"]
  const boolFields = ["is_active"]
  const fields = []
  const params = { id }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key]
    }
  }
  for (const key of boolFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key] ? 1 : 0
    }
  }
  if (fields.length > 0) {
    fields.push("updated_at = NOW()")
    await query(config, `UPDATE addons SET ${fields.join(", ")} WHERE id = :id`, params)
  }
  const rows = await query(config, "SELECT * FROM addons WHERE id = :id LIMIT 1", { id })
  return rows[0]
}

async function deleteAddon(config, id) {
  await query(config, "DELETE FROM addons WHERE id = :id", { id })
}

// ── Payment Methods ────────────────────────────────────────────────────────

async function listPaymentMethodsAdmin(config) {
  return query(config, "SELECT * FROM payment_methods ORDER BY created_at DESC")
}

async function createPaymentMethod(config, data) {
  const result = await query(config, `
    INSERT INTO payment_methods (name, type, instructions, account_details, is_active, created_at, updated_at)
    VALUES (:name, :type, :instructions, :accountDetails, :isActive, NOW(), NOW())
  `, {
    name: data.name,
    type: data.type || "bank",
    instructions: data.instructions || null,
    accountDetails: data.account_details ? JSON.stringify(data.account_details) : null,
    isActive: data.is_active !== false ? 1 : 0,
  })
  const rows = await query(config, "SELECT * FROM payment_methods WHERE id = :id LIMIT 1", { id: result.insertId })
  return { ...rows[0], account_details: parseJson(rows[0]?.account_details) }
}

async function updatePaymentMethod(config, id, data) {
  const allowed = ["name", "type", "instructions"]
  const boolFields = ["is_active"]
  const fields = []
  const params = { id }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key]
    }
  }
  for (const key of boolFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key] ? 1 : 0
    }
  }
  if (data.account_details !== undefined) {
    fields.push('"account_details" = :account_details')
    params.account_details = data.account_details ? JSON.stringify(data.account_details) : null
  }
  if (fields.length > 0) {
    fields.push("updated_at = NOW()")
    await query(config, `UPDATE payment_methods SET ${fields.join(", ")} WHERE id = :id`, params)
  }
  const rows = await query(config, "SELECT * FROM payment_methods WHERE id = :id LIMIT 1", { id })
  return { ...rows[0], account_details: parseJson(rows[0]?.account_details) }
}

async function deletePaymentMethod(config, id) {
  await query(config, "DELETE FROM payment_methods WHERE id = :id", { id })
}

// ── Blog ───────────────────────────────────────────────────────────────────

async function listBlogAdmin(config, { page = 1 } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * PAGE_SIZE

  const [countRows, rows] = await Promise.all([
    query(config, "SELECT COUNT(*) AS total FROM blog_posts"),
    query(config, `
      SELECT blog_posts.*, users.name AS author_name
      FROM blog_posts
      LEFT JOIN users ON users.id = blog_posts.user_id
      ORDER BY created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ])

  const total = Number(countRows[0]?.total || 0)
  return makePaginator(rows.map(r => ({
    ...r,
    tags: parseJson(r.tags, []),
    author: r.author_name ? { name: r.author_name } : null,
  })), total, safePage, PAGE_SIZE)
}

async function createBlogPost(config, userId, data) {
  const slug = data.slug || await makeUniqueSlug(config, data.title)
  const result = await query(config, `
    INSERT INTO blog_posts (user_id, category_id, title, slug, excerpt, content, featured_image, tags, status, published_at, created_at, updated_at)
    VALUES (:userId, :categoryId, :title, :slug, :excerpt, :content, :featuredImage, :tags, :status, :publishedAt, NOW(), NOW())
  `, {
    userId,
    categoryId: data.category_id || null,
    title: data.title,
    slug,
    excerpt: data.excerpt || null,
    content: data.content || "",
    featuredImage: data.featured_image || null,
    tags: data.tags ? JSON.stringify(data.tags) : null,
    status: data.status || "draft",
    publishedAt: data.status === "published" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
  })
  const rows = await query(config, "SELECT * FROM blog_posts WHERE id = :id LIMIT 1", { id: result.insertId })
  return { ...rows[0], tags: parseJson(rows[0]?.tags, []) }
}

async function updateBlogPost(config, id, data) {
  const allowed = ["title", "slug", "excerpt", "content", "featured_image", "status", "category_id"]
  const fields = []
  const params = { id }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key]
    }
  }
  if (data.tags !== undefined) {
    fields.push('"tags" = :tags')
    params.tags = data.tags ? JSON.stringify(data.tags) : null
  }
  if (data.status === "published") {
    fields.push("published_at = COALESCE(published_at, NOW())")
  }
  if (fields.length > 0) {
    fields.push("updated_at = NOW()")
    await query(config, `UPDATE blog_posts SET ${fields.join(", ")} WHERE id = :id`, params)
  }
  const rows = await query(config, "SELECT * FROM blog_posts WHERE id = :id LIMIT 1", { id })
  return { ...rows[0], tags: parseJson(rows[0]?.tags, []) }
}

async function deleteBlogPost(config, id) {
  await query(config, "DELETE FROM blog_posts WHERE id = :id", { id })
}

// ── Portfolio ──────────────────────────────────────────────────────────────

function portfolioRow(r) {
  return {
    ...r,
    images: parseJson(r.images, []),
    tech_stack: parseJson(r.tech_stack, []),
    results: parseJson(r.results, null),
  }
}

async function listPortfolioAdmin(config) {
  const rows = await query(config, "SELECT * FROM portfolio_items ORDER BY sort_order ASC, created_at DESC")
  return rows.map(portfolioRow)
}

async function createPortfolioItem(config, data) {
  const result = await query(config, `
    INSERT INTO portfolio_items
      (title, slug, short_description, description, thumbnail, images, tech_stack,
       results, live_url, category, is_featured, is_active, sort_order,
       completed_at, meta_title, meta_description, created_at, updated_at)
    VALUES
      (:title, :slug, :shortDesc, :desc, :thumbnail, :images, :techStack,
       :results, :liveUrl, :category, :isFeatured, :isActive, :sortOrder,
       :completedAt, :metaTitle, :metaDesc, NOW(), NOW())
  `, {
    title: data.title,
    slug: data.slug || slugify(data.title),
    shortDesc: data.short_description || null,
    desc: data.description || null,
    thumbnail: data.thumbnail || null,
    images: data.images ? JSON.stringify(data.images) : null,
    techStack: data.tech_stack ? JSON.stringify(data.tech_stack) : null,
    results: data.results ? JSON.stringify(data.results) : null,
    liveUrl: data.live_url || data.project_url || null,
    category: data.category || null,
    isFeatured: data.is_featured ? 1 : 0,
    isActive: data.is_active !== false ? 1 : 0,
    sortOrder: Number(data.sort_order || 0),
    completedAt: data.completed_at || null,
    metaTitle: data.meta_title || null,
    metaDesc: data.meta_description || null,
  })
  const rows = await query(config, "SELECT * FROM portfolio_items WHERE id = :id LIMIT 1", { id: result.insertId })
  return portfolioRow(rows[0])
}

async function updatePortfolioItem(config, id, data) {
  const allowed = ["title", "slug", "short_description", "description", "thumbnail",
    "live_url", "category", "sort_order", "completed_at", "meta_title", "meta_description"]
  const boolFields = ["is_featured", "is_active"]
  const fields = []
  const params = { id }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key]
    }
  }
  for (const key of boolFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key] ? 1 : 0
    }
  }
  // project_url is an alias for live_url (frontend compat)
  if (data.project_url !== undefined && data.live_url === undefined) {
    fields.push('"live_url" = :live_url'); params.live_url = data.project_url
  }
  if (data.images !== undefined) { fields.push('"images" = :images'); params.images = JSON.stringify(data.images || []) }
  if (data.tech_stack !== undefined) { fields.push('"tech_stack" = :tech_stack'); params.tech_stack = JSON.stringify(data.tech_stack || []) }
  if (data.results !== undefined) { fields.push('"results" = :results'); params.results = JSON.stringify(data.results || []) }
  if (fields.length > 0) {
    fields.push("updated_at = NOW()")
    await query(config, `UPDATE portfolio_items SET ${fields.join(", ")} WHERE id = :id`, params)
  }
  const rows = await query(config, "SELECT * FROM portfolio_items WHERE id = :id LIMIT 1", { id })
  return portfolioRow(rows[0])
}

async function deletePortfolioItem(config, id) {
  await query(config, "DELETE FROM portfolio_items WHERE id = :id", { id })
}

// ── Settings ───────────────────────────────────────────────────────────────

async function getAllSettings(config) {
  return query(config, `SELECT "key", "value" FROM settings ORDER BY "key"`)
}

async function saveSetting(config, key, value) {
  await query(config, `
    INSERT INTO settings ("key", "value", created_at, updated_at)
    VALUES (:key, :value, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()
  `, { key, value })
}

async function saveSettings(config, settingsMap) {
  await withTransaction(config, async (client) => {
    for (const [key, value] of Object.entries(settingsMap)) {
      await client.query(
        `INSERT INTO settings ("key", "value", created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()`,
        [key, value]
      )
    }
  })
}

// ── Dashboard Stats ────────────────────────────────────────────────────────

async function getDashboardStats(config) {
  const [orders, revenueTotal, revenueMonth, users, quotes] = await Promise.all([
    query(config, "SELECT COUNT(*) AS total, SUM(CASE WHEN status='pending_approval' THEN 1 ELSE 0 END) AS pending FROM orders"),
    query(config, "SELECT SUM(total_price) AS total FROM orders WHERE status NOT IN ('cancelled','rejected')"),
    query(config, `SELECT SUM(total_price) AS total FROM orders WHERE status NOT IN ('cancelled','rejected')
      AND EXTRACT(MONTH FROM created_at)=EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM created_at)=EXTRACT(YEAR FROM NOW())`),
    query(config, "SELECT COUNT(*) AS total FROM users WHERE role='client'"),
    query(config, "SELECT COUNT(*) AS total FROM custom_quotes WHERE status='pending'"),
  ])

  return {
    total_orders:       Number(orders[0]?.total || 0),
    pending_orders:     Number(orders[0]?.pending || 0),
    revenue_total:      Number(revenueTotal[0]?.total || 0),
    revenue_this_month: Number(revenueMonth[0]?.total || 0),
    total_clients:      Number(users[0]?.total || 0),
    new_quotes:         Number(quotes[0]?.total || 0),
  }
}

// ── Quotes ─────────────────────────────────────────────────────────────────

async function listQuotesAdmin(config, { page = 1, status } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * PAGE_SIZE

  const conditions = ["1=1"]
  const params = {}
  if (status) { conditions.push("custom_quotes.status = :status"); params.status = status }
  const where = conditions.join(" AND ")

  const [countRows, rows] = await Promise.all([
    query(config, `SELECT COUNT(*) AS total FROM custom_quotes WHERE ${where}`, params),
    query(config, `
      SELECT custom_quotes.*, users.name AS user_name, users.email AS user_email
      FROM custom_quotes
      LEFT JOIN users ON users.id = custom_quotes.user_id
      WHERE ${where}
      ORDER BY custom_quotes.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `, params),
  ])

  const total = Number(countRows[0]?.total || 0)
  return makePaginator(rows.map(r => ({
    ...r,
    user: r.user_name ? { name: r.user_name, email: r.user_email } : null,
  })), total, safePage, PAGE_SIZE)
}

async function updateQuote(config, id, data) {
  const fields = ["updated_at = NOW()"]
  const params = { id }
  if (data.status) { fields.push("status = :status"); params.status = data.status }
  if (data.quoted_price !== undefined) { fields.push("quoted_price = :quoted_price"); params.quoted_price = data.quoted_price }
  if (data.admin_notes !== undefined) { fields.push("admin_notes = :admin_notes"); params.admin_notes = data.admin_notes }
  await query(config, `UPDATE custom_quotes SET ${fields.join(", ")} WHERE id = :id`, params)
  const rows = await query(config, "SELECT * FROM custom_quotes WHERE id = :id LIMIT 1", { id })
  return rows[0]
}

// ── Chats (Admin) ──────────────────────────────────────────────────────────

async function listChatsAdmin(config) {
  return query(config, `
    SELECT chats.*, users.name AS user_name, users.email AS user_email, users.phone AS user_phone,
           (SELECT body FROM messages WHERE chat_id = chats.id ORDER BY created_at DESC LIMIT 1) AS last_message,
           (SELECT created_at FROM messages WHERE chat_id = chats.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
           (SELECT COUNT(*) FROM messages WHERE chat_id = chats.id AND sender_type != 'admin' AND read_at IS NULL) AS unread_admin
    FROM chats
    LEFT JOIN users ON users.id = chats.user_id
    ORDER BY last_message_at DESC, chats.created_at DESC
  `)
}

async function getChatMessages(config, chatId) {
  const msgs = await query(config, `
    SELECT id, chat_id, sender_type, body, channel, sms_sid, sms_status, created_at, updated_at, read_at
    FROM messages
    WHERE chat_id = :chatId
    ORDER BY created_at ASC
  `, { chatId })

  if (!msgs.length) return msgs

  const ids = msgs.map(r => r.id)
  const files = await query(config,
    `SELECT * FROM message_files WHERE message_id IN (${ids.map((_, i) => `:id${i}`).join(",")})`,
    Object.fromEntries(ids.map((id, i) => [`id${i}`, id]))
  )

  const filesByMsg = {}
  for (const f of files) {
    if (!filesByMsg[f.message_id]) filesByMsg[f.message_id] = []
    filesByMsg[f.message_id].push({ ...f, public_url: getPublicUrl(f.file_path) })
  }

  return msgs.map(r => ({ ...r, files: filesByMsg[r.id] || [] }))
}

async function sendAdminMessage(config, chatId, body, senderType = "admin") {
  const result = await query(config, `
    INSERT INTO messages (chat_id, sender_type, body, created_at, updated_at)
    VALUES (:chatId, :senderType, :body, NOW(), NOW())
  `, { chatId, senderType, body })
  const rows = await query(config, "SELECT * FROM messages WHERE id = :id LIMIT 1", { id: result.insertId })
  return rows[0]
}

async function markAdminMessagesRead(config, chatId) {
  await query(config, `
    UPDATE messages SET read_at = NOW() WHERE chat_id = :chatId AND sender_type != 'admin' AND read_at IS NULL
  `, { chatId })
}

async function setAdminTyping(config, chatId) {
  await query(config, `
    INSERT INTO settings ("key", "value", created_at, updated_at)
    VALUES (:key, :value, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()
  `, { key: `chat_typing_admin_${chatId}`, value: Date.now().toString() })
}

async function getTypingStatus(config, chatId) {
  const now = Date.now()
  const rows = await query(config, `
    SELECT "key", "value" FROM settings
    WHERE "key" IN (:adminKey, :clientKey)
  `, { adminKey: `chat_typing_admin_${chatId}`, clientKey: `chat_typing_client_${chatId}` })

  const result = { admin: false, client: false }
  for (const row of rows) {
    const ts = Number(row.value || 0)
    const isTyping = (now - ts) < 4000
    if (row.key.includes("_admin_")) result.admin = isTyping
    if (row.key.includes("_client_")) result.client = isTyping
  }
  return result
}

// ── Invoices (Admin) ───────────────────────────────────────────────────────

async function listInvoicesAdmin(config, { page = 1 } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * PAGE_SIZE

  const [countRows, rows] = await Promise.all([
    query(config, "SELECT COUNT(*) AS total FROM invoices"),
    query(config, `
      SELECT invoices.*, users.name AS user_name, users.email AS user_email,
             orders.order_number
      FROM invoices
      LEFT JOIN users ON users.id = invoices.user_id
      LEFT JOIN orders ON orders.id = invoices.order_id
      ORDER BY invoices.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ])

  const total = Number(countRows[0]?.total || 0)
  return makePaginator(rows.map(r => ({
    ...r,
    line_items: parseJson(r.line_items, []),
    user: r.user_name ? { id: r.user_id, name: r.user_name, email: r.user_email } : null,
    order: r.order_number ? { id: r.order_id, order_number: r.order_number } : null,
  })), total, safePage, PAGE_SIZE)
}

async function getInvoiceById(config, id) {
  const rows = await query(config, `
    SELECT invoices.*, users.name AS user_name, users.email AS user_email, orders.order_number
    FROM invoices
    LEFT JOIN users ON users.id = invoices.user_id
    LEFT JOIN orders ON orders.id = invoices.order_id
    WHERE invoices.id = :id LIMIT 1
  `, { id })
  if (!rows[0]) return null
  const r = rows[0]
  return { ...r, line_items: parseJson(r.line_items, []), user: { id: r.user_id, name: r.user_name, email: r.user_email } }
}

async function createInvoice(config, data) {
  const invoiceNumber = await generateInvoiceNumber(config)
  const result = await query(config, `
    INSERT INTO invoices (invoice_number, order_id, user_id, line_items, subtotal, tax_rate, tax_amount, discount, total, due_date, notes, status, created_at, updated_at)
    VALUES (:invoiceNumber, :orderId, :userId, :lineItems, :subtotal, :taxRate, :taxAmount, :discount, :total, :dueDate, :notes, 'draft', NOW(), NOW())
  `, {
    invoiceNumber,
    orderId: data.order_id || null,
    userId: data.user_id || null,
    lineItems: JSON.stringify(data.line_items || []),
    subtotal: Number(data.subtotal || 0),
    taxRate: Number(data.tax_rate || 0),
    taxAmount: Number(data.tax_amount || 0),
    discount: Number(data.discount || 0),
    total: Number(data.total || 0),
    dueDate: data.due_date || null,
    notes: data.notes || null,
  })
  return getInvoiceById(config, result.insertId)
}

async function markInvoicePaid(config, id) {
  await query(config, "UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = :id", { id })
  return getInvoiceById(config, id)
}

async function markInvoiceSent(config, id) {
  await query(config, "UPDATE invoices SET status = 'sent', updated_at = NOW() WHERE id = :id", { id })
}

async function generateInvoiceNumber(config) {
  const year = new Date().getFullYear()
  const rows = await query(config, "SELECT COUNT(*) AS total FROM invoices WHERE EXTRACT(YEAR FROM created_at) = :year", { year })
  const count = Number(rows[0]?.total || 0) + 1
  return `INV-${year}${String(count).padStart(4, "0")}`
}

// ── Notifications ──────────────────────────────────────────────────────────

async function listNotificationsForUser(config, userId, { page = 1 } = {}) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * 20

  const rows = await query(config, `
    SELECT * FROM user_notifications WHERE user_id = :userId
    ORDER BY created_at DESC LIMIT 20 OFFSET ${offset}
  `, { userId })

  const unread = await query(config, `
    SELECT COUNT(*) AS total FROM user_notifications WHERE user_id = :userId AND read_at IS NULL
  `, { userId })

  return { data: rows, unread_count: Number(unread[0]?.total || 0) }
}

async function markNotificationRead(config, id, userId) {
  await query(config, `
    UPDATE user_notifications SET read_at = NOW() WHERE id = :id AND user_id = :userId
  `, { id, userId })
}

async function markAllNotificationsRead(config, userId) {
  await query(config, `
    UPDATE user_notifications SET read_at = NOW() WHERE user_id = :userId AND read_at IS NULL
  `, { userId })
}

// ── Builder ────────────────────────────────────────────────────────────────

async function getBuilderPage(config, slug) {
  const rows = await query(config, "SELECT * FROM builder_pages WHERE slug = :slug LIMIT 1", { slug })
  if (!rows[0]) return null
  return { ...rows[0], layout: parseJson(rows[0].layout, []) }
}

async function saveBuilderPage(config, slug, layout, userId) {
  await query(config, `
    INSERT INTO builder_pages (slug, layout, updated_by, created_at, updated_at)
    VALUES (:slug, :layout, :userId, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET layout = EXCLUDED.layout, updated_by = EXCLUDED.updated_by, updated_at = NOW()
  `, { slug, layout: JSON.stringify(layout), userId })
  return getBuilderPage(config, slug)
}

async function publishBuilderPage(config, slug) {
  await query(config, `
    UPDATE builder_pages SET is_published = 1, published_at = NOW(), updated_at = NOW() WHERE slug = :slug
  `, { slug })
}

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(value) {
  return String(value).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

async function makeUniqueSlug(config, title) {
  const base = slugify(title) || "post"
  let slug = base
  let attempt = 0
  while (true) {
    const rows = await query(config, "SELECT id FROM blog_posts WHERE slug = :slug LIMIT 1", { slug })
    if (!rows.length) return slug
    attempt++
    slug = `${base}-${attempt}`
  }
}

// ── Additional admin user functions ────────────────────────────────────────

async function adminUpdateUser(config, id, data) {
  const allowed = ["name", "email", "phone", "role"]
  const boolFields = ["is_active"]
  const fields = []
  const params = { id }
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key]
    }
  }
  for (const key of boolFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      fields.push(`"${key}" = :${key}`)
      params[key] = data[key] ? 1 : 0
    }
  }
  if (fields.length > 0) {
    fields.push("updated_at = NOW()")
    await query(config, `UPDATE users SET ${fields.join(", ")} WHERE id = :id`, params)
  }
  const rows = await query(config, "SELECT id,name,username,email,phone,role,is_active,created_at FROM users WHERE id = :id LIMIT 1", { id })
  return rows[0]
}

async function adminDeleteUser(config, id) {
  await query(config, "DELETE FROM users WHERE id = :id AND role != 'admin'", { id })
}

async function createUser(config, data) {
  const bcrypt = require("bcryptjs")
  const crypto = require("node:crypto")
  const password = data.password || crypto.randomBytes(16).toString("hex")
  const hash = await bcrypt.hash(password, 10)
  const result = await query(config, `
    INSERT INTO users (name, username, email, phone, password, role, is_active, created_at, updated_at)
    VALUES (:name, :username, :email, :phone, :password, :role, 1, NOW(), NOW())
  `, {
    name: data.name,
    username: data.username || data.email.split("@")[0].replace(/[^a-z0-9]/g, "_"),
    email: data.email,
    phone: data.phone || null,
    password: hash,
    role: data.role || "client",
  })
  const rows = await query(config, "SELECT id,name,username,email,phone,role,is_active FROM users WHERE id = :id LIMIT 1", { id: result.insertId })
  return rows[0]
}

// ── Blog categories ────────────────────────────────────────────────────────

async function listBlogCategories(config) {
  return query(config, "SELECT * FROM blog_categories ORDER BY name ASC")
}

async function createBlogCategory(config, name) {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const result = await query(config, `
    INSERT INTO blog_categories (name, slug, created_at, updated_at)
    VALUES (:name, :slug, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
  `, { name, slug })
  const rows = await query(config, "SELECT * FROM blog_categories WHERE id = :id LIMIT 1", { id: result.insertId })
  return rows[0]
}

async function deleteBlogCategory(config, id) {
  await query(config, "DELETE FROM blog_categories WHERE id = :id", { id })
}

// ── Portfolio reorder ──────────────────────────────────────────────────────

async function reorderPortfolio(config, ids) {
  await withTransaction(config, async (client) => {
    for (let i = 0; i < ids.length; i++) {
      await client.query("UPDATE portfolio_items SET sort_order = $1 WHERE id = $2", [i, ids[i]])
    }
  })
}

// ── Dashboard extras ───────────────────────────────────────────────────────

async function getRecentOrders(config) {
  return query(config, `
    SELECT orders.id, orders.order_number, orders.status, orders.total_price, orders.created_at,
           users.name AS user_name, packages.name AS package_name
    FROM orders
    LEFT JOIN users ON users.id = orders.user_id
    LEFT JOIN packages ON packages.id = orders.package_id
    ORDER BY orders.created_at DESC LIMIT 10
  `)
}

async function getRevenueChart(config) {
  return query(config, `
    SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
           SUM(total_price) AS revenue,
           COUNT(*) AS order_count
    FROM orders
    WHERE status NOT IN ('cancelled','rejected')
      AND created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month ORDER BY month ASC
  `)
}

// ── Builder pages list ─────────────────────────────────────────────────────

async function listBuilderPages(config) {
  return query(config, `
    SELECT slug, is_published, published_at, updated_at FROM builder_pages ORDER BY slug ASC
  `)
}

// ── Email templates ────────────────────────────────────────────────────────

async function listEmailTemplates(config) {
  const rows = await query(config, `
    SELECT "key", "value" FROM settings WHERE "key" LIKE 'email_template_%'
  `)
  return rows.map(r => ({ key: r.key.replace("email_template_", ""), content: r.value }))
}

async function getEmailTemplate(config, key) {
  const rows = await query(config, `SELECT "value" FROM settings WHERE "key" = :key LIMIT 1`, { key: `email_template_${key}` })
  return { key, content: rows[0]?.value || "" }
}

async function saveEmailTemplate(config, key, content) {
  await query(config, `
    INSERT INTO settings ("key", "value", created_at, updated_at)
    VALUES (:key, :content, NOW(), NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()
  `, { key: `email_template_${key}`, content })
}

module.exports = {
  listOrders, getOrderById, updateOrderStatus,
  listPayments, verifyPayment, rejectPayment,
  listUsers, toggleUserActive, adminUpdateUser, adminDeleteUser, createUser,
  listPackagesAdmin, createPackage, updatePackage, deletePackage,
  listAddonsAdmin, createAddon, updateAddon, deleteAddon,
  listPaymentMethodsAdmin, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  listBlogAdmin, createBlogPost, updateBlogPost, deleteBlogPost,
  listBlogCategories, createBlogCategory, deleteBlogCategory,
  listPortfolioAdmin, createPortfolioItem, updatePortfolioItem, deletePortfolioItem, reorderPortfolio,
  getAllSettings, saveSetting, saveSettings,
  getDashboardStats, getRecentOrders, getRevenueChart,
  listQuotesAdmin, updateQuote,
  listChatsAdmin, getChatMessages, sendAdminMessage, markAdminMessagesRead, setAdminTyping, getTypingStatus,
  listInvoicesAdmin, getInvoiceById, createInvoice, markInvoicePaid, markInvoiceSent,
  listNotificationsForUser, markNotificationRead, markAllNotificationsRead,
  getBuilderPage, saveBuilderPage, publishBuilderPage, listBuilderPages,
  listEmailTemplates, getEmailTemplate, saveEmailTemplate,
}

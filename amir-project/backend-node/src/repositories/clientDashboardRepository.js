const { query } = require("../db/postgres")

const PAGE_SIZE = 10

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function paginatedOrders(config, userId, page = 1) {
  const safePage = Math.max(1, Number(page) || 1)
  const offset = (safePage - 1) * PAGE_SIZE

  const countRows = await query(
    config,
    "SELECT COUNT(*) AS total FROM orders WHERE user_id = :userId",
    { userId }
  )
  const total = Number(countRows[0]?.total || 0)

  const rows = await query(
    config,
    `
      SELECT
        orders.*,
        packages.id AS package_id_rel,
        packages.name AS package_name,
        packages.slug AS package_slug,
        payments.id AS payment_id,
        payments.status AS payment_status,
        payments.amount AS payment_amount
      FROM orders
      LEFT JOIN packages ON packages.id = orders.package_id
      LEFT JOIN payments ON payments.order_id = orders.id
      WHERE orders.user_id = :userId
      ORDER BY orders.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    { userId }
  )

  return makePaginator(rows.map(formatOrderListItem), total, safePage, PAGE_SIZE)
}

async function orderDetail(config, userId, orderId) {
  const rows = await query(
    config,
    `
      SELECT orders.*, packages.name AS package_name, packages.slug AS package_slug,
             packages.description AS package_description, packages.price AS package_price,
             packages.currency AS package_currency
      FROM orders
      LEFT JOIN packages ON packages.id = orders.package_id
      WHERE orders.id = :orderId
        AND orders.user_id = :userId
      LIMIT 1
    `,
    { userId, orderId }
  )

  const order = rows[0]
  if (!order) return null

  const [addons, payments, invoiceRows, files] = await Promise.all([
    query(config, "SELECT * FROM order_addons WHERE order_id = :orderId ORDER BY id ASC", { orderId }),
    query(
      config,
      `
        SELECT payments.*, payment_methods.name AS payment_method_name,
               payment_methods.type AS payment_method_type
        FROM payments
        LEFT JOIN payment_methods ON payment_methods.id = payments.payment_method_id
        WHERE payments.order_id = :orderId
        LIMIT 1
      `,
      { orderId }
    ),
    query(config, "SELECT * FROM invoices WHERE order_id = :orderId LIMIT 1", { orderId }),
    orderFiles(config, userId, orderId),
  ])

  return {
    ...order,
    package: formatPackage(order),
    addons,
    payment: payments[0] ? formatPayment(payments[0]) : null,
    invoice: invoiceRows[0] ? formatInvoice(invoiceRows[0]) : null,
    files,
  }
}

async function orderFiles(config, userId, orderId) {
  const rows = await query(
    config,
    `
      SELECT order_files.*, users.id AS uploader_id, users.name AS uploader_name
      FROM order_files
      INNER JOIN orders ON orders.id = order_files.order_id
      LEFT JOIN users ON users.id = order_files.uploaded_by
      WHERE order_files.order_id = :orderId
        AND orders.user_id = :userId
      ORDER BY order_files.created_at DESC
    `,
    { userId, orderId }
  )

  return rows.map((file) => ({
    id: file.id,
    order_id: file.order_id,
    uploaded_by: file.uploaded_by,
    type: file.type,
    file_path: file.file_path,
    original_name: file.original_name,
    mime_type: file.mime_type,
    size: file.size,
    created_at: file.created_at,
    uploader: file.uploader_id ? { id: file.uploader_id, name: file.uploader_name } : null,
  }))
}

async function invoices(config, userId) {
  const rows = await query(
    config,
    `
      SELECT invoices.*, orders.order_number
      FROM invoices
      LEFT JOIN orders ON orders.id = invoices.order_id
      WHERE invoices.user_id = :userId
      ORDER BY invoices.created_at DESC
    `,
    { userId }
  )

  return rows.map((invoice) => ({
    ...formatInvoice(invoice),
    order: invoice.order_id ? { id: invoice.order_id, order_number: invoice.order_number } : null,
  }))
}

async function invoiceDetail(config, userId, invoiceId) {
  const rows = await query(
    config,
    `
      SELECT invoices.*, orders.order_number, packages.id AS package_id,
             packages.name AS package_name, packages.slug AS package_slug,
             packages.description AS package_description, packages.price AS package_price,
             packages.currency AS package_currency
      FROM invoices
      LEFT JOIN orders ON orders.id = invoices.order_id
      LEFT JOIN packages ON packages.id = orders.package_id
      WHERE invoices.id = :invoiceId
        AND invoices.user_id = :userId
      LIMIT 1
    `,
    { userId, invoiceId }
  )

  const invoice = rows[0]
  if (!invoice) return null

  return {
    ...formatInvoice(invoice),
    order: invoice.order_id
      ? {
          id: invoice.order_id,
          order_number: invoice.order_number,
          package: formatPackage(invoice),
        }
      : null,
  }
}

async function quotes(config, userId) {
  const rows = await query(
    config,
    "SELECT * FROM custom_quotes WHERE user_id = :userId ORDER BY created_at DESC",
    { userId }
  )

  return Promise.all(rows.map((quote) => quoteWithFiles(config, quote)))
}

async function quoteDetail(config, userId, quoteId) {
  const rows = await query(
    config,
    "SELECT * FROM custom_quotes WHERE id = :quoteId AND user_id = :userId LIMIT 1",
    { userId, quoteId }
  )

  if (!rows[0]) return null
  return quoteWithFiles(config, rows[0])
}

async function quoteWithFiles(config, quote) {
  const files = await query(
    config,
    "SELECT * FROM quote_files WHERE quote_id = :quoteId ORDER BY created_at DESC",
    { quoteId: quote.id }
  )

  return { ...quote, files }
}

async function notifications(config, userId) {
  const rows = await query(
    config,
    `
      SELECT *
      FROM user_notifications
      WHERE user_id = :userId
      ORDER BY created_at DESC
      LIMIT 50
    `,
    { userId }
  )

  const data = rows.map(formatNotification)
  return {
    data,
    unread: data.filter((notification) => !notification.read_at).length,
  }
}

async function markNotificationRead(config, userId, notificationId) {
  const result = await query(
    config,
    `
      UPDATE user_notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = :notificationId
        AND user_id = :userId
    `,
    { userId, notificationId }
  )

  return result.affectedRows > 0
}

async function markAllNotificationsRead(config, userId) {
  await query(
    config,
    `
      UPDATE user_notifications
      SET read_at = NOW()
      WHERE user_id = :userId
        AND read_at IS NULL
    `,
    { userId }
  )
}

function makePaginator(data, total, currentPage, perPage) {
  const lastPage = Math.max(1, Math.ceil(total / perPage))

  return {
    current_page: currentPage,
    data,
    first_page_url: null,
    from: total === 0 ? null : (currentPage - 1) * perPage + 1,
    last_page: lastPage,
    last_page_url: null,
    links: [],
    next_page_url: currentPage < lastPage ? null : null,
    path: null,
    per_page: perPage,
    prev_page_url: currentPage > 1 ? null : null,
    to: total === 0 ? null : Math.min(currentPage * perPage, total),
    total,
  }
}

function formatOrderListItem(order) {
  return {
    ...order,
    package: order.package_id_rel
      ? { id: order.package_id_rel, name: order.package_name, slug: order.package_slug }
      : null,
    payment: order.payment_id
      ? { id: order.payment_id, order_id: order.id, status: order.payment_status, amount: order.payment_amount }
      : null,
  }
}

function formatPackage(row) {
  if (!row.package_id && !row.package_id_rel) return null
  return {
    id: row.package_id_rel || row.package_id,
    name: row.package_name,
    slug: row.package_slug,
    description: row.package_description,
    price: row.package_price,
    currency: row.package_currency,
  }
}

function formatPayment(payment) {
  return {
    ...payment,
    payment_method: payment.payment_method_id
      ? {
          id: payment.payment_method_id,
          name: payment.payment_method_name,
          type: payment.payment_method_type,
        }
      : null,
  }
}

function formatInvoice(invoice) {
  return {
    ...invoice,
    line_items: parseJson(invoice.line_items, []),
  }
}

function formatNotification(notification) {
  return {
    ...notification,
    data: parseJson(notification.data, null),
  }
}

module.exports = {
  invoiceDetail,
  invoices,
  markAllNotificationsRead,
  markNotificationRead,
  notifications,
  orderDetail,
  orderFiles,
  paginatedOrders,
  quoteDetail,
  quotes,
}

const { query, withTransaction, clientQuery } = require("../db/postgres")

async function placeOrder(config, userId, data, req) {
  const packageRow = await findActivePackage(config, data.package_id)
  if (!packageRow) return { ok: false, statusCode: 422, errors: { package_id: ["The selected package is invalid."] } }

  const paymentMethod = await findActivePaymentMethod(config, data.payment_method_id)
  if (!paymentMethod) {
    return { ok: false, statusCode: 422, errors: { payment_method_id: ["The selected payment method is invalid."] } }
  }

  const addons = await activeAddonsByIds(config, data.addon_ids || [])
  if ((data.addon_ids || []).length !== addons.length) {
    return { ok: false, statusCode: 422, errors: { addon_ids: ["One or more selected add-ons are invalid."] } }
  }

  const addonsTotal = addons.reduce((total, addon) => total + Number(addon.price || 0), 0)
  const basePrice = Number(packageRow.price || 0)
  const totalPrice = basePrice + addonsTotal

  let orderId
  await withTransaction(config, async (client) => {
    const orderNumber = await nextOrderNumber(client)

    const orderResult = await clientQuery(client, `
      INSERT INTO orders
        (order_number, user_id, package_id, status, company_name, website_type,
         project_description, website_goals, existing_url, reference_urls,
         business_industry, base_price, addons_total, total_price, currency,
         created_at, updated_at)
      VALUES
        (:orderNumber, :userId, :packageId, 'pending_approval', :companyName, :websiteType,
         :projectDescription, :websiteGoals, :existingUrl, :referenceUrls,
         :businessIndustry, :basePrice, :addonsTotal, :totalPrice, :currency,
         NOW(), NOW())
    `, {
      orderNumber,
      userId,
      packageId: packageRow.id,
      companyName: data.company_name || null,
      websiteType: data.website_type || null,
      projectDescription: data.project_description,
      websiteGoals: data.website_goals || null,
      existingUrl: data.existing_url || null,
      referenceUrls: data.reference_urls || null,
      businessIndustry: data.business_industry || null,
      basePrice,
      addonsTotal,
      totalPrice,
      currency: packageRow.currency,
    })

    orderId = orderResult.insertId

    for (const addon of addons) {
      await clientQuery(client, `
        INSERT INTO order_addons (order_id, addon_id, price_snapshot, name_snapshot)
        VALUES (:orderId, :addonId, :price, :name)
      `, { orderId, addonId: addon.id, price: Number(addon.price || 0), name: addon.name })
    }

    await clientQuery(client, `
      INSERT INTO payments
        (order_id, user_id, payment_method_id, transaction_id, amount, currency, status, created_at, updated_at)
      VALUES
        (:orderId, :userId, :paymentMethodId, :transactionId, :amount, :currency, 'pending', NOW(), NOW())
    `, {
      orderId, userId, paymentMethodId: paymentMethod.id,
      transactionId: data.transaction_id || null,
      amount: totalPrice, currency: packageRow.currency,
    })

    await clientQuery(client, `
      INSERT INTO audit_logs
        (user_id, action, subject_type, subject_id, old_values, new_values, ip_address, user_agent, created_at)
      VALUES
        (:userId, 'order.created', 'App\\Models\\Order', :orderId, NULL, :newValues, :ipAddress, :userAgent, NOW())
    `, {
      userId, orderId,
      newValues: JSON.stringify({ status: "pending_approval" }),
      ipAddress: getIpAddress(req),
      userAgent: req.headers["user-agent"] || null,
    })

    await clientQuery(client, `
      INSERT INTO user_notifications
        (user_id, type, title, body, data, created_at)
      VALUES
        (:userId, 'order_placed', 'Order Placed Successfully', :body, :data, NOW())
    `, {
      userId,
      body: `Your order #${orderNumber} has been placed and is pending approval.`,
      data: JSON.stringify({ order_id: orderId }),
    })
  })

  return { ok: true, order: await checkoutOrderDetail(config, userId, orderId) }
}

async function checkoutOrderDetail(config, userId, orderId) {
  const rows = await query(
    config,
    `
      SELECT orders.*, packages.id AS package_rel_id, packages.name AS package_name,
             packages.slug AS package_slug, packages.description AS package_description,
             packages.price AS package_price, packages.currency AS package_currency
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

  const [addons, payments] = await Promise.all([
    query(config, "SELECT * FROM order_addons WHERE order_id = :orderId ORDER BY id ASC", { orderId }),
    query(config, "SELECT * FROM payments WHERE order_id = :orderId LIMIT 1", { orderId }),
  ])

  return {
    ...order,
    package: {
      id: order.package_rel_id,
      name: order.package_name,
      slug: order.package_slug,
      description: order.package_description,
      price: order.package_price,
      currency: order.package_currency,
    },
    addons,
    payment: payments[0] || null,
  }
}

async function findActivePackage(config, packageId) {
  const rows = await query(
    config,
    "SELECT * FROM packages WHERE id = :packageId AND is_active = 1 LIMIT 1",
    { packageId }
  )
  return rows[0] || null
}

async function findActivePaymentMethod(config, paymentMethodId) {
  const rows = await query(
    config,
    "SELECT * FROM payment_methods WHERE id = :paymentMethodId AND is_active = 1 LIMIT 1",
    { paymentMethodId }
  )
  return rows[0] || null
}

async function activeAddonsByIds(config, addonIds) {
  const ids = [...new Set(addonIds.map(Number).filter(Boolean))]
  if (ids.length === 0) return []

  const placeholders = ids.map((_, index) => `:id${index}`).join(", ")
  return query(
    config,
    `
      SELECT *
      FROM addons
      WHERE id IN (${placeholders})
        AND is_active = 1
      ORDER BY id ASC
    `,
    Object.fromEntries(ids.map((id, index) => [`id${index}`, id]))
  )
}

async function nextOrderNumber(client) {
  const year = new Date().getFullYear()
  const res = await client.query(
    "SELECT COUNT(*) AS count FROM orders WHERE EXTRACT(YEAR FROM created_at) = $1",
    [year]
  )
  const next = Number(res.rows[0]?.count || 0) + 1
  return `ORD-${year}${String(next).padStart(4, "0")}`
}

function getIpAddress(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (forwarded) return String(forwarded).split(",")[0].trim()
  return req.socket?.remoteAddress || null
}

module.exports = { placeOrder }

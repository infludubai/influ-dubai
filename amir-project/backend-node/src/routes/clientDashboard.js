const { authenticateSanctumRequest } = require("../repositories/authRepository")
const {
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
} = require("../repositories/clientDashboardRepository")
const { sendJson, sendNotFound } = require("../utils/http")

function clientDashboardRouter(req, res, url, config) {
  if (!url.pathname.startsWith(`${config.apiPrefix}/client/`)) return false

  handleClientDashboardRequest(req, res, url, config).catch((error) => {
    console.error("[node-api] Client dashboard route failed", error)
    sendJson(res, { message: "Failed to load client data." }, 500)
  })

  return true
}

async function handleClientDashboardRequest(req, res, url, config) {
  const auth = await authenticateSanctumRequest(config, req.headers.authorization)
  if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)

  const userId = auth.user.id
  const prefix = config.apiPrefix

  if (req.method === "GET" && url.pathname === `${prefix}/client/orders`) {
    return sendJson(res, await paginatedOrders(config, userId, url.searchParams.get("page")))
  }

  const orderMatch = url.pathname.match(new RegExp(`^${escapeRegExp(prefix)}/client/orders/(\\d+)$`))
  if (req.method === "GET" && orderMatch) {
    const order = await orderDetail(config, userId, Number(orderMatch[1]))
    return order ? sendJson(res, { data: order }) : sendNotFound(res, "Order not found.")
  }

  const orderFilesMatch = url.pathname.match(new RegExp(`^${escapeRegExp(prefix)}/client/orders/(\\d+)/files$`))
  if (req.method === "GET" && orderFilesMatch) {
    return sendJson(res, { data: await orderFiles(config, userId, Number(orderFilesMatch[1])) })
  }

  if (req.method === "GET" && url.pathname === `${prefix}/client/invoices`) {
    return sendJson(res, { data: await invoices(config, userId) })
  }

  const invoiceMatch = url.pathname.match(new RegExp(`^${escapeRegExp(prefix)}/client/invoices/(\\d+)$`))
  if (req.method === "GET" && invoiceMatch) {
    const invoice = await invoiceDetail(config, userId, Number(invoiceMatch[1]))
    return invoice ? sendJson(res, { data: invoice }) : sendNotFound(res, "Invoice not found.")
  }

  if (req.method === "GET" && url.pathname === `${prefix}/client/quotes`) {
    return sendJson(res, { data: await quotes(config, userId) })
  }

  const quoteMatch = url.pathname.match(new RegExp(`^${escapeRegExp(prefix)}/client/quotes/(\\d+)$`))
  if (req.method === "GET" && quoteMatch) {
    const quote = await quoteDetail(config, userId, Number(quoteMatch[1]))
    return quote ? sendJson(res, { data: quote }) : sendNotFound(res, "Quote not found.")
  }

  if (req.method === "GET" && url.pathname === `${prefix}/client/notifications`) {
    return sendJson(res, await notifications(config, userId))
  }

  const notificationMatch = url.pathname.match(new RegExp(`^${escapeRegExp(prefix)}/client/notifications/(\\d+)/read$`))
  if (req.method === "POST" && notificationMatch) {
    const marked = await markNotificationRead(config, userId, Number(notificationMatch[1]))
    return marked ? sendJson(res, { message: "Marked as read." }) : sendNotFound(res, "Notification not found.")
  }

  if (req.method === "POST" && url.pathname === `${prefix}/client/notifications/read-all`) {
    await markAllNotificationsRead(config, userId)
    return sendJson(res, { message: "All notifications marked as read." })
  }

  return sendNotFound(res, "Client API route not migrated to Node yet.")
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

module.exports = { clientDashboardRouter }

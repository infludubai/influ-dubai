const { authenticateSanctumRequest, findUserById } = require("../repositories/authRepository")
const admin = require("../repositories/adminRepository")
const { sendJson, sendNotFound } = require("../utils/http")
const { readJsonBody } = require("../utils/request")
const { parseMultipart } = require("../utils/multipart")
const { storeFile, getUploadDir } = require("../utils/storage")
const { sendSms } = require("../services/smsService")
const { query } = require("../db/postgres")
const { sendOrderStatusEmail, sendPaymentStatusEmail } = require("../services/mailService")

function requireAdmin(auth) {
  return auth && auth.user.role === "admin"
}

function routeMatch(url, config, path, method, req) {
  const fullPath = `${config.apiPrefix}/admin/${path}`
  return url.pathname === fullPath && req.method === method
}

function routeMatchPattern(url, config, pattern) {
  const prefix = `${config.apiPrefix}/admin/`
  if (!url.pathname.startsWith(prefix)) return null
  const rest = url.pathname.slice(prefix.length)
  const parts = rest.split("/")
  const patternParts = pattern.split("/")
  if (parts.length !== patternParts.length) return null
  const params = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = parts[i]
    } else if (patternParts[i] !== parts[i]) {
      return null
    }
  }
  return params
}

function adminRouter(req, res, url, config) {
  if (!url.pathname.startsWith(`${config.apiPrefix}/admin/`)) return false

  handleAdmin(req, res, url, config).catch((err) => {
    console.error("[node-api] Admin route error", err)
    sendJson(res, { message: "Internal server error." }, 500)
  })

  return true
}

async function handleAdmin(req, res, url, config) {
  const auth = await authenticateSanctumRequest(config, req.headers.authorization)
  if (!requireAdmin(auth)) return sendJson(res, { message: "Unauthorized." }, 403)

  const prefix = `${config.apiPrefix}/admin`
  const path = url.pathname.slice(prefix.length + 1)
  const method = req.method

  // ── Dashboard ──────────────────────────────────────────────────────────
  if (path === "dashboard" && method === "GET") {
    const stats = await admin.getDashboardStats(config)
    return sendJson(res, { data: stats })
  }

  // ── Orders ─────────────────────────────────────────────────────────────
  if (path === "orders" && method === "GET") {
    const result = await admin.listOrders(config, {
      page: url.searchParams.get("page"),
      status: url.searchParams.get("status"),
      search: url.searchParams.get("search"),
      perPage: url.searchParams.get("per_page"),
    })
    return sendJson(res, result)
  }

  const orderMatch = routeMatchPattern(url, config, "orders/:id")
  if (orderMatch) {
    const orderId = Number(orderMatch.id)
    if (method === "GET") {
      const order = await admin.getOrderById(config, orderId)
      if (!order) return sendNotFound(res, "Order not found.")
      return sendJson(res, { data: order })
    }
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const order = await admin.updateOrderStatus(config, orderId, body.status, body.admin_notes)
      if (order?.user?.email) sendOrderStatusEmail(config, order, order.user)
      return sendJson(res, { data: order, message: "Order updated." })
    }
  }

  // ── Payments ───────────────────────────────────────────────────────────
  if (path === "payments" && method === "GET") {
    const result = await admin.listPayments(config, {
      page: url.searchParams.get("page"),
      status: url.searchParams.get("status"),
    })
    return sendJson(res, result)
  }

  const verifyMatch = routeMatchPattern(url, config, "payments/:id/verify")
  if (verifyMatch && method === "POST") {
    const paymentId = Number(verifyMatch.id)
    const payRows = await query(config, "SELECT order_id FROM payments WHERE id = :id LIMIT 1", { id: paymentId })
    await admin.verifyPayment(config, paymentId, auth.user.id)
    if (payRows[0]?.order_id) {
      admin.getOrderById(config, payRows[0].order_id).then(order => {
        if (order?.user_id) findUserById(config, order.user_id).then(u => { if (u) sendPaymentStatusEmail(config, order, u, true) }).catch(() => {})
      }).catch(() => {})
    }
    return sendJson(res, { message: "Payment verified." })
  }

  const rejectMatch = routeMatchPattern(url, config, "payments/:id/reject")
  if (rejectMatch && method === "POST") {
    const body = await readJsonBody(req)
    const paymentId = Number(rejectMatch.id)
    const payRows = await query(config, "SELECT order_id FROM payments WHERE id = :id LIMIT 1", { id: paymentId })
    await admin.rejectPayment(config, paymentId, body.reason)
    if (payRows[0]?.order_id) {
      admin.getOrderById(config, payRows[0].order_id).then(order => {
        if (order?.user_id) findUserById(config, order.user_id).then(u => { if (u) sendPaymentStatusEmail(config, order, u, false, body.reason) }).catch(() => {})
      }).catch(() => {})
    }
    return sendJson(res, { message: "Payment rejected." })
  }

  // ── Users ──────────────────────────────────────────────────────────────
  if (path === "users" && method === "GET") {
    const result = await admin.listUsers(config, {
      page: url.searchParams.get("page"),
      search: url.searchParams.get("search"),
    })
    return sendJson(res, result)
  }

  const userToggleMatch = routeMatchPattern(url, config, "users/:id/toggle-active")
  if (userToggleMatch && method === "POST") {
    const body = await readJsonBody(req)
    await admin.toggleUserActive(config, Number(userToggleMatch.id), body.is_active)
    return sendJson(res, { message: "User updated." })
  }

  // ── Packages ───────────────────────────────────────────────────────────
  if (path === "packages" && method === "GET") {
    const data = await admin.listPackagesAdmin(config)
    return sendJson(res, { data })
  }
  if (path === "packages" && method === "POST") {
    const body = await readJsonBody(req)
    const pkg = await admin.createPackage(config, body)
    return sendJson(res, { data: pkg, message: "Package created." }, 201)
  }

  const packageMatch = routeMatchPattern(url, config, "packages/:id")
  if (packageMatch) {
    const id = Number(packageMatch.id)
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const pkg = await admin.updatePackage(config, id, body)
      return sendJson(res, { data: pkg, message: "Package updated." })
    }
    if (method === "DELETE") {
      await admin.deletePackage(config, id)
      return sendJson(res, { message: "Package deleted." })
    }
  }

  // ── Addons ─────────────────────────────────────────────────────────────
  if (path === "addons" && method === "GET") {
    const data = await admin.listAddonsAdmin(config)
    return sendJson(res, { data })
  }
  if (path === "addons" && method === "POST") {
    const body = await readJsonBody(req)
    const addon = await admin.createAddon(config, body)
    return sendJson(res, { data: addon, message: "Addon created." }, 201)
  }

  const addonMatch = routeMatchPattern(url, config, "addons/:id")
  if (addonMatch) {
    const id = Number(addonMatch.id)
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const addon = await admin.updateAddon(config, id, body)
      return sendJson(res, { data: addon, message: "Addon updated." })
    }
    if (method === "DELETE") {
      await admin.deleteAddon(config, id)
      return sendJson(res, { message: "Addon deleted." })
    }
  }

  // ── Payment Methods ────────────────────────────────────────────────────
  if (path === "payment-methods" && method === "GET") {
    const data = await admin.listPaymentMethodsAdmin(config)
    return sendJson(res, { data })
  }
  if (path === "payment-methods" && method === "POST") {
    const body = await readJsonBody(req)
    const pm = await admin.createPaymentMethod(config, body)
    return sendJson(res, { data: pm, message: "Payment method created." }, 201)
  }

  const pmMatch = routeMatchPattern(url, config, "payment-methods/:id")
  if (pmMatch) {
    const id = Number(pmMatch.id)
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const pm = await admin.updatePaymentMethod(config, id, body)
      return sendJson(res, { data: pm, message: "Payment method updated." })
    }
    if (method === "DELETE") {
      await admin.deletePaymentMethod(config, id)
      return sendJson(res, { message: "Payment method deleted." })
    }
  }

  // ── Blog ───────────────────────────────────────────────────────────────
  if (path === "blog" && method === "GET") {
    const result = await admin.listBlogAdmin(config, { page: url.searchParams.get("page") })
    return sendJson(res, result)
  }
  if (path === "blog" && method === "POST") {
    const body = await readJsonBody(req)
    const post = await admin.createBlogPost(config, auth.user.id, body)
    return sendJson(res, { data: post, message: "Blog post created." }, 201)
  }

  const blogMatch = routeMatchPattern(url, config, "blog/:id")
  if (blogMatch) {
    const id = Number(blogMatch.id)
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const post = await admin.updateBlogPost(config, id, body)
      return sendJson(res, { data: post, message: "Blog post updated." })
    }
    if (method === "DELETE") {
      await admin.deleteBlogPost(config, id)
      return sendJson(res, { message: "Blog post deleted." })
    }
  }

  // ── Portfolio ──────────────────────────────────────────────────────────
  if (path === "portfolio" && method === "GET") {
    const data = await admin.listPortfolioAdmin(config)
    return sendJson(res, { data })
  }
  if (path === "portfolio" && method === "POST") {
    const body = await readJsonBody(req)
    const item = await admin.createPortfolioItem(config, body)
    return sendJson(res, { data: item, message: "Portfolio item created." }, 201)
  }

  const portfolioMatch = routeMatchPattern(url, config, "portfolio/:id")
  if (portfolioMatch) {
    const id = Number(portfolioMatch.id)
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const item = await admin.updatePortfolioItem(config, id, body)
      return sendJson(res, { data: item, message: "Portfolio item updated." })
    }
    if (method === "DELETE") {
      await admin.deletePortfolioItem(config, id)
      return sendJson(res, { message: "Portfolio item deleted." })
    }
  }

  // ── Settings ───────────────────────────────────────────────────────────
  if (path === "settings" && method === "GET") {
    const rows = await admin.getAllSettings(config)
    return sendJson(res, { data: rows })
  }
  if (path === "settings" && method === "PUT") {
    const body = await readJsonBody(req)
    if (body.settings && typeof body.settings === "object") {
      await admin.saveSettings(config, body.settings)
    }
    return sendJson(res, { message: "Settings saved." })
  }

  // ── Quotes ─────────────────────────────────────────────────────────────
  if (path === "quotes" && method === "GET") {
    const result = await admin.listQuotesAdmin(config, {
      page: url.searchParams.get("page"),
      status: url.searchParams.get("status"),
    })
    return sendJson(res, result)
  }

  const quoteMatch = routeMatchPattern(url, config, "quotes/:id")
  if (quoteMatch && (method === "PUT" || method === "PATCH")) {
    const body = await readJsonBody(req)
    const quote = await admin.updateQuote(config, Number(quoteMatch.id), body)
    return sendJson(res, { data: quote, message: "Quote updated." })
  }

  // ── Chats ──────────────────────────────────────────────────────────────
  if (path === "chats" && method === "GET") {
    const data = await admin.listChatsAdmin(config)
    return sendJson(res, { data })
  }

  const chatMsgMatch = routeMatchPattern(url, config, "chats/:chatId/messages")
  if (chatMsgMatch) {
    if (method === "GET") {
      const msgs = await admin.getChatMessages(config, Number(chatMsgMatch.chatId))
      await admin.markAdminMessagesRead(config, Number(chatMsgMatch.chatId))
      return sendJson(res, { data: msgs })
    }
    if (method === "POST") {
      const body = await readJsonBody(req)
      const msg = await admin.sendAdminMessage(config, Number(chatMsgMatch.chatId), body.body)
      return sendJson(res, { data: msg }, 201)
    }
  }

  const chatTypingMatch = routeMatchPattern(url, config, "chats/:chatId/typing")
  if (chatTypingMatch && method === "POST") {
    await admin.setAdminTyping(config, Number(chatTypingMatch.chatId))
    return sendJson(res, { message: "ok" })
  }

  const chatTypingStatusMatch = routeMatchPattern(url, config, "chats/:chatId/typing-status")
  if (chatTypingStatusMatch && method === "GET") {
    const status = await admin.getTypingStatus(config, Number(chatTypingStatusMatch.chatId))
    return sendJson(res, { data: status })
  }

  // ── Invoices ───────────────────────────────────────────────────────────
  if (path === "invoices" && method === "GET") {
    const result = await admin.listInvoicesAdmin(config, { page: url.searchParams.get("page") })
    return sendJson(res, result)
  }
  if (path === "invoices" && method === "POST") {
    const body = await readJsonBody(req)
    const invoice = await admin.createInvoice(config, body)
    return sendJson(res, { data: invoice, message: "Invoice created." }, 201)
  }

  const invoiceMatch = routeMatchPattern(url, config, "invoices/:id")
  if (invoiceMatch && method === "GET") {
    const invoice = await admin.getInvoiceById(config, Number(invoiceMatch.id))
    if (!invoice) return sendNotFound(res, "Invoice not found.")
    return sendJson(res, { data: invoice })
  }

  const invoicePaidMatch = routeMatchPattern(url, config, "invoices/:id/mark-paid")
  if (invoicePaidMatch && method === "POST") {
    const invoice = await admin.markInvoicePaid(config, Number(invoicePaidMatch.id))
    return sendJson(res, { data: invoice, message: "Invoice marked as paid." })
  }

  const invoiceSendMatch = routeMatchPattern(url, config, "invoices/:id/send")
  if (invoiceSendMatch && method === "POST") {
    const body = await readJsonBody(req)
    if (!body.email || !body.email.includes("@")) {
      return sendJson(res, { message: "A valid email is required." }, 422)
    }
    const invoice = await admin.getInvoiceById(config, Number(invoiceSendMatch.id))
    if (!invoice) return sendNotFound(res, "Invoice not found.")

    const { sendInvoiceEmail } = require("../services/mailService")
    await sendInvoiceEmail(config, invoice, body.email)
    await admin.markInvoiceSent(config, invoice.id)
    return sendJson(res, { message: `Invoice sent to ${body.email}.` })
  }

  // ── Dashboard Stats ────────────────────────────────────────────────────
  if (path === "stats" && method === "GET") {
    const stats = await admin.getDashboardStats(config)
    return sendJson(res, { data: stats })
  }

  // ── Builder ────────────────────────────────────────────────────────────
  const builderSaveMatch = routeMatchPattern(url, config, "builder/:slug/save")
  if (builderSaveMatch && method === "POST") {
    const body = await readJsonBody(req)
    const page = await admin.saveBuilderPage(config, builderSaveMatch.slug, body.layout, auth.user.id)
    return sendJson(res, { data: page, message: "Page saved." })
  }

  const builderPublishMatch = routeMatchPattern(url, config, "builder/:slug/publish")
  if (builderPublishMatch && method === "POST") {
    const body = await readJsonBody(req)
    if (body.layout) await admin.saveBuilderPage(config, builderPublishMatch.slug, body.layout, auth.user.id)
    await admin.publishBuilderPage(config, builderPublishMatch.slug)
    return sendJson(res, { message: "Page published." })
  }

  const builderGetMatch = routeMatchPattern(url, config, "builder/:slug")
  if (builderGetMatch && method === "GET") {
    const page = await admin.getBuilderPage(config, builderGetMatch.slug)
    return sendJson(res, { data: page })
  }

  // ── Builder pages list ─────────────────────────────────────────────────
  if (path === "builder/pages" && method === "GET") {
    const pages = await admin.listBuilderPages(config)
    return sendJson(res, { data: pages })
  }

  // ── Users full CRUD ────────────────────────────────────────────────────
  if (path === "users" && method === "POST") {
    const body = await readJsonBody(req)
    const user = await admin.createUser(config, body)
    return sendJson(res, { data: user, message: "User created." }, 201)
  }

  const userMatch = routeMatchPattern(url, config, "users/:id")
  if (userMatch) {
    const id = Number(userMatch.id)
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      const user = await admin.adminUpdateUser(config, id, body)
      return sendJson(res, { data: user, message: "User updated." })
    }
    if (method === "DELETE") {
      await admin.adminDeleteUser(config, id)
      return sendJson(res, { message: "User deleted." })
    }
  }

  // ── Blog categories ────────────────────────────────────────────────────
  if (path === "blog-categories" && method === "GET") {
    const data = await admin.listBlogCategories(config)
    return sendJson(res, { data })
  }
  if (path === "blog-categories" && method === "POST") {
    const body = await readJsonBody(req)
    const cat = await admin.createBlogCategory(config, body.name)
    return sendJson(res, { data: cat, message: "Category created." }, 201)
  }

  const catDeleteMatch = routeMatchPattern(url, config, "blog-categories/:id")
  if (catDeleteMatch && method === "DELETE") {
    await admin.deleteBlogCategory(config, Number(catDeleteMatch.id))
    return sendJson(res, { message: "Category deleted." })
  }

  // ── Dashboard recent orders + revenue ──────────────────────────────────
  if (path === "recent-orders" && method === "GET") {
    const data = await admin.getRecentOrders(config)
    return sendJson(res, { data })
  }

  if (path === "revenue-chart" && method === "GET") {
    const data = await admin.getRevenueChart(config)
    return sendJson(res, { data })
  }

  // ── Settings extras ────────────────────────────────────────────────────
  if (path === "settings/test-email" && method === "POST") {
    const body = await readJsonBody(req)
    const { sendEmail, getSmtpSettings, getResendApiKey } = require("../services/mailService")
    const smtp = await getSmtpSettings(config)
    const to = body.to || smtp.fromAddress
    try {
      const result = await sendEmail(config, {
        to,
        subject: "Test Email from Amir Nazir Platform",
        text: "This is a test email. Your email configuration is working correctly!",
        html: "<p>This is a test email. Your email configuration is working correctly!</p>",
      })
      if (!result) return sendJson(res, { ok: false, message: "No email provider configured. Add RESEND_API_KEY to Railway env vars." }, 422)
      return sendJson(res, { ok: true, message: `Test email sent to ${to} via ${result.via}.`, result })
    } catch (err) {
      console.error("[node-api] test-email error", err)
      return sendJson(res, { ok: false, message: err.message }, 500)
    }
  }

  if (path === "settings/clear-cache" && method === "POST") {
    // Node has no file-based cache — just acknowledge
    return sendJson(res, { message: "Cache cleared." })
  }

  // ── Portfolio reorder ──────────────────────────────────────────────────
  if (path === "portfolio/reorder" && method === "POST") {
    const body = await readJsonBody(req)
    if (Array.isArray(body.ids)) {
      await admin.reorderPortfolio(config, body.ids)
    }
    return sendJson(res, { message: "Portfolio reordered." })
  }

  // ── Admin chat SMS send ────────────────────────────────────────────────
  const smsSendMatch = routeMatchPattern(url, config, "chats/:chatId/send-sms")
  if (smsSendMatch && method === "POST") {
    const body = await readJsonBody(req)
    if (!body.body?.trim()) return sendJson(res, { message: "Message body is required." }, 422)

    const chatId = Number(smsSendMatch.chatId)

    // Get client phone number from chat user
    const chatRows = await query(config, `
      SELECT users.phone FROM chats
      LEFT JOIN users ON users.id = chats.user_id
      WHERE chats.id = :chatId LIMIT 1
    `, { chatId })

    const phone = chatRows[0]?.phone
    if (!phone) return sendJson(res, { message: "Client has no phone number on file." }, 422)

    // Send real SMS via Twilio
    let smsResult = null
    try {
      smsResult = await sendSms(config, phone, body.body)
    } catch (smsErr) {
      return sendJson(res, { message: smsErr.message }, 422)
    }

    // Store the message record
    const msg = await admin.sendAdminMessage(config, chatId, body.body, "admin")

    // Update message with SMS metadata
    await query(config, `
      UPDATE messages SET channel = 'sms', sms_sid = :sid, sms_status = :status
      WHERE id = :id
    `, { sid: smsResult.sid, status: smsResult.status, id: msg.id }).catch(() => {})

    return sendJson(res, { data: msg, sms: smsResult, message: "SMS sent successfully." })
  }

  // ── Admin chat file upload ──────────────────────────────────────────────
  const adminChatFileMatch = routeMatchPattern(url, config, "chats/:chatId/messages/:messageId/files")
  if (adminChatFileMatch && method === "POST") {
    const chatId = Number(adminChatFileMatch.chatId)
    const messageId = Number(adminChatFileMatch.messageId)
    const { files } = await parseMultipart(req)
    if (!files.length) return sendJson(res, { message: "No file uploaded." }, 422)

    const saved = []
    for (const file of files) {
      const relativePath = await storeFile(file.path, "chat-files")
      const result = await query(config, `
        INSERT INTO message_files (message_id, file_path, original_name, mime_type, size, created_at, updated_at)
        VALUES (:messageId, :filePath, :originalName, :mimeType, :size, NOW(), NOW())
      `, {
        messageId,
        filePath: relativePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      })
      saved.push({ id: result.insertId, file_path: relativePath, original_name: file.originalname })
    }
    return sendJson(res, { data: saved }, 201)
  }

  // ── Email templates ────────────────────────────────────────────────────
  if (path === "email-templates" && method === "GET") {
    const data = await admin.listEmailTemplates(config)
    return sendJson(res, { data })
  }

  const tmplMatch = routeMatchPattern(url, config, "email-templates/:key")
  if (tmplMatch) {
    if (method === "GET") {
      const tmpl = await admin.getEmailTemplate(config, tmplMatch.key)
      return sendJson(res, { data: tmpl })
    }
    if (method === "PUT" || method === "PATCH") {
      const body = await readJsonBody(req)
      await admin.saveEmailTemplate(config, tmplMatch.key, body.content)
      return sendJson(res, { message: "Template updated." })
    }
  }

  return sendNotFound(res, "Admin route not found.")
}

module.exports = { adminRouter }

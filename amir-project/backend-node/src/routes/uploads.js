/**
 * All file-upload endpoints:
 *   POST /checkout/upload-screenshot
 *   POST /client/orders/:id/files
 *   POST /client/quotes/:id/files
 *   POST /admin/orders/:id/files
 *   POST /admin/blog/upload-image
 *   POST /admin/settings/upload-image
 *   GET  /client/invoices/:id/download
 *   GET  /admin/invoices/:id/download
 */
const { authenticateSanctumRequest } = require("../repositories/authRepository")
const { getInvoiceById } = require("../repositories/adminRepository")
const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")
const { listFiles } = require("../utils/storage")
const { parseMultipart } = require("../utils/multipart")
const { storeFile, getPublicUrl } = require("../utils/storage")
const { buildInvoiceHtml } = require("../utils/pdf")

function uploadsRouter(req, res, url, config) {
  const p = url.pathname
  const pre = config.apiPrefix

  // ── Checkout screenshot ────────────────────────────────────────────────
  if (p === `${pre}/checkout/upload-screenshot` && req.method === "POST") {
    return handle(req, res, config, handleCheckoutScreenshot)
  }

  // ── Client order files ─────────────────────────────────────────────────
  const clientOrderFile = p.match(new RegExp(`^${esc(pre)}/client/orders/(\\d+)/files$`))
  if (clientOrderFile && req.method === "POST") {
    return handle(req, res, config, (req, res, auth, config) =>
      handleOrderFile(req, res, auth, config, Number(clientOrderFile[1]), "client"))
  }

  // ── Client quote files ─────────────────────────────────────────────────
  const clientQuoteFile = p.match(new RegExp(`^${esc(pre)}/client/quotes/(\\d+)/files$`))
  if (clientQuoteFile && req.method === "POST") {
    return handle(req, res, config, (req, res, auth, config) =>
      handleQuoteFile(req, res, auth, config, Number(clientQuoteFile[1])))
  }

  // ── Admin order delivery files ─────────────────────────────────────────
  const adminOrderFile = p.match(new RegExp(`^${esc(pre)}/admin/orders/(\\d+)/files$`))
  if (adminOrderFile && req.method === "POST") {
    return handle(req, res, config, (req, res, auth, config) =>
      handleOrderFile(req, res, auth, config, Number(adminOrderFile[1]), "admin"))
  }

  // ── Admin blog image upload ────────────────────────────────────────────
  if (p === `${pre}/admin/blog/upload-image` && req.method === "POST") {
    return handle(req, res, config, handleBlogImage, true)
  }

  // ── Admin settings image upload ────────────────────────────────────────
  if (p === `${pre}/admin/settings/upload-image` && req.method === "POST") {
    return handle(req, res, config, handleSettingsImage, true)
  }

  // ── Admin settings image library ───────────────────────────────────────
  if (p === `${pre}/admin/settings/images` && req.method === "GET") {
    return handle(req, res, config, async (_req, res) => {
      const images = await listFiles("settings")
      sendJson(res, { data: images })
    }, true)
  }

  // ── Invoice PDF download (client) ──────────────────────────────────────
  const clientInvoice = p.match(new RegExp(`^${esc(pre)}/client/invoices/(\\d+)/download$`))
  if (clientInvoice && req.method === "GET") {
    return handle(req, res, config, (req, res, auth, config) =>
      handleInvoiceDownload(req, res, auth, config, Number(clientInvoice[1]), false))
  }

  // ── Invoice PDF download (admin) ───────────────────────────────────────
  const adminInvoice = p.match(new RegExp(`^${esc(pre)}/admin/invoices/(\\d+)/download$`))
  if (adminInvoice && req.method === "GET") {
    return handle(req, res, config, (req, res, auth, config) =>
      handleInvoiceDownload(req, res, auth, config, Number(adminInvoice[1]), true))
  }

  return false
}

// Auth wrapper
function handle(req, res, config, fn, requireAdmin = false) {
  async function run() {
    const auth = await authenticateSanctumRequest(config, req.headers.authorization)
    if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)
    if (requireAdmin && auth.user.role !== "admin") return sendJson(res, { message: "Unauthorized." }, 403)
    await fn(req, res, auth, config)
  }
  run().catch(err => {
    console.error("[node-api] Upload error", err)
    sendJson(res, { message: err.message || "Upload failed." }, err.statusCode || 500)
  })
  return true
}

async function handleCheckoutScreenshot(req, res, auth, config) {
  const { files } = await parseMultipart(req)
  if (!files.length) return sendJson(res, { message: "No file uploaded." }, 422)

  const file = files[0]
  if (!file.mimetype.startsWith("image/")) {
    return sendJson(res, { message: "Only image files are allowed." }, 422)
  }

  const relativePath = await storeFile(file.path, "payments")

  const orders = await query(config, `
    SELECT id FROM orders WHERE user_id = :userId AND status = 'pending_approval'
    ORDER BY created_at DESC LIMIT 1
  `, { userId: auth.user.id })

  if (orders[0]) {
    await query(config, `
      INSERT INTO payments (order_id, screenshot_path, status, created_at, updated_at)
      VALUES (:orderId, :path, 'pending', NOW(), NOW())
      ON CONFLICT (order_id) DO UPDATE SET screenshot_path = EXCLUDED.screenshot_path, updated_at = NOW()
    `, { orderId: orders[0].id, path: relativePath }).catch(() => {})
  }

  return sendJson(res, { message: "Screenshot uploaded.", path: relativePath })
}

const ALLOWED_ORDER_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
  "application/zip", "application/x-zip-compressed",
])

async function handleOrderFile(req, res, auth, config, orderId, actor) {
  const { files } = await parseMultipart(req)
  if (!files.length) return sendJson(res, { message: "No file uploaded." }, 422)

  const saved = []
  for (const file of files) {
    if (!ALLOWED_ORDER_MIMES.has(file.mimetype)) {
      return sendJson(res, { message: "File type not allowed. Permitted: images, PDF, Word, Excel, plain text, ZIP." }, 422)
    }
    const relativePath = await storeFile(file.path, "order-files")
    const result = await query(config, `
      INSERT INTO order_files (order_id, uploaded_by, type, file_path, original_name, mime_type, size, created_at, updated_at)
      VALUES (:orderId, :userId, :type, :filePath, :originalName, :mimeType, :size, NOW(), NOW())
    `, {
      orderId,
      userId: auth.user.id,
      type: actor === "admin" ? "delivery" : "requirement",
      filePath: relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })
    saved.push({ id: result.insertId, file_path: relativePath, original_name: file.originalname })
  }
  return sendJson(res, { data: saved, message: "File(s) uploaded." }, 201)
}

async function handleQuoteFile(req, res, auth, config, quoteId) {
  const { files } = await parseMultipart(req)
  if (!files.length) return sendJson(res, { message: "No file uploaded." }, 422)

  const saved = []
  for (const file of files) {
    if (!ALLOWED_ORDER_MIMES.has(file.mimetype)) {
      return sendJson(res, { message: "File type not allowed. Permitted: images, PDF, Word, Excel, plain text, ZIP." }, 422)
    }
    const relativePath = await storeFile(file.path, "quote-files")
    const result = await query(config, `
      INSERT INTO quote_files (quote_id, file_path, original_name, mime_type, size, created_at, updated_at)
      VALUES (:quoteId, :filePath, :originalName, :mimeType, :size, NOW(), NOW())
    `, {
      quoteId,
      filePath: relativePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })
    saved.push({ id: result.insertId, file_path: relativePath, original_name: file.originalname })
  }
  return sendJson(res, { data: saved, message: "File(s) uploaded." }, 201)
}

async function handleBlogImage(req, res, auth, config) {
  const { files } = await parseMultipart(req)
  if (!files.length) return sendJson(res, { message: "No file uploaded." }, 422)

  const file = files[0]
  if (!file.mimetype.startsWith("image/")) {
    return sendJson(res, { message: "Only images are allowed." }, 422)
  }

  const relativePath = await storeFile(file.path, "blog")
  return sendJson(res, { url: getPublicUrl(relativePath) })
}

async function handleSettingsImage(req, res, auth, config) {
  const { files, fields } = await parseMultipart(req)
  if (!files.length) return sendJson(res, { message: "No file uploaded." }, 422)

  const file = files[0]
  if (!file.mimetype.startsWith("image/")) {
    return sendJson(res, { message: "Only image files are allowed." }, 422)
  }
  const relativePath = await storeFile(file.path, "settings")
  const url = getPublicUrl(relativePath)

  const key = fields.key
  if (key) {
    await query(config, `
      INSERT INTO settings ("key", "value", created_at, updated_at)
      VALUES (:key, :url, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()
    `, { key, url })
  }

  return sendJson(res, { url, message: "Image uploaded." })
}

async function handleInvoiceDownload(req, res, auth, config, invoiceId, isAdmin) {
  const invoice = await getInvoiceById(config, invoiceId)
  if (!invoice) return sendJson(res, { message: "Invoice not found." }, 404)

  if (!isAdmin && invoice.user_id !== auth.user.id) {
    return sendJson(res, { message: "Forbidden." }, 403)
  }

  // Use main logo — displayed on a white background card so any logo color works
  const logoRows = await query(config, `SELECT "value" FROM settings WHERE "key" = 'logo_url' LIMIT 1`).catch(() => [])
  const logoUrl = logoRows[0]?.value || null

  const html = buildInvoiceHtml(invoice, logoUrl)
  const body = Buffer.from(html, "utf8")

  // Serve inline so the browser renders it — frontend opens in a new tab.
  // The page itself has a "Save as PDF" button that calls window.print().
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  })
  res.end(body)
}

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

module.exports = { uploadsRouter }

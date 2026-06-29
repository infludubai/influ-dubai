const { authenticateSanctumRequest } = require("../repositories/authRepository")
const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")
const { parseMultipart } = require("../utils/multipart")
const { storeFile, getPublicUrl } = require("../utils/storage")

function clientChatsRouter(req, res, url, config) {
  if (!url.pathname.startsWith(`${config.apiPrefix}/client/chats`)) return false

  handle(req, res, url, config).catch((err) => {
    console.error("[node-api] Client chats error", err)
    sendJson(res, { message: "Internal server error." }, 500)
  })

  return true
}

async function handle(req, res, url, config) {
  const auth = await authenticateSanctumRequest(config, req.headers.authorization)
  if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)

  const userId = auth.user.id
  const prefix = `${config.apiPrefix}/client/chats`
  const rest = url.pathname.slice(prefix.length)
  const method = req.method

  // GET /client/chats — list user's chats
  if (rest === "" && method === "GET") {
    const rows = await query(config, `
      SELECT chats.*,
        (SELECT body FROM messages WHERE chat_id = chats.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE chat_id = chats.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*) FROM messages WHERE chat_id = chats.id AND sender_type = 'admin' AND read_at IS NULL) AS unread_client
      FROM chats WHERE chats.user_id = :userId ORDER BY last_message_at DESC, chats.created_at DESC
    `, { userId })
    return sendJson(res, { data: rows })
  }

  // POST /client/chats — create or return existing chat
  if (rest === "" && method === "POST") {
    const existing = await query(config, "SELECT * FROM chats WHERE user_id = :userId ORDER BY created_at DESC LIMIT 1", { userId })
    if (existing[0]) return sendJson(res, { data: existing[0] }, 200)

    const result = await query(config, "INSERT INTO chats (user_id, created_at, updated_at) VALUES (:userId, NOW(), NOW())", { userId })
    const rows = await query(config, "SELECT * FROM chats WHERE id = :id LIMIT 1", { id: result.insertId })
    return sendJson(res, { data: rows[0] }, 201)
  }

  // /client/chats/:id/...
  const chatIdMatch = rest.match(/^\/(\d+)/)
  if (!chatIdMatch) return sendJson(res, { message: "Route not found." }, 404)

  const chatId = Number(chatIdMatch[1])
  const afterId = rest.slice(chatIdMatch[0].length)

  // Verify chat belongs to user
  const chatRows = await query(config, "SELECT * FROM chats WHERE id = :chatId AND user_id = :userId LIMIT 1", { chatId, userId })
  if (!chatRows[0]) return sendJson(res, { message: "Chat not found." }, 404)

  // GET /client/chats/:id/messages
  if (afterId === "/messages" && method === "GET") {
    const msgs = await getMessages(config, chatId)
    await query(config, "UPDATE messages SET read_at = NOW() WHERE chat_id = :chatId AND sender_type = 'admin' AND read_at IS NULL", { chatId })
    return sendJson(res, { data: msgs })
  }

  // POST /client/chats/:id/messages
  if (afterId === "/messages" && method === "POST") {
    const body = await readJsonBody(req)
    if (!body.body?.trim()) return sendJson(res, { message: "Message body is required." }, 422)

    const result = await query(config, `
      INSERT INTO messages (chat_id, sender_type, body, created_at, updated_at)
      VALUES (:chatId, 'client', :body, NOW(), NOW())
    `, { chatId, body: body.body })

    const rows = await query(config, "SELECT * FROM messages WHERE id = :id LIMIT 1", { id: result.insertId })
    return sendJson(res, { data: rows[0] }, 201)
  }

  // POST /client/chats/:chatId/messages/:messageId/files
  const fileMatch = afterId.match(/^\/messages\/(\d+)\/files$/)
  if (fileMatch && method === "POST") {
    const messageId = Number(fileMatch[1])
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

  // GET /client/chats/:id/typing-status
  if (afterId === "/typing-status" && method === "GET") {
    const rows = await query(config, `
      SELECT "key", "value" FROM settings
      WHERE "key" IN (:adminKey, :clientKey)
    `, { adminKey: `chat_typing_admin_${chatId}`, clientKey: `chat_typing_client_${chatId}` })

    const now = Date.now()
    const result = { admin: false, client: false }
    for (const row of rows) {
      const isTyping = (now - Number(row.value || 0)) < 4000
      if (row.key.includes("_admin_")) result.admin = isTyping
      if (row.key.includes("_client_")) result.client = isTyping
    }
    return sendJson(res, { data: result })
  }

  // POST /client/chats/:id/typing
  if (afterId === "/typing" && method === "POST") {
    await query(config, `
      INSERT INTO settings ("key", "value", created_at, updated_at)
      VALUES (:key, :value, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()
    `, { key: `chat_typing_client_${chatId}`, value: Date.now().toString() })
    return sendJson(res, { message: "ok" })
  }

  return sendJson(res, { message: "Route not found." }, 404)
}

async function getMessages(config, chatId) {
  const rows = await query(config, `
    SELECT messages.id, messages.chat_id, messages.sender_type, messages.body,
           messages.created_at, messages.read_at
    FROM messages WHERE messages.chat_id = :chatId ORDER BY messages.created_at ASC
  `, { chatId })

  if (!rows.length) return rows
  const ids = rows.map(r => r.id)
  const files = await query(config, `
    SELECT * FROM message_files WHERE message_id IN (${ids.map((_, i) => `:id${i}`).join(",")})
  `, Object.fromEntries(ids.map((id, i) => [`id${i}`, id])))

  const filesByMsg = {}
  for (const f of files) {
    if (!filesByMsg[f.message_id]) filesByMsg[f.message_id] = []
    filesByMsg[f.message_id].push({ ...f, public_url: getPublicUrl(f.file_path) })
  }

  return rows.map(r => ({ ...r, files: filesByMsg[r.id] || [] }))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", c => { body += c })
    req.on("end", () => {
      try { resolve(body.trim() ? JSON.parse(body) : {}) }
      catch { resolve({}) }
    })
    req.on("error", reject)
  })
}

module.exports = { clientChatsRouter }

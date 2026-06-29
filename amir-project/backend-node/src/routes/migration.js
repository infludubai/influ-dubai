const bcrypt = require("bcryptjs")
const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")

const apiGroups = [
  { name: "health", status: "ready" },
  { name: "public-settings", status: "read-only-ready" },
  { name: "public-packages-addons", status: "read-only-ready" },
  { name: "public-portfolio", status: "read-only-ready" },
  { name: "public-blog", status: "read-only-ready" },
  { name: "public-pages", status: "read-only-ready" },
  { name: "checkout-payment-methods", status: "read-only-ready" },
  { name: "auth-token-compatibility", status: "read-only-ready" },
  { name: "auth-profile-logout", status: "write-ready" },
  { name: "auth-password-otp", status: "write-ready" },
  { name: "auth-oauth", status: "pending" },
  { name: "client-dashboard", status: "mostly-read-ready" },
  { name: "checkout-orders", status: "write-ready" },
  { name: "checkout-uploads-ocr", status: "pending" },
  { name: "invoices-email-pdf", status: "pending" },
  { name: "chat-sms", status: "pending" },
  { name: "builder-settings", status: "pending" },
]

async function seedAdmin(req, res, url, config) {
  if (req.method !== "POST") return false
  if (url.pathname !== `${config.apiPrefix}/migration/seed-admin`) return false

  const existing = await query(config, `SELECT id FROM users WHERE role = 'admin' LIMIT 1`)
  if (existing.length > 0) {
    sendJson(res, { message: "Admin already exists.", id: existing[0].id })
    return true
  }

  const hash = await bcrypt.hash("Admin@123456", 10)
  const result = await query(
    config,
    `INSERT INTO users (name, username, email, password, role, is_active, email_verified_at, created_at, updated_at)
     VALUES (:name, :username, :email, :password, 'admin', 1, NOW(), NOW(), NOW())`,
    {
      name: "Amir Nazir",
      username: "amir",
      email: "info@amirnazir.site",
      password: hash,
    }
  )

  sendJson(res, { message: "Admin seeded.", id: result.insertId })
  return true
}

function migrationRouter(req, res, url, config) {
  if (url.pathname === `${config.apiPrefix}/migration/seed-admin`) return seedAdmin(req, res, url, config)
  if (req.method !== "GET") return false
  if (url.pathname !== `${config.apiPrefix}/migration/status`) return false

  sendJson(res, {
    mode: "safe-side-by-side",
    liveBackend: "laravel",
    frontendSwitchedToNode: false,
    databaseWritesEnabled: false,
    apiGroups,
    databaseTarget: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      username: config.database.username,
      passwordConfigured: config.database.passwordConfigured,
    },
  })
  return true
}

module.exports = { migrationRouter }

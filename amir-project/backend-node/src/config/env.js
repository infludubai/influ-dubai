const fs = require("node:fs")
const path = require("node:path")

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const index = trimmed.indexOf("=")
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "")
    if (!(key in process.env)) process.env[key] = value
  }
}

function getConfig() {
  loadDotEnv(path.resolve(process.cwd(), ".env"))

  return {
    env: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 8080),
    apiPrefix: process.env.API_PREFIX || "/api",
    database: {
      // DATABASE_URL (Supabase/Render) takes priority over individual fields
      url: process.env.DATABASE_URL || null,
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_DATABASE || "postgres",
      username: process.env.DB_USERNAME || "postgres",
      passwordConfigured: Boolean(process.env.DB_PASSWORD || process.env.DATABASE_URL),
    },
  }
}

module.exports = { getConfig }

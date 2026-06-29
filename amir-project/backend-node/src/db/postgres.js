const { Pool } = require("pg")

let pool = null

function getPool(config) {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  const sharedOptions = {
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 15000,
  }

  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      ...sharedOptions,
    })
  } else {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: process.env.DB_PASSWORD || "",
      ssl: false,
      ...sharedOptions,
    })
  }

  pool.on("error", (err) => {
    console.error("[postgres] Pool error", err.message)
  })

  // Test connection on startup
  pool.query("SELECT 1").then(() => {
    console.log("[postgres] Connected to database")
  }).catch((err) => {
    console.error("[postgres] Database connection failed:", err.message)
  })

  return pool
}

// Convert :name style named params to $1, $2 positional.
// Negative lookbehind prevents matching :: (PostgreSQL cast operator).
function namedToPositional(sql, params = {}) {
  const values = []
  const indexMap = {}
  const text = sql.replace(/(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    if (name in indexMap) return `$${indexMap[name]}`
    values.push(name in params ? params[name] : null)
    indexMap[name] = values.length
    return `$${values.length}`
  })
  return { text, values }
}

async function query(config, sql, params = {}) {
  const trimmed = sql.trim()
  const isInsert = /^INSERT\s+INTO\b/i.test(trimmed)
  const hasReturning = /\bRETURNING\b/i.test(trimmed)
  const finalSql = isInsert && !hasReturning ? `${trimmed} RETURNING id` : trimmed

  const { text, values } = namedToPositional(finalSql, params)
  const result = await getPool(config).query(text, values)

  const rows = result.rows || []
  rows.insertId = rows[0]?.id || null
  rows.affectedRows = result.rowCount || 0
  return rows
}

async function withTransaction(config, fn) {
  const client = await getPool(config).connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

// Like query() but for use inside a withTransaction callback.
async function clientQuery(client, sql, params = {}) {
  const trimmed = sql.trim()
  const isInsert = /^INSERT\s+INTO\b/i.test(trimmed)
  const hasReturning = /\bRETURNING\b/i.test(trimmed)
  const finalSql = isInsert && !hasReturning ? `${trimmed} RETURNING id` : trimmed

  const { text, values } = namedToPositional(finalSql, params)
  const result = await client.query(text, values)

  const rows = result.rows || []
  rows.insertId = rows[0]?.id || null
  rows.affectedRows = result.rowCount || 0
  return rows
}

module.exports = { getPool, query, withTransaction, clientQuery }

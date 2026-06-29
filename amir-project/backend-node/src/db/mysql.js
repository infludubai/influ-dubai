const mysql = require("mysql2/promise")

let pool

function getPool(config) {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: process.env.DB_PASSWORD || "",
      waitForConnections: true,
      connectionLimit: 5,
      namedPlaceholders: true,
    })
  }

  return pool
}

async function query(config, sql, params = {}) {
  const [rows] = await getPool(config).execute(sql, params)
  return rows
}

module.exports = { getPool, query }

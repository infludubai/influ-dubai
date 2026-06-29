const { query } = require("../db/postgres")

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toBool(value) {
  return value === true || value === 1 || value === "1"
}

async function activePaymentMethods(config) {
  const rows = await query(
    config,
    `
      SELECT id, name, type, account_details, instructions, logo_path, qr_code_path,
             is_active, sort_order, created_at, updated_at
      FROM payment_methods
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `
  )

  return rows.map((row) => ({
    ...row,
    account_details: parseJson(row.account_details, null),
    is_active: toBool(row.is_active),
  }))
}

module.exports = { activePaymentMethods }

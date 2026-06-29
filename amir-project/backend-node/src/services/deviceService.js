const crypto = require("crypto")
const { query } = require("../db/postgres")

function getFingerprint(req) {
  const data = [
    req.headers["user-agent"] || "",
    req.headers["accept-language"] || "",
  ].join("|")

  return crypto.createHash("sha256").update(data).digest("hex")
}

async function isTrustedDevice(config, userId, req) {
  const fingerprint = getFingerprint(req)
  const rows = await query(
    config,
    `
      SELECT id
      FROM devices
      WHERE user_id = :userId
        AND fingerprint = :fingerprint
        AND is_trusted = 1
      ORDER BY id DESC
      LIMIT 1
    `,
    { userId, fingerprint }
  )

  if (!rows[0]) return false

  await query(config, "UPDATE devices SET last_seen_at = NOW() WHERE id = :id", { id: rows[0].id })
  return true
}

async function trustDevice(config, userId, req) {
  return upsertDevice(config, userId, req, true)
}

async function registerUnknownDevice(config, userId, req) {
  return upsertDevice(config, userId, req, false)
}

async function upsertDevice(config, userId, req, trusted) {
  const fingerprint = getFingerprint(req)
  const rows = await query(
    config,
    `
      SELECT id
      FROM devices
      WHERE user_id = :userId
        AND fingerprint = :fingerprint
      ORDER BY id DESC
      LIMIT 1
    `,
    { userId, fingerprint }
  )

  const params = {
    userId,
    fingerprint,
    userAgent: req.headers["user-agent"] || null,
    ipAddress: getIpAddress(req),
    trusted: trusted ? 1 : 0,
  }

  if (rows[0]) {
    await query(
      config,
      `
        UPDATE devices
        SET user_agent = :userAgent,
            ip_address = :ipAddress,
            is_trusted = :trusted,
            trusted_at = ${trusted ? "NOW()" : "trusted_at"},
            last_seen_at = NOW()
        WHERE id = :id
      `,
      { ...params, id: rows[0].id }
    )
    return
  }

  await query(
    config,
    `
      INSERT INTO devices (user_id, fingerprint, user_agent, ip_address, is_trusted, trusted_at, last_seen_at, created_at)
      VALUES (:userId, :fingerprint, :userAgent, :ipAddress, :trusted, ${trusted ? "NOW()" : "NULL"}, NOW(), NOW())
    `,
    params
  )
}

function getIpAddress(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (forwarded) return String(forwarded).split(",")[0].trim()
  return req.socket?.remoteAddress || null
}

module.exports = { getFingerprint, isTrustedDevice, registerUnknownDevice, trustDevice }

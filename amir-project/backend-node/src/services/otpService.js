const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const { query } = require("../db/postgres")

const EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN = 60

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0")
}

async function createOtp(config, userId, type) {
  const code = generateCode()
  const hashedCode = await bcrypt.hash(code, 10)

  await query(
    config,
    `
      DELETE FROM otp_verifications
      WHERE user_id = :userId
        AND type = :type
        AND used_at IS NULL
    `,
    { userId, type }
  )

  await query(
    config,
    `
      INSERT INTO otp_verifications (user_id, type, code, expires_at, attempts, last_sent_at, created_at)
      VALUES (:userId, :type, :hashedCode, NOW() + INTERVAL '${EXPIRY_MINUTES} minutes', 0, NOW(), NOW())
    `,
    { userId, type, hashedCode }
  )

  return code
}

async function verifyOtp(config, userId, type, code) {
  const rows = await query(
    config,
    `
      SELECT *
      FROM otp_verifications
      WHERE user_id = :userId
        AND type = :type
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    { userId, type }
  )

  const otp = rows[0]
  if (!otp) return validationError("otp", "No active OTP found. Please request a new one.")

  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return validationError("otp", "OTP has expired. Please request a new one.")
  }

  const attempts = Number(otp.attempts || 0) + 1
  await query(config, "UPDATE otp_verifications SET attempts = :attempts WHERE id = :id", { attempts, id: otp.id })

  if (attempts > MAX_ATTEMPTS) {
    await query(config, "DELETE FROM otp_verifications WHERE id = :id", { id: otp.id })
    return validationError("otp", "Too many attempts. Please request a new OTP.")
  }

  const valid = await bcrypt.compare(code, normalizeBcryptHash(otp.code))
  if (!valid) {
    const remaining = MAX_ATTEMPTS - attempts
    return validationError("otp", `Invalid OTP. ${remaining} attempts remaining.`)
  }

  await query(config, "UPDATE otp_verifications SET used_at = NOW() WHERE id = :id", { id: otp.id })
  return { ok: true }
}

async function getResendCooldown(config, userId, type) {
  const rows = await query(
    config,
    `
      SELECT GREATEST(0, ${RESEND_COOLDOWN} - EXTRACT(EPOCH FROM (NOW() - last_sent_at))::int) AS cooldown
      FROM otp_verifications
      WHERE user_id = :userId
        AND type = :type
      ORDER BY created_at DESC
      LIMIT 1
    `,
    { userId, type }
  )

  return Number(rows[0]?.cooldown || 0)
}

function validationError(field, message) {
  return { ok: false, errors: { [field]: [message] } }
}

function normalizeBcryptHash(hash) {
  return String(hash).replace(/^\$2y\$/, "$2a$")
}

module.exports = { createOtp, getResendCooldown, normalizeBcryptHash, verifyOtp }

const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const { getPool, query, withTransaction, clientQuery } = require("../db/postgres")
const { normalizeBcryptHash } = require("../services/otpService")

const PROFILE_KEYS = ["company_name", "address", "industry", "account_type", "goals"]

function hashSanctumToken(plainTextToken) {
  return crypto.createHash("sha256").update(plainTextToken).digest("hex")
}

function generatePlainTextToken() {
  return crypto.randomBytes(40).toString("hex")
}

function parseBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") return null

  const match = headerValue.match(/^Bearer\s+(.+)$/i)
  if (!match) return null

  const token = match[1].trim()
  const separatorIndex = token.indexOf("|")
  if (separatorIndex === -1) return null

  const tokenId = token.slice(0, separatorIndex)
  const plainTextToken = token.slice(separatorIndex + 1)

  if (!/^\d+$/.test(tokenId) || !plainTextToken) return null

  return {
    tokenId: Number(tokenId),
    tokenHash: hashSanctumToken(plainTextToken),
  }
}

async function authenticateSanctumRequest(config, authorizationHeader) {
  const parsedToken = parseBearerToken(authorizationHeader)
  if (!parsedToken) return null

  const rows = await query(
    config,
    `
      SELECT
        users.id,
        users.name,
        users.username,
        users.email,
        users.phone,
        users.role,
        users.avatar,
        users.email_verified_at,
        users.is_active,
        company."value" AS company_name,
        address."value" AS address,
        industry."value" AS industry,
        account_type."value" AS account_type,
        goals."value" AS goals
      FROM personal_access_tokens
      INNER JOIN users
        ON users.id = personal_access_tokens.tokenable_id
       AND personal_access_tokens.tokenable_type = :tokenableType
      LEFT JOIN settings company
        ON company."key" = CONCAT('user_profile_', users.id, '_company_name')
      LEFT JOIN settings address
        ON address."key" = CONCAT('user_profile_', users.id, '_address')
      LEFT JOIN settings industry
        ON industry."key" = CONCAT('user_profile_', users.id, '_industry')
      LEFT JOIN settings account_type
        ON account_type."key" = CONCAT('user_profile_', users.id, '_account_type')
      LEFT JOIN settings goals
        ON goals."key" = CONCAT('user_profile_', users.id, '_goals')
      WHERE personal_access_tokens.id = :tokenId
        AND personal_access_tokens.token = :tokenHash
        AND (personal_access_tokens.expires_at IS NULL OR personal_access_tokens.expires_at > NOW())
      LIMIT 1
    `,
    { ...parsedToken, tokenableType: "App\\Models\\User" }
  )

  const user = rows[0]
  if (!user || !isActive(user.is_active)) return null

  return {
    token: parsedToken,
    user: formatUserResponse(user),
  }
}

async function findUserBySanctumToken(config, authorizationHeader) {
  const auth = await authenticateSanctumRequest(config, authorizationHeader)
  return auth?.user ?? null
}

async function deleteCurrentToken(config, token) {
  await query(
    config,
    `
      DELETE FROM personal_access_tokens
      WHERE id = :tokenId
        AND token = :tokenHash
    `,
    token
  )
}

async function createSanctumToken(config, userId) {
  const plainTextToken = generatePlainTextToken()
  const tokenHash = hashSanctumToken(plainTextToken)
  const result = await query(
    config,
    `
      INSERT INTO personal_access_tokens
        (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
      VALUES
        (:tokenableType, :userId, 'auth-token', :tokenHash, :abilities, NOW(), NOW())
    `,
    {
      tokenableType: "App\\Models\\User",
      userId,
      tokenHash,
      abilities: JSON.stringify(["*"]),
    }
  )

  return `${result.insertId}|${plainTextToken}`
}

async function findUserByLogin(config, login) {
  const field = String(login).includes("@") ? "email" : "username"
  const rows = await query(
    config,
    `
      SELECT *
      FROM users
      WHERE ${field} = :login
      LIMIT 1
    `,
    { login }
  )

  return rows[0] || null
}

async function findUserById(config, userId) {
  const rows = await query(config, "SELECT * FROM users WHERE id = :userId LIMIT 1", { userId })
  return rows[0] || null
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, normalizeBcryptHash(hash))
}

async function createUser(config, data) {
  const passwordHash = await bcrypt.hash(data.password, 10)
  const username = data.username || await makeUniqueUsername(config, data.name)

  const result = await query(
    config,
    `
      INSERT INTO users
        (name, username, email, phone, password, role, is_active, created_at, updated_at)
      VALUES
        (:name, :username, :email, :phone, :password, 'client', 1, NOW(), NOW())
    `,
    {
      name: data.name,
      username,
      email: data.email,
      phone: data.phone || null,
      password: passwordHash,
    }
  )

  return findUserById(config, result.insertId)
}

async function emailExists(config, email) {
  const rows = await query(config, "SELECT id FROM users WHERE email = :email LIMIT 1", { email })
  return rows.length > 0
}

async function usernameExists(config, username) {
  if (!username) return false
  const rows = await query(config, "SELECT id FROM users WHERE username = :username LIMIT 1", { username })
  return rows.length > 0
}

async function markEmailVerified(config, userId) {
  await query(config, "UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = :userId", { userId })
}

async function touchLastSeen(config, userId) {
  await query(config, "UPDATE users SET last_seen_at = NOW(), updated_at = NOW() WHERE id = :userId", { userId })
}

async function updatePasswordAndDeleteTokens(config, userId, password) {
  const passwordHash = await bcrypt.hash(password, 10)
  await query(config, "UPDATE users SET password = :passwordHash, updated_at = NOW() WHERE id = :userId", {
    userId,
    passwordHash,
  })
  await query(config, "DELETE FROM personal_access_tokens WHERE tokenable_type = :tokenableType AND tokenable_id = :userId", {
    tokenableType: "App\\Models\\User",
    userId,
  })
}

async function updateUserProfile(config, userId, data) {
  await withTransaction(config, async (client) => {
    const userUpdates = pickDefined(data, ["name", "username", "phone", "avatar"])
    if (Object.keys(userUpdates).length > 0) {
      const values = Object.values(userUpdates)
      const assignments = Object.keys(userUpdates).map((key, i) => `"${key}" = $${i + 1}`).join(", ")
      await client.query(
        `UPDATE users SET ${assignments}, updated_at = NOW() WHERE id = $${values.length + 1}`,
        [...values, userId]
      )
    }

    for (const key of PROFILE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        await clientQuery(client,
          `INSERT INTO settings ("key", "value", created_at, updated_at)
           VALUES (:key, :value, NOW(), NOW())
           ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", updated_at = NOW()`,
          { key: `user_profile_${userId}_${key}`, value: data[key] ?? "" }
        )
      }
    }
  })

  return getUserResponseById(config, userId)
}

async function getUserResponseById(config, userId) {
  const rows = await query(
    config,
    `
      SELECT
        users.id,
        users.name,
        users.username,
        users.email,
        users.phone,
        users.role,
        users.avatar,
        users.email_verified_at,
        users.is_active,
        company."value" AS company_name,
        address."value" AS address,
        industry."value" AS industry,
        account_type."value" AS account_type,
        goals."value" AS goals
      FROM users
      LEFT JOIN settings company
        ON company."key" = CONCAT('user_profile_', users.id, '_company_name')
      LEFT JOIN settings address
        ON address."key" = CONCAT('user_profile_', users.id, '_address')
      LEFT JOIN settings industry
        ON industry."key" = CONCAT('user_profile_', users.id, '_industry')
      LEFT JOIN settings account_type
        ON account_type."key" = CONCAT('user_profile_', users.id, '_account_type')
      LEFT JOIN settings goals
        ON goals."key" = CONCAT('user_profile_', users.id, '_goals')
      WHERE users.id = :userId
      LIMIT 1
    `,
    { userId }
  )

  const user = rows[0]
  if (!user || !isActive(user.is_active)) return null

  return formatUserResponse(user)
}

async function usernameExistsForAnotherUser(config, username, userId) {
  if (!username) return false

  const rows = await query(
    config,
    `
      SELECT id
      FROM users
      WHERE username = :username
        AND id <> :userId
      LIMIT 1
    `,
    { username, userId }
  )

  return rows.length > 0
}

async function makeUniqueUsername(config, name) {
  const base = slugify(name) || "user"

  for (let attempts = 0; attempts < 20; attempts += 1) {
    const username = `${base}_${crypto.randomInt(100, 1000)}`
    if (!await usernameExists(config, username)) return username
  }

  return `${base}_${Date.now()}`
}

function isActive(value) {
  return value === true || value === 1 || value === "1"
}

function formatUserResponse(user) {
  const formatted = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    email_verified_at: user.email_verified_at,
  }

  for (const key of PROFILE_KEYS) {
    formatted[key] = user[key] ?? null
  }

  return formatted
}

function pickDefined(source, keys) {
  return keys.reduce((picked, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      picked[key] = source[key]
    }
    return picked
  }, {})
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
}

module.exports = {
  authenticateSanctumRequest,
  createSanctumToken,
  createUser,
  deleteCurrentToken,
  emailExists,
  findUserById,
  findUserByLogin,
  findUserBySanctumToken,
  getUserResponseById,
  markEmailVerified,
  makeUniqueUsername,
  parseBearerToken,
  touchLastSeen,
  updatePasswordAndDeleteTokens,
  updateUserProfile,
  usernameExists,
  usernameExistsForAnotherUser,
  verifyPassword,
}

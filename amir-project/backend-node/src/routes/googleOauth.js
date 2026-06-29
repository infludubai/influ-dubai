const https = require("node:https")
const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")
const { readJsonBody } = require("../utils/request")
const { createSanctumToken, findUserById, makeUniqueUsername } = require("../repositories/authRepository")
const bcrypt = require("bcryptjs")
const crypto = require("node:crypto")

function googleOauthRouter(req, res, url, config) {
  const pre = config.apiPrefix

  if (url.pathname === `${pre}/auth/google/url` && req.method === "GET") {
    handleGoogleUrl(req, res, config).catch(err => sendJson(res, { message: err.message }, 500))
    return true
  }

  if (url.pathname === `${pre}/auth/google/callback` && req.method === "POST") {
    handleGoogleCallback(req, res, config).catch(err => {
      console.error("[node-api] Google OAuth error", err)
      sendJson(res, { message: err.message || "Google login failed." }, 500)
    })
    return true
  }

  return false
}

async function handleGoogleUrl(req, res, config) {
  const creds = await getGoogleCredentials(config)
  if (!creds.clientId || !creds.redirectUri) {
    return sendJson(res, { message: "Google OAuth not configured." }, 503)
  }

  const state = crypto.randomBytes(16).toString("hex")
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  })

  return sendJson(res, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
}

async function handleGoogleCallback(req, res, config) {
  const body = await readJsonBody(req)
  const code = body.code

  if (!code) return sendJson(res, { message: "Authorization code is required." }, 422)

  const creds = await getGoogleCredentials(config)
  if (!creds.clientId || !creds.clientSecret || !creds.redirectUri) {
    return sendJson(res, { message: "Google OAuth not configured." }, 503)
  }

  const tokenData = await exchangeCode(code, creds)
  if (!tokenData.access_token) {
    return sendJson(res, { message: "Failed to exchange code with Google." }, 400)
  }

  const googleUser = await getGoogleUser(tokenData.access_token)
  if (!googleUser.email) {
    return sendJson(res, { message: "Could not retrieve email from Google." }, 400)
  }

  const rows = await query(config, "SELECT * FROM users WHERE email = :email LIMIT 1", { email: googleUser.email })
  let user = rows[0]

  if (!user) {
    const username = await makeUsernameFrom(config, googleUser.name || googleUser.email)
    const randomPwd = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10)
    const result = await query(config, `
      INSERT INTO users (name, username, email, password, role, is_active, email_verified_at, created_at, updated_at)
      VALUES (:name, :username, :email, :password, 'client', 1, NOW(), NOW(), NOW())
    `, {
      name: googleUser.name || googleUser.email.split("@")[0],
      username,
      email: googleUser.email,
      password: randomPwd,
    })
    user = await query(config, "SELECT * FROM users WHERE id = :id LIMIT 1", { id: result.insertId }).then(r => r[0])
  }

  if (!user.email_verified_at) {
    await query(config, "UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = :id", { id: user.id })
  }

  if (!user.avatar && googleUser.picture) {
    await query(config, "UPDATE users SET avatar = :avatar, updated_at = NOW() WHERE id = :id", {
      id: user.id, avatar: googleUser.picture,
    })
  }

  const token = await createSanctumToken(config, user.id)
  const freshUser = await query(config, "SELECT * FROM users WHERE id = :id LIMIT 1", { id: user.id }).then(r => r[0])

  return sendJson(res, {
    token,
    user: {
      id: freshUser.id,
      name: freshUser.name,
      username: freshUser.username,
      email: freshUser.email,
      phone: freshUser.phone,
      role: freshUser.role,
      avatar: freshUser.avatar,
      email_verified_at: freshUser.email_verified_at,
    },
  })
}

async function exchangeCode(code, creds) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: creds.redirectUri,
      grant_type: "authorization_code",
    }).toString()

    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(payload) },
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
    })
    req.on("error", reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")) })
    req.write(payload)
    req.end()
  })
}

async function getGoogleUser(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.googleapis.com",
      path: "/oauth2/v3/userinfo",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
    https.get(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
    }).on("error", reject)
  })
}

async function getGoogleCredentials(config) {
  const rows = await query(config, `
    SELECT "key", "value" FROM settings
    WHERE "key" IN ('google_client_id','google_client_secret','google_redirect_uri')
  `).catch(() => [])

  const s = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    clientId: s.google_client_id || process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: s.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: s.google_redirect_uri || process.env.GOOGLE_REDIRECT_URI || "",
  }
}

async function makeUsernameFrom(config, name) {
  const base = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "user"
  for (let i = 0; i < 20; i++) {
    const username = `${base}_${crypto.randomInt(100, 9999)}`
    const rows = await query(config, "SELECT id FROM users WHERE username = :username LIMIT 1", { username })
    if (!rows.length) return username
  }
  return `${base}_${Date.now()}`
}

module.exports = { googleOauthRouter }

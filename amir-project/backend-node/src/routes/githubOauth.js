const https = require("node:https")
const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")
const { readJsonBody } = require("../utils/request")
const { createSanctumToken } = require("../repositories/authRepository")
const bcrypt = require("bcryptjs")
const crypto = require("node:crypto")

function githubOauthRouter(req, res, url, config) {
  const pre = config.apiPrefix

  if (url.pathname === `${pre}/auth/github/url` && req.method === "GET") {
    handleGithubUrl(req, res, config).catch(err => sendJson(res, { message: err.message }, 500))
    return true
  }

  if (url.pathname === `${pre}/auth/github/callback` && req.method === "POST") {
    handleGithubCallback(req, res, config).catch(err => {
      console.error("[node-api] GitHub OAuth error", err)
      sendJson(res, { message: err.message || "GitHub login failed." }, 500)
    })
    return true
  }

  return false
}

async function handleGithubUrl(req, res, config) {
  const creds = await getGithubCredentials(config)
  if (!creds.clientId) {
    return sendJson(res, { message: "GitHub OAuth not configured." }, 503)
  }

  const state = crypto.randomBytes(16).toString("hex")
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    scope: "user:email",
    state,
  })

  return sendJson(res, { url: `https://github.com/login/oauth/authorize?${params}` })
}

async function handleGithubCallback(req, res, config) {
  const body = await readJsonBody(req)
  const code = body.code

  if (!code) return sendJson(res, { message: "Authorization code is required." }, 422)

  const creds = await getGithubCredentials(config)
  if (!creds.clientId || !creds.clientSecret) {
    return sendJson(res, { message: "GitHub OAuth not configured." }, 503)
  }

  const tokenData = await exchangeGithubCode(code, creds)
  if (!tokenData.access_token) {
    return sendJson(res, { message: "Failed to exchange code with GitHub." }, 400)
  }

  const [githubUser, githubEmails] = await Promise.all([
    getGithubUser(tokenData.access_token),
    getGithubEmails(tokenData.access_token),
  ])

  const email =
    githubUser.email ||
    (githubEmails.find(e => e.primary && e.verified) ||
      githubEmails.find(e => e.verified) ||
      githubEmails[0])?.email

  if (!email) {
    return sendJson(res, { message: "Could not retrieve a verified email from GitHub." }, 400)
  }

  const rows = await query(config, "SELECT * FROM users WHERE email = :email LIMIT 1", { email })
  let user = rows[0]

  if (!user) {
    const username = await makeUsernameFrom(config, githubUser.login || githubUser.name || email)
    const randomPwd = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10)
    const result = await query(config, `
      INSERT INTO users (name, username, email, password, role, is_active, email_verified_at, created_at, updated_at)
      VALUES (:name, :username, :email, :password, 'client', 1, NOW(), NOW(), NOW())
    `, {
      name: githubUser.name || githubUser.login || email.split("@")[0],
      username,
      email,
      password: randomPwd,
    })
    user = await query(config, "SELECT * FROM users WHERE id = :id LIMIT 1", { id: result.insertId }).then(r => r[0])
  }

  if (!user.email_verified_at) {
    await query(config, "UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = :id", { id: user.id })
  }

  if (!user.avatar && githubUser.avatar_url) {
    await query(config, "UPDATE users SET avatar = :avatar, updated_at = NOW() WHERE id = :id", {
      id: user.id, avatar: githubUser.avatar_url,
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

async function exchangeGithubCode(code, creds) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: creds.redirectUri,
    }).toString()

    const options = {
      hostname: "github.com",
      path: "/login/oauth/access_token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
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

async function getGithubUser(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: "/user",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "AmirnazirApp/1.0",
        Accept: "application/vnd.github+json",
      },
    }
    https.get(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
    }).on("error", reject)
  })
}

async function getGithubEmails(accessToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: "/user/emails",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "AmirnazirApp/1.0",
        Accept: "application/vnd.github+json",
      },
    }
    https.get(options, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => { try { resolve(JSON.parse(data)) } catch { resolve([]) } })
    }).on("error", () => resolve([]))
  })
}

async function getGithubCredentials(config) {
  const rows = await query(config, `
    SELECT "key", "value" FROM settings
    WHERE "key" IN ('github_client_id', 'github_client_secret', 'github_redirect_uri')
  `).catch(() => [])

  const s = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    clientId: s.github_client_id || process.env.GITHUB_CLIENT_ID || "",
    clientSecret: s.github_client_secret || process.env.GITHUB_CLIENT_SECRET || "",
    redirectUri: s.github_redirect_uri || process.env.GITHUB_REDIRECT_URI || "https://www.a-mir.com/auth/github/callback",
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

module.exports = { githubOauthRouter }

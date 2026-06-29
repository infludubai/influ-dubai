const { query } = require("../db/postgres")
const { sendJson } = require("../utils/http")

function healthRouter(req, res, url, config) {
  if (req.method !== "GET") return false
  if (url.pathname !== `${config.apiPrefix}/health`) return false

  checkHealth(res, config)
  return true
}

async function checkHealth(res, config) {
  let dbOk = false
  let dbError = null

  try {
    await query(config, "SELECT 1")
    dbOk = true
  } catch (err) {
    dbError = err.message
  }

  sendJson(res, {
    ok: true,
    service: "amirnazir-node-backend",
    status: "running",
    db: dbOk ? "connected" : "error",
    dbError: dbError || undefined,
    time: new Date().toISOString(),
  }, 200)
}

module.exports = { healthRouter }

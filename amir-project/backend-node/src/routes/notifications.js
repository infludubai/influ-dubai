const { authenticateSanctumRequest } = require("../repositories/authRepository")
const { listNotificationsForUser, markNotificationRead, markAllNotificationsRead } = require("../repositories/adminRepository")
const { sendJson } = require("../utils/http")

function notificationsRouter(req, res, url, config) {
  if (!url.pathname.startsWith(`${config.apiPrefix}/client/notifications`)) return false

  handleNotifications(req, res, url, config).catch((err) => {
    console.error("[node-api] Notifications error", err)
    sendJson(res, { message: "Internal server error." }, 500)
  })

  return true
}

async function handleNotifications(req, res, url, config) {
  const auth = await authenticateSanctumRequest(config, req.headers.authorization)
  if (!auth) return sendJson(res, { message: "Unauthenticated." }, 401)

  const prefix = `${config.apiPrefix}/client/notifications`
  const rest = url.pathname.slice(prefix.length)

  if (rest === "" || rest === "/") {
    if (req.method === "GET") {
      const result = await listNotificationsForUser(config, auth.user.id, {
        page: url.searchParams.get("page"),
      })
      return sendJson(res, result)
    }
  }

  const readAllMatch = rest === "/read-all" && req.method === "POST"
  if (readAllMatch) {
    await markAllNotificationsRead(config, auth.user.id)
    return sendJson(res, { message: "All notifications marked as read." })
  }

  const idMatch = rest.match(/^\/(\d+)\/read$/)
  if (idMatch && req.method === "POST") {
    await markNotificationRead(config, Number(idMatch[1]), auth.user.id)
    return sendJson(res, { message: "Notification marked as read." })
  }

  return sendJson(res, { message: "Route not found." }, 404)
}

module.exports = { notificationsRouter }

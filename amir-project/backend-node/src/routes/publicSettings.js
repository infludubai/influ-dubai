const { getPublicSettings } = require("../repositories/settingsRepository")
const { sendJson } = require("../utils/http")

function publicSettingsRouter(req, res, url, config) {
  if (req.method !== "GET") return false
  if (url.pathname !== `${config.apiPrefix}/settings/public`) return false

  getPublicSettings(config)
    .then((settings) => sendJson(res, { data: settings }))
    .catch((error) => {
      console.error("[node-api] Failed to load public settings", error)
      sendJson(res, { message: "Failed to load public settings." }, 500)
    })

  return true
}

module.exports = { publicSettingsRouter }

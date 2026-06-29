const { activeAddons, activePackageBySlug, activePackages } = require("../repositories/packagesRepository")
const { sendJson } = require("../utils/http")

function packagesRouter(req, res, url, config) {
  if (req.method !== "GET") return false

  if (url.pathname === `${config.apiPrefix}/packages`) {
    activePackages(config)
      .then((packages) => sendJson(res, { data: packages }))
      .catch((error) => {
        console.error("[node-api] Failed to load packages", error)
        sendJson(res, { message: "Failed to load packages." }, 500)
      })
    return true
  }

  if (url.pathname.startsWith(`${config.apiPrefix}/packages/`)) {
    const slug = decodeURIComponent(url.pathname.slice(`${config.apiPrefix}/packages/`.length))
    activePackageBySlug(config, slug)
      .then((item) => {
        if (!item) return sendJson(res, { message: "Package not found." }, 404)
        return sendJson(res, { data: item })
      })
      .catch((error) => {
        console.error("[node-api] Failed to load package", error)
        sendJson(res, { message: "Failed to load package." }, 500)
      })
    return true
  }

  if (url.pathname === `${config.apiPrefix}/addons`) {
    activeAddons(config)
      .then((addons) => sendJson(res, { data: addons }))
      .catch((error) => {
        console.error("[node-api] Failed to load addons", error)
        sendJson(res, { message: "Failed to load add-ons." }, 500)
      })
    return true
  }

  return false
}

module.exports = { packagesRouter }

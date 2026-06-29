const { publicPageBySlug } = require("../repositories/pagesRepository")
const { sendJson } = require("../utils/http")

function pagesRouter(req, res, url, config) {
  if (req.method !== "GET") return false
  if (!url.pathname.startsWith(`${config.apiPrefix}/pages/`)) return false

  const slug = decodeURIComponent(url.pathname.slice(`${config.apiPrefix}/pages/`.length))

  publicPageBySlug(config, slug)
    .then((page) => sendJson(res, { data: page }))
    .catch((error) => {
      console.error("[node-api] Failed to load page", error)
      sendJson(res, { message: "Failed to load page." }, 500)
    })

  return true
}

module.exports = { pagesRouter }

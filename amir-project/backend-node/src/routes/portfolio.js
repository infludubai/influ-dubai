const { activePortfolioItemBySlug, activePortfolioItems } = require("../repositories/portfolioRepository")
const { sendJson } = require("../utils/http")

function portfolioRouter(req, res, url, config) {
  if (req.method !== "GET") return false

  if (url.pathname === `${config.apiPrefix}/portfolio`) {
    activePortfolioItems(config, url.searchParams.get("category") || "")
      .then(({ items, categories }) => sendJson(res, { data: items, categories }))
      .catch((error) => {
        console.error("[node-api] Failed to load portfolio", error)
        sendJson(res, { message: "Failed to load portfolio." }, 500)
      })
    return true
  }

  if (url.pathname.startsWith(`${config.apiPrefix}/portfolio/`)) {
    const slug = decodeURIComponent(url.pathname.slice(`${config.apiPrefix}/portfolio/`.length))
    activePortfolioItemBySlug(config, slug)
      .then((item) => {
        if (!item) return sendJson(res, { message: "Portfolio item not found." }, 404)
        return sendJson(res, { data: item })
      })
      .catch((error) => {
        console.error("[node-api] Failed to load portfolio item", error)
        sendJson(res, { message: "Failed to load portfolio item." }, 500)
      })
    return true
  }

  return false
}

module.exports = { portfolioRouter }

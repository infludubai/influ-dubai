const { authRouter } = require("./routes/auth")
const { blogRouter } = require("./routes/blog")
const { checkoutRouter } = require("./routes/checkout")
const { clientDashboardRouter } = require("./routes/clientDashboard")
const { healthRouter } = require("./routes/health")
const { migrationRouter } = require("./routes/migration")
const { packagesRouter } = require("./routes/packages")
const { pagesRouter } = require("./routes/pages")
const { paymentMethodsRouter } = require("./routes/paymentMethods")
const { portfolioRouter } = require("./routes/portfolio")
const { publicSettingsRouter } = require("./routes/publicSettings")
const { adminRouter } = require("./routes/admin")
const { notificationsRouter } = require("./routes/notifications")
const { clientChatsRouter } = require("./routes/clientChats")
const { contactRouter } = require("./routes/contact")
const { googleOauthRouter } = require("./routes/googleOauth")
const { githubOauthRouter } = require("./routes/githubOauth")
const { uploadsRouter } = require("./routes/uploads")
const { staticRouter } = require("./routes/static")
const { sendJson, sendNotFound } = require("./utils/http")
const { getAdsTxtContent } = require("./repositories/settingsRepository")
const { query } = require("./db/postgres")

// Security headers added to every response
function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  )
}

// CORS headers — allow any a-mir.com subdomain + localhost
function setCorsHeaders(res, origin) {
  const allowed = /^https?:\/\/(localhost(:\d+)?|([a-z0-9-]+\.)?amirnazir\.site|([a-z0-9-]+\.)?a-mir\.com|[a-z0-9-]+\.onrender\.com)$/
  if (origin && allowed.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  } else if (!origin) {
    // Non-browser requests (curl, mobile apps) — allow
    res.setHeader("Access-Control-Allow-Origin", "*")
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Vary", "Origin")
}

function createApp(config) {
  return async function app(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`)
    const prefix = config.apiPrefix
    const origin = req.headers.origin || ""

    setCorsHeaders(res, origin)
    setSecurityHeaders(res)

    // Preflight — headers already set by setCorsHeaders above
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Content-Length": "0" })
      res.end()
      return
    }

    // Serve /storage/* files BEFORE the API prefix check — these are not API routes
    if (staticRouter(req, res, url, config)) return

    // Serve /ads.txt for Google AdSense verification
    if (req.method === "GET" && url.pathname === "/ads.txt") {
      const content = await getAdsTxtContent(config)
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" })
      res.end(content)
      return
    }

    // Dynamic sitemap.xml — static pages + all published blog post slugs
    if (req.method === "GET" && url.pathname === "/sitemap.xml") {
      const posts = await query(config,
        `SELECT slug, published_at FROM blog_posts WHERE status = 'published' AND published_at IS NOT NULL ORDER BY published_at DESC`
      ).catch(() => [])
      const base = "https://a-mir.com"
      const staticPages = [
        { loc: `${base}/`,          priority: "1.0", changefreq: "weekly" },
        { loc: `${base}/services`,  priority: "0.9", changefreq: "monthly" },
        { loc: `${base}/portfolio`, priority: "0.9", changefreq: "weekly" },
        { loc: `${base}/pricing`,   priority: "0.8", changefreq: "monthly" },
        { loc: `${base}/about`,     priority: "0.7", changefreq: "monthly" },
        { loc: `${base}/blog`,      priority: "0.9", changefreq: "daily" },
        { loc: `${base}/contact`,   priority: "0.7", changefreq: "yearly" },
        { loc: `${base}/privacy`,   priority: "0.3", changefreq: "yearly" },
        { loc: `${base}/terms`,     priority: "0.3", changefreq: "yearly" },
      ]
      const urlTags = [
        ...staticPages.map(p =>
          `  <url><loc>${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
        ),
        ...posts.map(p => {
          const lastmod = p.published_at ? new Date(p.published_at).toISOString().split("T")[0] : ""
          return `  <url><loc>${base}/blog/${p.slug}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`
        }),
      ].join("\n")
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>`
      res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" })
      res.end(xml)
      return
    }

    if (!url.pathname.startsWith(prefix)) {
      return sendNotFound(res, "Route not found.")
    }

    if (healthRouter(req, res, url, config)) return
    if (migrationRouter(req, res, url, config)) return
    if (googleOauthRouter(req, res, url, config)) return
    if (githubOauthRouter(req, res, url, config)) return
    if (uploadsRouter(req, res, url, config)) return
    if (contactRouter(req, res, url, config)) return
    if (publicSettingsRouter(req, res, url, config)) return
    if (packagesRouter(req, res, url, config)) return
    if (authRouter(req, res, url, config)) return
    if (notificationsRouter(req, res, url, config)) return
    if (clientChatsRouter(req, res, url, config)) return
    if (clientDashboardRouter(req, res, url, config)) return
    if (checkoutRouter(req, res, url, config)) return
    if (portfolioRouter(req, res, url, config)) return
    if (blogRouter(req, res, url, config)) return
    if (pagesRouter(req, res, url, config)) return
    if (paymentMethodsRouter(req, res, url, config)) return
    if (adminRouter(req, res, url, config)) return

    if (req.method === "GET" && url.pathname === `${prefix}`) {
      return sendJson(res, {
        name: "Amir Nazir Node API",
        status: "active",
        version: "0.2.0",
        message: "Node backend running. All core routes migrated.",
      })
    }

    return sendNotFound(res, "API route not migrated to Node yet.")
  }
}

module.exports = { createApp }

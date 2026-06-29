const { blogCategories, publishedBlogPostBySlug, publishedBlogPosts } = require("../repositories/blogRepository")
const { sendJson } = require("../utils/http")

function blogRouter(req, res, url, config) {
  if (req.method !== "GET") return false

  if (url.pathname === `${config.apiPrefix}/blog/categories`) {
    blogCategories(config)
      .then((categories) => sendJson(res, { data: categories }))
      .catch((error) => {
        console.error("[node-api] Failed to load blog categories", error)
        sendJson(res, { message: "Failed to load blog categories." }, 500)
      })
    return true
  }

  if (url.pathname === `${config.apiPrefix}/blog`) {
    publishedBlogPosts(config, {
      page: url.searchParams.get("page"),
      per_page: url.searchParams.get("per_page"),
      category: url.searchParams.get("category"),
      tag: url.searchParams.get("tag"),
      path: `${url.protocol}//${url.host}${config.apiPrefix}/blog`,
    })
      .then((payload) => sendJson(res, payload))
      .catch((error) => {
        console.error("[node-api] Failed to load blog posts", error)
        sendJson(res, { message: "Failed to load blog posts." }, 500)
      })
    return true
  }

  if (url.pathname.startsWith(`${config.apiPrefix}/blog/`)) {
    const slug = decodeURIComponent(url.pathname.slice(`${config.apiPrefix}/blog/`.length))
    publishedBlogPostBySlug(config, slug)
      .then((post) => {
        if (!post) return sendJson(res, { message: "Blog post not found." }, 404)
        return sendJson(res, { data: post })
      })
      .catch((error) => {
        console.error("[node-api] Failed to load blog post", error)
        sendJson(res, { message: "Failed to load blog post." }, 500)
      })
    return true
  }

  return false
}

module.exports = { blogRouter }

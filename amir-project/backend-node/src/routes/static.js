const fs = require("node:fs")
const path = require("node:path")
const { getStorageRoot } = require("../utils/storage")

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".pdf": "application/pdf", ".txt": "text/plain",
  ".mp4": "video/mp4", ".mov": "video/quicktime",
  ".zip": "application/zip", ".ico": "image/x-icon",
}

function staticRouter(req, res, url, config) {
  if (req.method !== "GET" && req.method !== "HEAD") return false
  if (!url.pathname.startsWith("/storage/")) return false

  const relativePath = url.pathname.slice("/storage/".length)
  if (!relativePath || relativePath.includes("..")) return false

  const filePath = path.join(getStorageRoot(), relativePath)

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain" })
    res.end("File not found.")
    return true
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || "application/octet-stream"
  const stat = fs.statSync(filePath)

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Cache-Control": "public, max-age=31536000",
    "Access-Control-Allow-Origin": "*",
  })

  if (req.method === "HEAD") {
    res.end()
    return true
  }

  fs.createReadStream(filePath).pipe(res)
  return true
}

module.exports = { staticRouter }

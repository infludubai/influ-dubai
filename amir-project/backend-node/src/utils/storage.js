const https = require("node:https")
const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")

const MIME_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".pdf": "application/pdf", ".txt": "text/plain",
  ".mp4": "video/mp4", ".mov": "video/quicktime",
  ".zip": "application/zip", ".ico": "image/x-icon",
}

function getSupabaseConfig() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "",
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "uploads",
  }
}

function getPublicUrl(storagePath) {
  const { url, bucket } = getSupabaseConfig()
  if (!url) return "/storage/" + storagePath
  return `${url}/storage/v1/object/public/${bucket}/${storagePath}`
}

async function storeFile(filePath, subfolder = "uploads") {
  const conf = getSupabaseConfig()
  if (!conf.url || !conf.serviceKey) {
    return storeFileLocally(filePath, subfolder)
  }
  return storeFileToSupabase(conf, filePath, subfolder)
}

async function storeFileToSupabase(conf, filePath, subfolder) {
  const filename = path.basename(filePath)
  const storagePath = subfolder + "/" + filename
  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  const contentType = MIME_TYPES[ext] || "application/octet-stream"

  const storageUrl = new URL(`${conf.url}/storage/v1/object/${conf.bucket}/${storagePath}`)
  const driver = storageUrl.protocol === "https:" ? https : http

  await new Promise((resolve, reject) => {
    const req = driver.request(
      {
        hostname: storageUrl.hostname,
        port: storageUrl.port || undefined,
        path: storageUrl.pathname,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${conf.serviceKey}`,
          "Content-Type": contentType,
          "Content-Length": buffer.length,
          "x-upsert": "true",
        },
      },
      (res) => {
        let data = ""
        res.on("data", (c) => { data += c })
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data)
          } else {
            reject(new Error(`Supabase upload ${res.statusCode}: ${data}`))
          }
        })
      }
    )
    req.on("error", reject)
    req.write(buffer)
    req.end()
  })

  try { fs.unlinkSync(filePath) } catch {}
  return storagePath
}

function storeFileLocally(filePath, subfolder) {
  const root = getLocalStorageRoot()
  const uploadDir = path.join(root, subfolder)
  fs.mkdirSync(uploadDir, { recursive: true })

  const filename = path.basename(filePath)
  const destPath = path.join(uploadDir, filename)

  if (filePath !== destPath && fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, destPath)
      fs.unlinkSync(filePath)
    } catch (err) {
      console.error("[storage] move failed:", err.message)
    }
  }

  return subfolder + "/" + filename
}

function getLocalStorageRoot() {
  if (process.env.STORAGE_PATH) {
    try { fs.mkdirSync(process.env.STORAGE_PATH, { recursive: true }) } catch {}
    return process.env.STORAGE_PATH
  }
  const home = process.env.HOME || process.env.USERPROFILE || ""
  if (home) {
    const laravelStorage = path.join(home, "laravel-api", "storage", "app", "public")
    try { fs.mkdirSync(laravelStorage, { recursive: true }); return laravelStorage } catch {}
  }
  const fallback = path.resolve(__dirname, "..", "..", "storage")
  fs.mkdirSync(fallback, { recursive: true })
  console.warn("[storage] Using local fallback:", fallback)
  return fallback
}

function getStorageRoot() { return getLocalStorageRoot() }

function getUploadDir(subfolder = "uploads") {
  const dir = path.join(getStorageRoot(), subfolder)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

async function deleteFile(relativePath) {
  const conf = getSupabaseConfig()
  if (conf.url && conf.serviceKey) {
    const storageUrl = new URL(`${conf.url}/storage/v1/object/${conf.bucket}/${relativePath}`)
    const driver = storageUrl.protocol === "https:" ? https : http
    await new Promise((resolve) => {
      const req = driver.request(
        { hostname: storageUrl.hostname, path: storageUrl.pathname, method: "DELETE",
          headers: { "Authorization": `Bearer ${conf.serviceKey}` } },
        (res) => { res.resume(); res.on("end", resolve) }
      )
      req.on("error", () => resolve())
      req.end()
    }).catch(() => {})
  } else {
    try { fs.unlinkSync(path.join(getStorageRoot(), relativePath)) } catch {}
  }
}

async function listFiles(subfolder = "settings") {
  const conf = getSupabaseConfig()
  if (!conf.url || !conf.serviceKey) return []

  const listUrl = new URL(`${conf.url}/storage/v1/object/list/${conf.bucket}`)
  const driver = listUrl.protocol === "https:" ? https : http
  const body = JSON.stringify({ prefix: subfolder + "/", limit: 200, offset: 0, sortBy: { column: "created_at", order: "desc" } })

  return new Promise((resolve) => {
    const req = driver.request(
      {
        hostname: listUrl.hostname,
        port: listUrl.port || undefined,
        path: listUrl.pathname,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${conf.serviceKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ""
        res.on("data", (c) => { data += c })
        res.on("end", () => {
          try {
            const items = JSON.parse(data)
            const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"]
            resolve(
              Array.isArray(items)
                ? items
                    .filter((f) => f.name && imageExts.some((e) => f.name.toLowerCase().endsWith(e)))
                    .map((f) => ({
                      name: f.name,
                      url: getPublicUrl(subfolder + "/" + f.name),
                      created_at: f.created_at,
                    }))
                : []
            )
          } catch { resolve([]) }
        })
      }
    )
    req.on("error", () => resolve([]))
    req.write(body)
    req.end()
  })
}

module.exports = { getStorageRoot, getUploadDir, storeFile, deleteFile, getPublicUrl, listFiles }

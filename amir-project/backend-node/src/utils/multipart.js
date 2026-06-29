const fs = require("node:fs")
const path = require("node:path")
const crypto = require("node:crypto")

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const MAX_FIELD_SIZE = 64 * 1024        // 64 KB

function getBoundary(contentType) {
  if (!contentType) return null
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/i)
  return match ? (match[1] || match[2]) : null
}

function getTempDir() {
  const tmp = process.env.TMPDIR || process.env.TMP || process.env.TEMP || "/tmp"
  const dir = path.join(tmp, "node-api-uploads")
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Zero-dependency multipart/form-data parser.
 * Writes files to a temp directory — caller should move them with storeFile().
 * Returns { fields: {key: string}, files: [{fieldname, originalname, mimetype, size, path, filename}] }
 */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || ""
    const boundary = getBoundary(contentType)

    if (!boundary) {
      return reject(Object.assign(new Error("Not a multipart request."), { statusCode: 400 }))
    }

    const chunks = []
    let totalSize = 0

    req.on("data", (chunk) => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE + MAX_FIELD_SIZE * 10) {
        req.destroy()
        return reject(Object.assign(new Error("Request too large."), { statusCode: 413 }))
      }
      chunks.push(chunk)
    })

    req.on("error", reject)

    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks)
        const result = parseBody(body, boundary)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  })
}

function parseBody(body, boundary) {
  const sep = Buffer.from("--" + boundary)
  const CRLFCRLF = Buffer.from("\r\n\r\n")

  const fields = {}
  const files = []
  const tempDir = getTempDir()

  let pos = 0
  pos = indexOf(body, sep, pos)
  if (pos === -1) return { fields, files }
  pos += sep.length

  while (pos < body.length) {
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2
    else if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break

    const headerEnd = indexOf(body, CRLFCRLF, pos)
    if (headerEnd === -1) break

    const headerRaw = body.slice(pos, headerEnd).toString("utf8")
    pos = headerEnd + 4

    const nextBoundary = indexOf(body, sep, pos)
    if (nextBoundary === -1) break

    const partBody = body.slice(pos, nextBoundary - 2)
    pos = nextBoundary + sep.length

    const headers = {}
    for (const line of headerRaw.split("\r\n")) {
      const colon = line.indexOf(":")
      if (colon === -1) continue
      headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim()
    }

    const disp = headers["content-disposition"] || ""
    const nameMatch = disp.match(/name="([^"]*)"/)
    const fileMatch = disp.match(/filename="([^"]*)"/)
    const fieldname = nameMatch ? nameMatch[1] : null
    const originalname = fileMatch ? fileMatch[1] : null
    const mimetype = headers["content-type"] || "application/octet-stream"

    if (!fieldname) continue

    if (originalname !== null && originalname !== undefined) {
      if (partBody.length > MAX_FILE_SIZE) {
        throw Object.assign(new Error("File too large (max 20 MB)."), { statusCode: 413 })
      }
      const ext = path.extname(originalname) || ""
      const filename = crypto.randomBytes(16).toString("hex") + ext
      const filePath = path.join(tempDir, filename)
      fs.writeFileSync(filePath, partBody)
      files.push({ fieldname, originalname, mimetype, size: partBody.length, path: filePath, filename })
    } else {
      if (partBody.length > MAX_FIELD_SIZE) continue
      fields[fieldname] = partBody.toString("utf8")
    }

    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break
  }

  return { fields, files }
}

function indexOf(buf, search, start = 0) {
  for (let i = start; i <= buf.length - search.length; i++) {
    let found = true
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break }
    }
    if (found) return i
  }
  return -1
}

module.exports = { parseMultipart }

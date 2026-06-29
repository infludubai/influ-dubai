function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = ""

    req.on("data", (chunk) => {
      body += chunk
      if (Buffer.byteLength(body) > maxBytes) {
        reject(Object.assign(new Error("Request body is too large."), { statusCode: 413 }))
        req.destroy()
      }
    })

    req.on("end", () => {
      if (!body.trim()) return resolve({})

      try {
        resolve(JSON.parse(body))
      } catch {
        reject(Object.assign(new Error("Invalid JSON payload."), { statusCode: 400 }))
      }
    })

    req.on("error", reject)
  })
}

module.exports = { readJsonBody }

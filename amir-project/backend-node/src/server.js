const http = require("node:http")
const { createApp } = require("./app")
const { getConfig } = require("./config/env")

const config = getConfig()
const app = createApp(config)

const server = http.createServer((req, res) => {
  Promise.resolve(app(req, res)).catch((error) => {
    console.error("[node-api] Unhandled request error", error)
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "Internal server error." }))
  })
})

server.listen(config.port, () => {
  console.log(`[node-api] running on http://localhost:${config.port}${config.apiPrefix}`)
})

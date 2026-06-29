const DEFAULT_ENDPOINTS = [
  "/settings/public",
  "/packages",
  "/addons",
  "/portfolio",
  "/blog",
  "/blog/categories",
  "/pages/home",
  "/pages/services",
  "/pages/portfolio",
  "/pages/pricing",
  "/pages/about",
  "/pages/blog",
  "/pages/contact",
  "/checkout/payment-methods",
]

const laravelBase = stripTrailingSlash(process.env.LARAVEL_API_URL || "http://localhost:8000/api")
const nodeBase = stripTrailingSlash(process.env.NODE_API_URL || "http://localhost:8080/api")
const requestTimeoutMs = Number(process.env.PARITY_TIMEOUT_MS || 5000)
const endpoints = (process.env.PARITY_ENDPOINTS || DEFAULT_ENDPOINTS.join(","))
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "")
}

async function fetchJson(baseUrl, endpoint) {
  const started = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
  let response

  try {
    response = await fetch(`${baseUrl}${endpoint}`, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  const text = await response.text()
  let json = null

  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { __nonJsonBody: text.slice(0, 300) }
  }

  return {
    ok: response.ok,
    status: response.status,
    ms: Date.now() - started,
    json,
    shape: shapeOf(json),
  }
}

function shapeOf(value) {
  if (Array.isArray(value)) return value.map((item) => shapeOf(item)).slice(0, 1)
  if (value === null) return "null"
  if (typeof value !== "object") return typeof value

  return Object.keys(value)
    .sort()
    .reduce((shape, key) => {
      shape[key] = shapeOf(value[key])
      return shape
    }, {})
}

function stable(value) {
  return JSON.stringify(value)
}

function summarizePayload(json) {
  if (!json || typeof json !== "object") return ""
  if (Array.isArray(json.data)) return `data=${json.data.length}`
  if (json.data && typeof json.data === "object") return `dataKeys=${Object.keys(json.data).length}`
  if (json.data === null) return "data=null"
  return `keys=${Object.keys(json).length}`
}

async function compareEndpoint(endpoint) {
  const [laravel, node] = await Promise.allSettled([
    fetchJson(laravelBase, endpoint),
    fetchJson(nodeBase, endpoint),
  ])

  if (laravel.status === "rejected" || node.status === "rejected") {
    return {
      endpoint,
      status: "error",
      laravelError: laravel.status === "rejected" ? laravel.reason.message : "",
      nodeError: node.status === "rejected" ? node.reason.message : "",
    }
  }

  const statusMatch = laravel.value.status === node.value.status
  const shapeMatch = stable(laravel.value.shape) === stable(node.value.shape)

  return {
    endpoint,
    status: statusMatch && shapeMatch ? "match" : "diff",
    laravelStatus: laravel.value.status,
    nodeStatus: node.value.status,
    shapeMatch,
    laravelSummary: summarizePayload(laravel.value.json),
    nodeSummary: summarizePayload(node.value.json),
    laravelMs: laravel.value.ms,
    nodeMs: node.value.ms,
  }
}

async function main() {
  console.log(`Laravel API: ${laravelBase}`)
  console.log(`Node API:    ${nodeBase}`)
  console.log("")

  const results = []
  for (const endpoint of endpoints) {
    results.push(await compareEndpoint(endpoint))
  }

  let failed = false
  for (const result of results) {
    if (result.status === "match") {
      console.log(`OK   ${result.endpoint} (${result.laravelStatus}) ${result.laravelSummary}`)
      continue
    }

    failed = true
    if (result.status === "error") {
      console.log(`ERR  ${result.endpoint}`)
      if (result.laravelError) console.log(`     Laravel: ${result.laravelError}`)
      if (result.nodeError) console.log(`     Node:    ${result.nodeError}`)
      continue
    }

    console.log(`DIFF ${result.endpoint}`)
    console.log(`     status: Laravel ${result.laravelStatus}, Node ${result.nodeStatus}`)
    console.log(`     shape:  ${result.shapeMatch ? "match" : "different"}`)
    console.log(`     data:   Laravel ${result.laravelSummary || "-"}, Node ${result.nodeSummary || "-"}`)
  }

  console.log("")
  console.log(`${results.filter((item) => item.status === "match").length}/${results.length} endpoints matched.`)

  if (failed) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

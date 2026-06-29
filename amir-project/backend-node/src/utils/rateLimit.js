/**
 * Simple in-memory rate limiter — no external dependencies.
 * Suitable for a single-process Node.js server on Render.
 * For multi-instance deployments, replace the store with Redis.
 */
const store = new Map()

// Prune expired entries every 5 minutes so the Map never grows unbounded
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000).unref()

/**
 * Check if a request is within the allowed rate.
 * @param {string} ip   - Client IP address
 * @param {string} action - Logical action name ('login', 'register', etc.)
 * @param {object} opts  - { max: number, windowMs: number }
 * @returns {boolean} true = allow, false = rate-limited
 */
function allow(ip, action, { max = 10, windowMs = 60_000 } = {}) {
  const key = `${action}:${ip}`
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
  }

  entry.count++
  store.set(key, entry)

  return entry.count <= max
}

/**
 * Get remaining seconds until the rate-limit window resets.
 */
function retryAfter(ip, action) {
  const key = `${action}:${ip}`
  const entry = store.get(key)
  if (!entry) return 0
  const remaining = Math.ceil((entry.resetAt - Date.now()) / 1000)
  return Math.max(0, remaining)
}

module.exports = { allow, retryAfter }

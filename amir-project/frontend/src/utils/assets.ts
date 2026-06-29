const API_ORIGIN = (() => {
  const base = String((import.meta as any).env?.VITE_API_URL || '/api').trim()
  try {
    const u = new URL(base, window.location.origin)
    u.pathname = u.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '')
    return u.origin + u.pathname
  } catch {
    return ''
  }
})()

// Storage files are served by the Node API server.
// VITE_STORAGE_URL points to the server that has the /storage/ path (api.a-mir.com).
// Falls back to API_ORIGIN for local dev where they're the same server.
const STORAGE_ORIGIN = (() => {
  const env = String((import.meta as any).env?.VITE_STORAGE_URL || '').trim()
  if (env) return env.replace(/\/$/, '')
  return API_ORIGIN
})()

/**
 * Normalise a stored value to a full URL that works for ALL users.
 *
 * Rules:
 *  - data:/blob: → return as-is
 *  - localhost absolute URLs → replace host with STORAGE_ORIGIN
 *  - /storage/* relative paths → prepend STORAGE_ORIGIN (served by Apache)
 *  - proper absolute URLs → return as-is
 *  - anything else → return as-is
 */
export function assetUrl(value?: string): string {
  const raw = String(value || '').trim()
  if (!raw) return ''

  if (/^(data:|blob:)/i.test(raw)) return raw

  // Stale localhost URL — rewrite to storage origin
  if (/^https?:\/\/localhost/i.test(raw)) {
    try {
      const u = new URL(raw)
      return STORAGE_ORIGIN + u.pathname + u.search + u.hash
    } catch {
      return raw
    }
  }

  // Already a proper absolute URL — return as-is
  if (/^https?:\/\//i.test(raw)) return raw

  // Relative /storage/* path — served by Node API (api.a-mir.com)
  const path = raw.startsWith('/') ? raw : `/${raw}`
  if (path.startsWith('/storage/')) {
    return STORAGE_ORIGIN + path
  }

  return path
}

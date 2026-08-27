import "server-only";

/**
 * API base URL for fetches that run on the server.
 *
 * The browser can use a relative base (`/api/v1`) when the site and API share
 * an origin — which is how the single-process deployment works, and why it
 * needs no CORS at all. Node's fetch cannot: it requires an absolute URL.
 *
 * So server components resolve their own base here, preferring an explicit
 * internal address and falling back to the public one when it is absolute.
 */
const PUBLIC = process.env.NEXT_PUBLIC_API_URL?.trim();

function resolve(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal.replace(/\/$/, "");

  // A relative public base means the API is same-origin, reachable on
  // localhost at the port the supervisor gave it.
  if (!PUBLIC || PUBLIC.startsWith("/")) {
    const port = process.env.INTERNAL_API_PORT || "4001";
    return `http://127.0.0.1:${port}${PUBLIC || "/api/v1"}`;
  }

  return PUBLIC.replace(/\/$/, "");
}

export const SERVER_API_URL = resolve();

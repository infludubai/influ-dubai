/**
 * Composes DATABASE_URL from the individual database variables that GoDaddy's
 * Node.js hosting injects into the runtime.
 *
 * GoDaddy provisions MySQL on a private network and exposes it as DB_HOST /
 * DB_PORT / DB_NAME / DB_USER / DB_PASSWORD rather than as a connection
 * string. Building the URL here means there is no credential for anyone to
 * copy into a dashboard by hand — and nothing to re-do when the host rotates
 * the password.
 *
 * An explicitly set DATABASE_URL wins, so local development and any other host
 * keep working unchanged — but only if it is actually a MySQL URL. A stale
 * postgresql:// value left over from a previous host would otherwise be handed
 * to Prisma, which rejects it against a mysql provider and takes the whole app
 * down, while a perfectly good database sits behind DB_HOST.
 */

/** Host panels are inconsistent about naming, so accept the usual spellings. */
const ALIASES = {
  host: ['DB_HOST', 'MYSQL_HOST', 'DATABASE_HOST'],
  port: ['DB_PORT', 'MYSQL_PORT', 'DATABASE_PORT'],
  name: ['DB_NAME', 'MYSQL_DATABASE', 'DATABASE_NAME', 'DB_DATABASE'],
  user: ['DB_USER', 'MYSQL_USER', 'DATABASE_USER', 'DB_USERNAME'],
  password: ['DB_PASSWORD', 'MYSQL_PASSWORD', 'DATABASE_PASSWORD', 'DB_PASS'],
};

function pick(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return { key, value: value.trim() };
  }
  return null;
}

/**
 * Sets process.env.DATABASE_URL when it is absent and the parts are present.
 * Returns a short description of what happened, for logging.
 */
function resolveDatabaseUrl() {
  const existing = process.env.DATABASE_URL?.trim();

  const found = Object.fromEntries(
    Object.entries(ALIASES).map(([part, keys]) => [part, pick(keys)]),
  );

  if (existing) {
    if (existing.startsWith('mysql://')) {
      return 'DATABASE_URL was already set — using it as-is';
    }
    // Not MySQL. Only override when there is something to override it with;
    // otherwise leave it in place so the error names the real problem.
    if (!found.host) {
      return (
        'DATABASE_URL is set but is not a mysql:// URL, and there are no DB_* ' +
        'variables to build one from — the app expects MySQL and will fail to start.'
      );
    }
    const scheme = existing.slice(0, Math.max(0, existing.indexOf('://')));
    delete process.env.DATABASE_URL;
    const composed = compose(found);
    return (
      `ignoring a stale ${scheme || 'unrecognised'}:// DATABASE_URL — the app is MySQL now. ` +
      (composed ?? 'and DB_* is incomplete, so nothing could be composed')
    );
  }

  return (
    compose(found) ?? 'no DATABASE_URL and no DB_* variables — nothing to compose'
  );
}

const REQUIRED = ['host', 'name', 'user', 'password'];

/** Sets process.env.DATABASE_URL from the parts, or explains what is missing. */
function compose(found) {
  const missing = REQUIRED.filter((part) => !found[part]);
  if (missing.length > 0) {
    if (!found.host && missing.length === REQUIRED.length) return null;
    return (
      'cannot compose DATABASE_URL — missing ' +
      missing.map((p) => ALIASES[p][0]).join(', ') +
      '. Add them in the hosting panel, or set DATABASE_URL directly.'
    );
  }

  const port = found.port ? found.port.value : '3306';
  // Passwords routinely contain @ : / and #, all of which are URL syntax.
  const user = encodeURIComponent(found.user.value);
  const password = encodeURIComponent(found.password.value);
  const database = encodeURIComponent(found.name.value);

  // Shared MySQL plans cap concurrent connections well below Prisma's default
  // pool size, and the API and its migration step connect at the same time.
  const url = `mysql://${user}:${password}@${found.host.value}:${port}/${database}?connection_limit=5&pool_timeout=20`;

  process.env.DATABASE_URL = url;
  // Names only — never the values.
  const usedKeys = REQUIRED
    .map((p) => found[p].key)
    .concat(found.port ? [found.port.key] : ['DB_PORT (default 3306)']);
  return `composed DATABASE_URL from ${usedKeys.join(', ')} -> mysql://${found.host.value}:${port}/${found.name.value}`;
}

module.exports = { resolveDatabaseUrl };

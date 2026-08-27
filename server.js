/**
 * Single-process entry point for hosts that run one Node app per repository
 * (GoDaddy's Node.js hosting, and most simple PaaS products).
 *
 * It starts the NestJS API and the Next.js server on internal ports, then
 * fronts both with one public listener on $PORT:
 *
 *   /api/v1/*, /socket.io/*  -> NestJS
 *   everything else          -> Next.js
 *
 * Because both are served from one origin there is no cross-origin request
 * between the site and its API at all, which removes CORS from the picture
 * entirely rather than leaving it as something to misconfigure.
 *
 * No dependencies: the proxy is a thin pipe over node:http, including the
 * Upgrade handshake so realtime messaging keeps working.
 */
const http = require('node:http');
const { spawn } = require('node:child_process');
const { reportConnectivity, reportBindability } = require('./diagnostics');
const { resolveDatabaseUrl } = require('./database-url');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC_PORT = Number(process.env.PORT || 8080);
const API_PORT = Number(process.env.INTERNAL_API_PORT || 44301);
const WEB_PORT = Number(process.env.INTERNAL_WEB_PORT || 44302);

/**
 * Finds an address the sandbox will actually let the internal servers use.
 *
 * The two internal ports are an implementation detail — nothing outside the
 * container ever connects to them — but a host still has to permit the bind.
 * GoDaddy refused 127.0.0.1 outright ('listen EACCES'), so rather than betting
 * on one address and one port number, ask the kernel what is allowed: the
 * preferred interface first, then the other, then whatever ephemeral port it
 * hands out. Only if all of that fails is the situation genuinely hopeless.
 */
function canBind(host, port) {
  return new Promise((resolve) => {
    const probe = http.createServer(() => {});
    probe.once('error', () => resolve(null));
    probe.once('listening', () => {
      const assigned = probe.address().port;
      probe.close(() => resolve(assigned));
    });
    probe.listen(port, host);
  });
}

async function reserveInternal(preferredPort, label) {
  for (const host of ['0.0.0.0', '127.0.0.1']) {
    for (const port of [preferredPort, 0]) {
      const assigned = await canBind(host, port);
      if (assigned) {
        if (host !== '0.0.0.0' || port !== preferredPort) {
          console.log(`[supervisor] ${label}: using ${host}:${assigned}`);
        }
        return { host, port: assigned };
      }
    }
  }
  throw new Error(
    `${label}: this host refuses every internal port bind, so the API and the ` +
      'site cannot be fronted by one listener. See the [diagnostics] bind lines above.',
  );
}

const API_PREFIXES = ['/api/v1', '/socket.io'];

function start(name, file, cwd, port, extraEnv = {}) {
  const child = spawn(process.execPath, [file], {
    cwd,
    env: { ...process.env, PORT: String(port), ...extraEnv },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  child.on('exit', (code, signal) => {
    // If either half dies the app is broken; exit so the host restarts it
    // cleanly rather than serving a half-working site.
    console.error(`[supervisor] ${name} exited (code=${code} signal=${signal}) — shutting down`);
    process.exit(code ?? 1);
  });
  return child;
}

function waitForPort(port, label, timeoutMs = 90000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.request({ host: '127.0.0.1', port, path: '/', method: 'HEAD', timeout: 2000 }, () => {
        req.destroy();
        resolve();
      });
      // Any response at all — including an error status — proves it is listening.
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) return reject(new Error(`${label} did not start within ${timeoutMs}ms`));
        setTimeout(attempt, 500);
      });
      req.on('timeout', () => { req.destroy(); });
      req.end();
    };
    attempt();
  });
}

const isApi = (url) => API_PREFIXES.some((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));

function proxy(req, res, port) {
  const upstream = http.request(
    { host: '127.0.0.1', port, path: req.url, method: req.method, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    console.error(`[proxy] ${req.method} ${req.url} -> :${port} failed: ${err.message}`);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad gateway');
  });
  req.pipe(upstream);
}


/**
 * Removes migrations left behind by a previous deploy.
 *
 * GoDaddy's pull overlays the new code onto the existing files — "your files
 * are preserved" — so a migration deleted in the repo stays on the host and is
 * replayed forever. After the move to MySQL that meant fourteen Postgres
 * migrations still sitting beside the one MySQL one, and the first of them
 * failed on 'CREATE TYPE … AS ENUM', which MySQL has no syntax for.
 *
 * The bundle ships manifest.json listing exactly what this build contains;
 * anything else in the directory is from an older deploy. Without the manifest
 * (a source checkout, local development) nothing is touched.
 */
function pruneStaleMigrations(migrationsDir) {
  const manifestPath = path.join(migrationsDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;

  let expected;
  try {
    expected = new Set(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).migrations);
  } catch (err) {
    console.warn(`[supervisor] migration manifest unreadable (${err.message}) — not pruning`);
    return null;
  }
  if (expected.size === 0) return null;

  const stale = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !expected.has(e.name))
    .map((e) => e.name);

  for (const name of stale) {
    fs.rmSync(path.join(migrationsDir, name), { recursive: true, force: true });
  }
  if (stale.length > 0) {
    console.log(`[supervisor] removed ${stale.length} migration(s) from an earlier deploy: ${stale.join(', ')}`);
  }
  return { expected, stale };
}

/**
 * Clears failed migration records that no deploy can ever resolve.
 *
 * A migration that errors leaves a row in _prisma_migrations with a null
 * finished_at, and 'migrate deploy' then refuses to do anything until it is
 * dealt with (P3018). When that row names a migration this build does not even
 * contain — a leftover from a previous deploy — there is nothing to fix and no
 * amount of redeploying will clear it.
 *
 * Deliberately narrow: only rows that both failed AND are unknown to this
 * build. A shipped migration that fails is a real problem and is left alone
 * for a human to look at.
 */
function clearOrphanedFailedMigrations(root, expected) {
  return new Promise((resolve) => {
    const names = [...expected].map((n) => `'${n.replace(/'/g, "''")}'`).join(', ');
    const sql =
      'DELETE FROM `_prisma_migrations` ' +
      'WHERE finished_at IS NULL ' +
      `AND migration_name NOT IN (${names});`;

    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      // --schema rather than --url: the CLI then reads DATABASE_URL from the
      // environment, so the credential never appears in argv (visible in any
      // process listing) and its query string cannot be re-parsed by a shell.
      ['prisma', 'db', 'execute', '--schema', 'prisma/schema.prisma', '--stdin'],
      {
        cwd: path.join(root, 'backend'),
        env: process.env,
        stdio: ['pipe', 'inherit', 'inherit'],
        shell: process.platform === 'win32',
      },
    );
    child.on('error', () => resolve());
    child.on('exit', (code) => {
      // A missing _prisma_migrations table is the normal case on a fresh
      // database, so a non-zero exit here is not worth failing the boot over.
      console.log(
        code === 0
          ? '[supervisor] cleared any failed records for migrations this build does not ship'
          : '[supervisor] no migration history to clean up yet',
      );
      resolve();
    });
    child.stdin.end(sql);
  });
}

/**
 * Applies pending Prisma migrations before the API starts.
 *
 * Hosts that only run 'npm install' then 'npm start' give no place to hook a
 * release command, so a fresh database would otherwise have no schema at all.
 * Runs at startup rather than build time because DATABASE_URL is a runtime
 * secret and may not exist while building.
 */
async function runMigrations(root) {
  if (!process.env.DATABASE_URL) {
    // In development the API loads its own backend/.env, so the supervisor
    // legitimately has no DATABASE_URL and migrations are run by hand.
    // In production its absence is fatal — silently skipping would leave a
    // fresh database with no schema and a very confusing failure.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is not set — cannot migrate or run the API');
    }
    console.warn('[supervisor] DATABASE_URL not set — skipping migrations (development)');
    return;
  }

  const pruned = pruneStaleMigrations(path.join(root, 'backend', 'prisma', 'migrations'));
  if (pruned && pruned.stale.length > 0) {
    await clearOrphanedFailedMigrations(root, pruned.expected);
  }

  return new Promise((resolve, reject) => {
    console.log('[supervisor] applying database migrations…');
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['prisma', 'migrate', 'deploy'],
      {
        cwd: path.join(root, 'backend'),
        env: process.env,
        stdio: ['ignore', 'inherit', 'inherit'],
        // Node refuses to spawn .cmd shims directly on Windows (EINVAL) since
        // the CVE-2024-27980 fix. Hosting is Linux, but this keeps the
        // supervisor runnable locally for pre-deploy checks.
        shell: process.platform === 'win32',
      },
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`prisma migrate deploy failed with exit code ${code}`)),
    );
  });
}

async function main() {
  const root = __dirname;
  // Build the connection string from the host's DB_* variables before anything
  // reads it — the probe, the migration and both child processes all depend on
  // process.env.DATABASE_URL being final by this point.
  console.log('[supervisor] ' + resolveDatabaseUrl());
  // Report egress before migrating: P1001 alone cannot tell a blocked port
  // from a bad host, and that distinction decides the fix.
  await reportConnectivity(process.env.DATABASE_URL);
  await runMigrations(root);

  await reportBindability([API_PORT, WEB_PORT]);
  const api = await reserveInternal(API_PORT, 'API');
  const web = await reserveInternal(WEB_PORT, 'web');
  console.log(`[supervisor] starting API on ${api.host}:${api.port} and web on ${web.host}:${web.port}`);

  start('api', path.join(root, 'backend', 'dist', 'main.js'), path.join(root, 'backend'), api.port, { HOST: api.host });
  start('web', path.join(root, 'frontend', '.next', 'standalone', 'server.js'), path.join(root, 'frontend', '.next', 'standalone'), web.port, { HOSTNAME: web.host });

  await Promise.all([waitForPort(api.port, 'API'), waitForPort(web.port, 'web')]);
  console.log('[supervisor] both processes are up');

  const server = http.createServer((req, res) => proxy(req, res, isApi(req.url || '') ? api.port : web.port));

  // Socket.io needs the Upgrade handshake forwarded, not just plain requests.
  server.on('upgrade', (req, socket, head) => {
    const port = isApi(req.url || '') ? api.port : web.port;
    const up = http.request({ host: '127.0.0.1', port, path: req.url, method: req.method, headers: req.headers });
    up.on('upgrade', (upRes, upSocket, upHead) => {
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n` +
          Object.entries(upRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
          '\r\n\r\n',
      );
      if (upHead && upHead.length) upSocket.unshift(upHead);
      upSocket.pipe(socket).pipe(upSocket);
    });
    up.on('error', () => socket.destroy());
    if (head && head.length) up.write(head);
    up.end();
  });

  server.listen(PUBLIC_PORT, () => console.log(`[supervisor] listening on :${PUBLIC_PORT}`));
}

main().catch((err) => {
  console.error('[supervisor] fatal:', err);
  process.exit(1);
});

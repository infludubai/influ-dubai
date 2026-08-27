/**
 * Single-process entry point.
 *
 * GoDaddy's Node.js sandbox permits exactly one listening socket — the port it
 * assigns. A probe from inside it refused every alternative, including an
 * ephemeral one:
 *
 *   bind 0.0.0.0:44301 -> REFUSED - EACCES
 *   bind 127.0.0.1:0   -> REFUSED - EACCES
 *
 * So the API and the site cannot be separate servers behind a proxy. Both run
 * in this process and share the one listener:
 *
 *   /api/v1/*, /socket.io/*  ->  NestJS, mounted without binding a port
 *   everything else          ->  Next.js, via its request handler
 *
 * They are same-origin by construction, so there is no cross-origin request
 * between the site and its API at all — CORS stops being something that can be
 * misconfigured.
 */
const http = require('node:http');
const { spawn } = require('node:child_process');
const { reportConnectivity } = require('./diagnostics');
const { resolveDatabaseUrl } = require('./database-url');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC_PORT = Number(process.env.PORT || 8080);

/**
 * Everything else belongs to Next.js.
 *
 * /uploads is Nest's too: avatars, logos and media kits are written to the
 * app's own disk and served by its static handler, so those requests must not
 * fall through to Next.js.
 */
const API_PREFIXES = ['/api/v1', '/socket.io', '/uploads'];
const isApi = (url) =>
  API_PREFIXES.some((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));

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
    console.warn(`[server] migration manifest unreadable (${err.message}) — not pruning`);
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
    console.log(`[server] removed ${stale.length} migration(s) from an earlier deploy: ${stale.join(', ')}`);
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
          ? '[server] cleared any failed records for migrations this build does not ship'
          : '[server] no migration history to clean up yet',
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
    // In development the API loads its own backend/.env, so this entry point
    // legitimately has no DATABASE_URL and migrations are run by hand.
    // In production its absence is fatal — silently skipping would leave a
    // fresh database with no schema and a very confusing failure.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is not set — cannot migrate or run the API');
    }
    console.warn('[server] DATABASE_URL not set — skipping migrations (development)');
    return;
  }

  const pruned = pruneStaleMigrations(path.join(root, 'backend', 'prisma', 'migrations'));
  if (pruned && pruned.stale.length > 0) {
    await clearOrphanedFailedMigrations(root, pruned.expected);
  }

  return new Promise((resolve, reject) => {
    console.log('[server] applying database migrations…');
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['prisma', 'migrate', 'deploy'],
      {
        cwd: path.join(root, 'backend'),
        env: process.env,
        stdio: ['ignore', 'inherit', 'inherit'],
        // Node refuses to spawn .cmd shims directly on Windows (EINVAL) since
        // the CVE-2024-27980 fix. Hosting is Linux, but this keeps the
        // entry point runnable locally for pre-deploy checks.
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


/**
 * Mounts the NestJS API without letting it bind a port.
 *
 * Nest builds its own http.Server around the express instance at creation
 * time, and the websocket gateway attaches to that object during init(). The
 * server never listens, so nothing reaches it on its own — feeding it the
 * 'request' and 'upgrade' events from the public listener drives both the REST
 * routes and Socket.io through exactly the pipeline they expect.
 */
async function mountApi(root) {
  const { createApp } = require(path.join(root, 'backend', 'dist', 'main.js'));
  const app = await createApp();
  await app.init();
  return app.getHttpServer();
}

/**
 * Prepares Next.js in-process and returns its request handler.
 *
 * The standalone build ships its own server.js, but that binds a port. This
 * reproduces what it does — the inlined config, production mode — through the
 * custom-server API instead, so the app can be handed requests directly.
 */
async function mountWeb(root) {
  const dir = path.join(root, 'frontend', '.next', 'standalone');
  // The build records the resolved config; standalone's server.js inlines this
  // same object. Passing it explicitly means next.config.ts is not needed here.
  const { config } = require(path.join(dir, '.next', 'required-server-files.json'));
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);
  process.env.NODE_ENV = 'production';

  const next = require(require.resolve('next', { paths: [dir] }));
  const app = next({ dev: false, dir, conf: config });
  await app.prepare();
  return app.getRequestHandler();
}

/**
 * Resident memory, for the boot log.
 *
 * A container that runs out of memory kills the process without a stack trace
 * or an exit message, which looks identical to a mysterious restart. Printing
 * the footprint at each stage turns that into something readable.
 */
function rss() {
  return `rss ${Math.round(process.memoryUsage().rss / 1048576)}MB`;
}


/**
 * Makes an abrupt exit say something.
 *
 * A container that kills the process for memory, or a rejected promise nobody
 * awaited, both look the same from outside: the app simply restarts with no
 * explanation. These handlers cost nothing and turn that into a line in the
 * log naming what happened.
 */
function reportUnexpectedExits() {
  process.on('uncaughtException', (err) => {
    console.error('[server] uncaught exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    console.error('[server] unhandled rejection:', err);
  });
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      console.error(`[server] received ${signal} — the host is stopping this process (${rss()})`);
      process.exit(0);
    });
  }
  process.on('exit', (code) => console.error(`[server] exiting with code ${code} (${rss()})`));
}

/**
 * Runs a boot step with a deadline.
 *
 * Neither half of the app should take a minute to mount. If one does, saying
 * so beats a log that simply stops.
 */
function withDeadline(label, ms, work) {
  let timer;
  const warn = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} did not finish within ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([work, warn]).finally(() => clearTimeout(timer));
}

/**
 * A holding page for requests that arrive before the app has finished booting.
 *
 * Returns 200, not 503, deliberately: the host polls the port to decide
 * whether the app is alive, and a 503 during a cold start reads as a failure
 * and gets the process killed — which is the very thing this avoids.
 */
function serveStarting(res) {
  const body =
    '<!doctype html><meta charset="utf-8"><title>Starting…</title>' +
    '<meta http-equiv="refresh" content="3">' +
    '<style>body{font:16px system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#444}</style>' +
    '<p>Starting up — this page refreshes itself.</p>';
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Retry-After': '3',
  });
  res.end(body);
}

async function main() {
  const root = __dirname;
  reportUnexpectedExits();

  // Bind before doing any work.
  //
  // Booting Nest and Next takes tens of seconds on a small container, and the
  // host gives a starting app a deadline to answer on its port. Waiting until
  // both halves were ready meant being killed part-way through mapping routes,
  // over and over. Listening first turns a cold start into a few seconds of
  // holding page instead of a restart loop.
  let api = null;
  let web = null;

  const server = http.createServer((req, res) => {
    const url = req.url || '';

    // Answers from the moment the port is bound, so what is up can always be
    // established directly rather than inferred from a truncated log.
    if (url === '/__status' || url.startsWith('/__status?')) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(
        JSON.stringify({
          api: Boolean(api),
          web: Boolean(web),
          rssMb: Math.round(process.memoryUsage().rss / 1048576),
          uptimeSeconds: Math.round(process.uptime()),
          node: process.version,
        }),
      );
    }

    // Each half goes live on its own. Waiting for both meant a working API sat
    // idle behind a holding page whenever the site was the slow one.
    if (isApi(url)) {
      if (!api) {
        res.writeHead(503, { 'Content-Type': 'application/json', 'Retry-After': '5' });
        return res.end('{"message":"The API is still starting."}');
      }
      return api.emit('request', req, res);
    }
    if (!web) return serveStarting(res);
    return web(req, res);
  });

  // Socket.io's handshake starts as an HTTP request and then upgrades; only
  // the API half has anything listening for that.
  server.on('upgrade', (req, socket, head) => {
    if (api && isApi(req.url || '')) api.emit('upgrade', req, socket, head);
    else socket.destroy();
  });

  await new Promise((resolve) => server.listen(PUBLIC_PORT, resolve));
  console.log(`[server] listening on :${PUBLIC_PORT} — booting (${rss()})`);

  // Build the connection string from the host's DB_* variables before anything
  // reads it — the probe, the migration and the API all depend on
  // process.env.DATABASE_URL being final by this point.
  console.log('[server] ' + resolveDatabaseUrl());
  // Report egress before migrating: P1001 alone cannot tell a blocked port
  // from a bad host, and that distinction decides the fix.
  await reportConnectivity(process.env.DATABASE_URL);
  await runMigrations(root);
  console.log(`[server] migrations done (${rss()})`);

  const startedAt = Date.now();
  // Sequential, not parallel: on a small container both halves competing for
  // CPU and memory is what makes a cold start slow enough to be a problem.
  // The API first, so /api/v1 works as early as possible.
  api = await withDeadline('API', 120000, mountApi(root));
  console.log(`[server] API mounted (${Date.now() - startedAt}ms, ${rss()})`);
  web = await withDeadline('site', 120000, mountWeb(root));
  console.log(`[server] site mounted (${Date.now() - startedAt}ms total, ${rss()}) — ready`);
}

main().catch((err) => {
  console.error('[server] fatal:', err);
  process.exit(1);
});

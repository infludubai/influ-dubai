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

async function main() {
  const root = __dirname;
  // Build the connection string from the host's DB_* variables before anything
  // reads it — the probe, the migration and the API all depend on
  // process.env.DATABASE_URL being final by this point.
  console.log('[server] ' + resolveDatabaseUrl());
  // Report egress before migrating: P1001 alone cannot tell a blocked port
  // from a bad host, and that distinction decides the fix.
  await reportConnectivity(process.env.DATABASE_URL);
  await runMigrations(root);

  const [api, web] = await Promise.all([mountApi(root), mountWeb(root)]);
  console.log('[server] API and site are mounted');

  const server = http.createServer((req, res) => {
    if (isApi(req.url || '')) api.emit('request', req, res);
    else web(req, res);
  });

  // Socket.io's handshake starts as an HTTP request and then upgrades; only
  // the API half has anything listening for that.
  server.on('upgrade', (req, socket, head) => {
    if (isApi(req.url || '')) api.emit('upgrade', req, socket, head);
    else socket.destroy();
  });

  server.listen(PUBLIC_PORT, () =>
    console.log(`[server] listening on :${PUBLIC_PORT}`),
  );
}

main().catch((err) => {
  console.error('[server] fatal:', err);
  process.exit(1);
});

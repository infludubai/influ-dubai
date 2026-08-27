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
const path = require('node:path');

const PUBLIC_PORT = Number(process.env.PORT || 8080);
const API_PORT = Number(process.env.INTERNAL_API_PORT || 44301);
const WEB_PORT = Number(process.env.INTERNAL_WEB_PORT || 44302);

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
 * Applies pending Prisma migrations before the API starts.
 *
 * Hosts that only run 'npm install' then 'npm start' give no place to hook a
 * release command, so a fresh database would otherwise have no schema at all.
 * Runs at startup rather than build time because DATABASE_URL is a runtime
 * secret and may not exist while building.
 */
function runMigrations(root) {
  return new Promise((resolve, reject) => {
    if (!process.env.DATABASE_URL) {
      // In development the API loads its own backend/.env, so the supervisor
      // legitimately has no DATABASE_URL and migrations are run by hand.
      // In production its absence is fatal — silently skipping would leave a
      // fresh database with no schema and a very confusing failure.
      if (process.env.NODE_ENV === 'production') {
        return reject(new Error('DATABASE_URL is not set — cannot migrate or run the API'));
      }
      console.warn('[supervisor] DATABASE_URL not set — skipping migrations (development)');
      return resolve();
    }
    console.log('[supervisor] applying database migrations…');
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['prisma', 'migrate', 'deploy'],
      { cwd: path.join(root, 'backend'), env: process.env, stdio: ['ignore', 'inherit', 'inherit'] },
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
  await runMigrations(root);
  console.log(`[supervisor] starting API on :${API_PORT} and web on :${WEB_PORT}`);

  start('api', path.join(root, 'backend', 'dist', 'main.js'), path.join(root, 'backend'), API_PORT);
  start('web', path.join(root, 'frontend', '.next', 'standalone', 'server.js'), path.join(root, 'frontend', '.next', 'standalone'), WEB_PORT, { HOSTNAME: '127.0.0.1' });

  await Promise.all([waitForPort(API_PORT, 'API'), waitForPort(WEB_PORT, 'web')]);
  console.log('[supervisor] both processes are up');

  const server = http.createServer((req, res) => proxy(req, res, isApi(req.url || '') ? API_PORT : WEB_PORT));

  // Socket.io needs the Upgrade handshake forwarded, not just plain requests.
  server.on('upgrade', (req, socket, head) => {
    const port = isApi(req.url || '') ? API_PORT : WEB_PORT;
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

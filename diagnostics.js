/**
 * Outbound connectivity reporting for deploy debugging.
 *
 * Prisma's P1001 says only "can't reach the database" — it cannot distinguish
 * a blocked port from a wrong host from a paused database. On a host whose
 * egress rules are undocumented that difference decides the whole approach,
 * so this probes the ports directly and reports which are open.
 *
 * Never logs credentials: only the hostname and port numbers.
 */
const net = require('node:net');

function probePort(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = new net.Socket();
    const done = (verdict) => {
      sock.destroy();
      resolve(`${verdict} (${Date.now() - started}ms)`);
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => done('REACHABLE'));
    sock.once('timeout', () => done('BLOCKED - timed out'));
    sock.once('error', (e) => done(`BLOCKED - ${e.code || e.message}`));
    sock.connect(port, host);
  });
}

async function reportConnectivity(databaseUrl) {
  if (!databaseUrl) {
    console.warn('[diagnostics] DATABASE_URL is not set');
    return;
  }

  let host;
  let port;
  try {
    const u = new URL(databaseUrl);
    host = u.hostname;
    port = Number(u.port || 5432);
  } catch {
    console.warn('[diagnostics] DATABASE_URL could not be parsed');
    return;
  }

  // 443 acts as the control: if it is reachable and the database ports are
  // not, the host is filtering by port rather than having no egress at all.
  const [configured, transactionPooler, https] = await Promise.all([
    probePort(host, port),
    probePort(host, 6543),
    probePort(host, 443),
  ]);

  console.log(`[diagnostics] ${host}:${port} (configured) -> ${configured}`);
  console.log(`[diagnostics] ${host}:6543 (tx pooler)     -> ${transactionPooler}`);
  console.log(`[diagnostics] ${host}:443  (control)       -> ${https}`);
}

module.exports = { probePort, reportConnectivity };

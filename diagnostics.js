/**
 * Outbound connectivity reporting for deploy debugging.
 *
 * Prisma's P1001 says only "can't reach the database" — it cannot distinguish
 * a blocked port from a wrong host from a paused database. On a host whose
 * egress rules are undocumented that difference decides the whole approach,
 * so this probes the ports directly and reports which are open.
 *
 * Never logs credentials: only hostnames and port numbers.
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

/**
 * Reports reachability of every database this host might use.
 *
 * The GoDaddy-provisioned MySQL is checked because its credentials are
 * injected into the runtime automatically (DB_HOST and friends); whether the
 * sandbox can actually reach it decides if migrating off Postgres is even
 * worth attempting.
 */
async function reportConnectivity(databaseUrl) {
  const checks = [];

  if (databaseUrl) {
    try {
      const u = new URL(databaseUrl);
      const port = Number(u.port || 5432);
      checks.push({ label: 'external database (DATABASE_URL)', host: u.hostname, port });
      // 443 as a control: if it answers while the database port does not,
      // the host is filtering by port rather than blocking all egress.
      checks.push({ label: 'control (https)', host: u.hostname, port: 443 });
    } catch {
      console.warn('[diagnostics] DATABASE_URL could not be parsed');
    }
  }

  if (process.env.DB_HOST) {
    checks.push({
      label: 'GoDaddy MySQL (DB_HOST)',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
    });
  } else {
    console.log('[diagnostics] DB_HOST is not set — no GoDaddy MySQL provisioned for this app');
  }

  for (const { label, host, port } of checks) {
    const verdict = await probePort(host, port);
    console.log(`[diagnostics] ${label} ${host}:${port} -> ${verdict}`);
  }
}


module.exports = { probePort, reportConnectivity };

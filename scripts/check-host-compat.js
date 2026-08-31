/**
 * Decides whether a host can run this app.
 *
 * The blocker on most shared hosting is outbound access to an external
 * Postgres port — plenty of hosts silently drop anything that is not 80/443.
 * If that fails, the app cannot reach Supabase and the plan is dead before
 * any deployment work starts.
 *
 * Zero dependencies. Run on the target host:
 *   node check-host-compat.js
 */
const net = require('net');
const dns = require('dns').promises;

const DB_HOST = process.env.DB_HOST || 'aws-1-ap-northeast-1.pooler.supabase.com';
const DB_PORT = Number(process.env.DB_PORT || 5432);

function tcpCheck(host, port, timeout = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = new net.Socket();
    const done = (ok, detail) => {
      sock.destroy();
      resolve({ ok, detail, ms: Date.now() - started });
    };
    sock.setTimeout(timeout);
    sock.once('connect', () => done(true, 'connected'));
    sock.once('timeout', () => done(false, 'timed out — port likely blocked'));
    sock.once('error', (e) => done(false, e.code || e.message));
    sock.connect(port, host);
  });
}

(async () => {
  console.log('--- Host compatibility check ---\n');

  const major = Number(process.version.slice(1).split('.')[0]);
  console.log(`Node version : ${process.version}  ${major >= 20 && major < 23 ? 'OK' : 'PROBLEM — this app needs Node 20–22'}`);
  console.log(`Memory limit : ${Math.round(require('os').totalmem() / 1024 / 1024)} MB total on host`);

  try {
    const a = await dns.lookup(DB_HOST);
    console.log(`DNS          : ${DB_HOST} -> ${a.address}  OK`);
  } catch (e) {
    console.log(`DNS          : FAILED (${e.code}) — outbound DNS is restricted`);
  }

  const db = await tcpCheck(DB_HOST, DB_PORT);
  console.log(`Postgres :${DB_PORT}  : ${db.ok ? 'REACHABLE' : 'BLOCKED'} (${db.detail}, ${db.ms}ms)`);

  const https = await tcpCheck('api.openai.com', 443);
  console.log(`HTTPS out    : ${https.ok ? 'OK' : 'BLOCKED'} (${https.detail})`);

  console.log('\n--- Verdict ---');
  if (!db.ok) {
    console.log('CANNOT HOST HERE: the database is unreachable from this server.');
    console.log('Outbound Postgres is blocked, which no amount of config will fix.');
  } else if (major < 20 || major >= 23) {
    console.log('Database reachable, but the Node version is wrong. Change it in cPanel first.');
  } else {
    console.log('VIABLE: database reachable and Node version correct.');
  }
})();

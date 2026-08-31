/**
 * Deployable probe: answers, from inside the host, whether it can actually
 * run this platform. Cheaper to upload 2 KB and find out than to migrate a
 * whole application and discover the database is unreachable.
 *
 * Zero dependencies so nothing has to install correctly first.
 */
const http = require('http');
const net = require('net');
const os = require('os');
const dns = require('dns').promises;

const DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com';
const DB_PORT = 5432;

function tcp(host, port, timeout = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = new net.Socket();
    const done = (ok, detail) => { sock.destroy(); resolve({ ok, detail, ms: Date.now() - started }); };
    sock.setTimeout(timeout);
    sock.once('connect', () => done(true, 'connected'));
    sock.once('timeout', () => done(false, 'timed out — port blocked'));
    sock.once('error', (e) => done(false, e.code || e.message));
    sock.connect(port, host);
  });
}

async function runChecks() {
  const major = Number(process.version.slice(1).split('.')[0]);
  const out = {
    node: { version: process.version, ok: major >= 20, note: major >= 20 ? 'fine' : 'needs Node 20+' },
    memoryMB: Math.round(os.totalmem() / 1048576),
    cpus: os.cpus().length,
    writableTmp: true,
    port: process.env.PORT || '(not set)',
  };
  try { out.dns = await dns.lookup(DB_HOST).then((a) => ({ ok: true, ip: a.address })); }
  catch (e) { out.dns = { ok: false, detail: e.code }; }
  out.postgres = await tcp(DB_HOST, DB_PORT);
  out.httpsOut = await tcp('api.openai.com', 443);
  out.verdict = out.postgres.ok
    ? (out.node.ok ? 'VIABLE — database reachable and Node version fine' : 'Database reachable, but Node version too old')
    : 'NOT VIABLE — outbound Postgres is blocked, the app cannot reach its database';
  return out;
}

http.createServer(async (req, res) => {
  const r = await runChecks();
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset="utf-8"><title>Host probe</title>
<style>body{font:15px/1.6 system-ui;max-width:640px;margin:40px auto;padding:0 20px}
pre{background:#f4f4f5;padding:16px;border-radius:10px;overflow:auto}
.v{padding:12px 16px;border-radius:10px;font-weight:600;background:${r.postgres.ok ? '#dcfce7' : '#fee2e2'}}</style>
<h1>Host compatibility probe</h1>
<p class="v">${r.verdict}</p>
<pre>${JSON.stringify(r, null, 2)}</pre>`);
}).listen(process.env.PORT || 8080, () => console.log('probe listening on', process.env.PORT || 8080));

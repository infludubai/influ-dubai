/**
 * Builds both workspaces for a single-app host.
 *
 * Two things this gets right that a plain npm script chain does not:
 *
 *  - cwd per workspace. `npm --prefix X ci` resolves the lockfile from the
 *    current directory on some npm versions, producing a partial install.
 *
 *  - NODE_ENV per step. npm treats NODE_ENV=production as --omit=dev, so
 *    installing under it silently drops the compilers (TypeScript, the Nest
 *    CLI) that the build then needs. Installs therefore run with NODE_ENV
 *    unset, and only the builds run as production. Hosts that inject their
 *    own NODE_ENV — GoDaddy sets a non-standard value Next.js rejects — are
 *    overridden either way.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, cwd, label, nodeEnv) {
  return new Promise((resolve, reject) => {
    console.log(`\n[build] ${label} (NODE_ENV=${nodeEnv ?? 'unset'}): npm ${args.join(' ')}`);
    const env = { ...process.env };
    // Deprecated and actively harmful here: it forces --omit=dev.
    delete env.NPM_CONFIG_PRODUCTION;
    if (nodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = nodeEnv;

    const child = spawn(npm, args, {
      cwd,
      env,
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} failed with exit code ${code}`)),
    );
  });
}

const backend = join(root, 'backend');
const frontend = join(root, 'frontend');

// Installs: NODE_ENV unset so devDependencies are included.
await run(['ci', '--include=dev'], backend, 'backend install', undefined);
await run(['ci', '--include=dev'], frontend, 'frontend install', undefined);

// Builds: production, which is what the compilers expect.
await run(['run', 'prisma:generate'], backend, 'prisma generate', 'production');
await run(['run', 'build'], backend, 'backend build', 'production');
await run(['run', 'build'], frontend, 'frontend build', 'production');

console.log('\n[build] both workspaces built');

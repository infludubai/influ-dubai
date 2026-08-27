/**
 * Builds both workspaces for a single-app host.
 *
 * Uses an explicit script rather than npm --prefix chains because:
 *  - `npm --prefix X ci` resolves the lockfile from the *current* directory on
 *    some npm versions, producing a partial install; running with cwd set to
 *    the workspace is unambiguous.
 *  - Hosts set their own NODE_ENV (GoDaddy uses a non-standard value, which
 *    Next.js warns about and which breaks its build). Each build gets a
 *    normalised NODE_ENV=production regardless of what the host injected.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, cwd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n[build] ${label}: npm ${args.join(' ')}  (in ${cwd})`);
    const child = spawn(npm, args, {
      cwd,
      // Normalise NODE_ENV so npm installs devDependencies (needed for the
      // compilers) and Next.js sees a value it understands.
      env: { ...process.env, NODE_ENV: 'production', NPM_CONFIG_PRODUCTION: 'false' },
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

await run(['ci', '--include=dev'], backend, 'backend install');
await run(['run', 'prisma:generate'], backend, 'prisma generate');
await run(['run', 'build'], backend, 'backend build');

await run(['ci', '--include=dev'], frontend, 'frontend install');
await run(['run', 'build'], frontend, 'frontend build');

console.log('\n[build] both workspaces built');

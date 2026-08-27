/**
 * Completes Next.js `output: "standalone"` for self-hosting.
 *
 * The standalone bundle deliberately omits `.next/static` and `public`,
 * because Vercel serves those from its CDN. Any other host — GoDaddy, a VPS,
 * Docker — must have them sitting next to server.js, or the site loads with
 * no CSS, no JS chunks and no images.
 *
 * Runs as `postbuild`, so a correct deployable bundle is simply what
 * `npm run build` produces.
 */
import { cp, access } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');

const exists = async (p) => access(p).then(() => true).catch(() => false);

if (!(await exists(standalone))) {
  console.log('[standalone] no standalone output — nothing to prepare');
  process.exit(0);
}

const copies = [
  { from: join(root, '.next', 'static'), to: join(standalone, '.next', 'static'), label: '.next/static' },
  { from: join(root, 'public'), to: join(standalone, 'public'), label: 'public' },
];

for (const { from, to, label } of copies) {
  if (!(await exists(from))) {
    console.log(`[standalone] skipped ${label} (not present)`);
    continue;
  }
  await cp(from, to, { recursive: true, force: true });
  console.log(`[standalone] copied ${label}`);
}

console.log('[standalone] ready — start with: node .next/standalone/server.js');

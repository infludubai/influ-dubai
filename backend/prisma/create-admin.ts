/**
 * Creates (or promotes) a platform administrator.
 *
 * Deliberately separate from the demo seed: the seed inserts fake creators,
 * brands and campaigns that must never touch a live marketplace, and it uses
 * a password that is committed to this repository.
 *
 * Credentials come from the environment so nothing secret is ever written to
 * source control:
 *
 *   ADMIN_EMAIL=you@yourdomain.com ADMIN_PASSWORD='…' npm run admin:create
 *
 * Safe to re-run: an existing user is promoted to ADMIN and their password is
 * only reset when ADMIN_RESET_PASSWORD=true is passed explicitly.
 */
import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MIN_PASSWORD_LENGTH = 12;
/** Passwords that have appeared in this repo or in docs must never be reused. */
const KNOWN_WEAK = ['admin123!', 'demo1234!', 'password', 'changeme'];

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_NAME?.trim() || 'Platform Admin';
  const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';

  if (!email || !password) {
    fail(
      'ADMIN_EMAIL and ADMIN_PASSWORD are required.\n\n' +
        "  Example:\n" +
        "  ADMIN_EMAIL=you@yourdomain.com ADMIN_PASSWORD='a-long-unique-passphrase' npm run admin:create",
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail(`"${email}" is not a valid email address.`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (KNOWN_WEAK.includes(password.toLowerCase())) {
    fail(
      'That password appears in this repository and is effectively public. Choose a unique one.',
    );
  }

  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    create: { name: RoleName.ADMIN, description: 'ADMIN role' },
    update: {},
  });

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        roleId: adminRole.id,
        status: 'ACTIVE',
        ...(resetPassword ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });

    console.log(`\n✓ ${email} is now an ADMIN.`);
    if (existing.role.name !== RoleName.ADMIN) {
      console.log(`  Promoted from ${existing.role.name}.`);
    }
    console.log(
      resetPassword
        ? '  Password was reset.'
        : '  Existing password kept — pass ADMIN_RESET_PASSWORD=true to change it.',
    );
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(password, 10),
        status: 'ACTIVE',
        roleId: adminRole.id,
        profile: { create: { displayName } },
      },
    });
    console.log(`\n✓ Admin created: ${email}`);
  }

  console.log('  Sign in at /login, then open /admin.\n');
}

main()
  .catch((err) => {
    console.error('\n✗ Failed to create admin:', err.message, '\n');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

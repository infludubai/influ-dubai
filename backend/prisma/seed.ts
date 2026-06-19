import "dotenv/config";
import { PrismaClient, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

// Base permission keys for Phase 2. More are added as later phases land
// (e.g. campaign:*, marketplace:*) — see docs/02-architecture.md §4.
const PERMISSIONS: Record<RoleName, string[]> = {
  CREATOR: ["profile:update:own", "campaign:view:invited"],
  BRAND: ["profile:update:own", "campaign:create:own", "campaign:update:own"],
  AGENCY: ["profile:update:own", "campaign:create:own", "campaign:update:own", "client:manage"],
  ADMIN: ["user:manage:any", "campaign:manage:any", "billing:manage:any"],
};

async function main() {
  const allPermissionKeys = Array.from(
    new Set(Object.values(PERMISSIONS).flat())
  );

  for (const key of allPermissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  for (const roleName of Object.values(RoleName) as RoleName[]) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const key of PERMISSIONS[roleName]) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log("Seed complete: roles & permissions ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

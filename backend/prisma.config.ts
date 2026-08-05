// Prisma 6 no longer auto-loads .env when a config file is present, so the
// CLI (migrate/studio/seed) needs it loaded explicitly. Dev-time only — the
// running app gets its env from the host.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] as string,
  },
});

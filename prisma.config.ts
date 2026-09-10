import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Migrations need a direct/session connection (PgBouncer transaction-mode
    // pooling doesn't support the advisory locks Prisma Migrate takes). Falls
    // back to DATABASE_URL for a plain, unpooled Postgres instance (e.g. local
    // Docker) where there's no separate pooled/direct split.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
});

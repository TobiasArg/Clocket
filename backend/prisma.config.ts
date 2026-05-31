import "dotenv/config";
import { defineConfig } from "prisma/config";

const DEFAULT_LOCAL_DATABASE_URL =
  "postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? DEFAULT_LOCAL_DATABASE_URL,
  },
});

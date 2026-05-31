import { describe, expect, it } from "vitest";
import { Prisma } from "../generated/prisma/client";
import { createPrismaClient } from "./prismaClient";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describe("Prisma Decimal smoke", () => {
  it("preserves decimal precision without JavaScript floating point math", () => {
    const amount = new Prisma.Decimal("10.10").plus(new Prisma.Decimal("0.20"));

    expect(amount.toFixed(2)).toBe("10.30");
  });
});

describeDb("Prisma PostgreSQL smoke", () => {
  it("connects to PostgreSQL and reads migration table state", async () => {
    const prisma = createPrismaClient();

    try {
      const connection = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1::int AS connected`;
      expect(connection[0]?.connected).toBe(1);

      const migrationTable = await prisma.$queryRaw<Array<{ migration_table: string | null }>>`
        SELECT to_regclass('_prisma_migrations')::text AS migration_table
      `;
      expect(migrationTable[0]).toHaveProperty("migration_table");
    } finally {
      await prisma.$disconnect();
    }
  });
});

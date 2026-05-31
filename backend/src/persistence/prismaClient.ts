import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getDatabaseConfig } from "./databaseConfig";

type GlobalWithPrisma = typeof globalThis & {
  clocketPrisma?: PrismaClient;
};

export const createPrismaClient = (databaseUrl = getDatabaseConfig().databaseUrl): PrismaClient => {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
};

export const getPrismaClient = (): PrismaClient => {
  const globalForPrisma = globalThis as GlobalWithPrisma;

  if (!globalForPrisma.clocketPrisma) {
    globalForPrisma.clocketPrisma = createPrismaClient();
  }

  return globalForPrisma.clocketPrisma;
};

export type { PrismaClient };

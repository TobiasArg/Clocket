import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { createAccountsRepository } from "./accountsRepository";

const baseAccount = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Cuenta principal",
  balance: new Prisma.Decimal("10.30"),
  currency: "USD" as const,
  icon: "wallet",
  createdAt: new Date("2026-05-31T10:00:00.000Z"),
  updatedAt: new Date("2026-05-31T10:00:00.000Z"),
  deletedAt: null,
};

const createPrismaMock = () => ({
  account: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
});

describe("createAccountsRepository", () => {
  it("lists active accounts and serializes Decimal balances", async () => {
    const prisma = createPrismaMock();
    prisma.account.findMany.mockResolvedValue([baseAccount]);
    const repository = createAccountsRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActive()).resolves.toEqual([{
      id: baseAccount.id,
      name: "Cuenta principal",
      balance: "10.30",
      currency: "USD",
      icon: "wallet",
      createdAt: "2026-05-31T10:00:00.000Z",
      updatedAt: "2026-05-31T10:00:00.000Z",
      deletedAt: null,
    }]);
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });
  });

  it("creates accounts with trimmed display fields and default currency", async () => {
    const prisma = createPrismaMock();
    prisma.account.create.mockResolvedValue({
      ...baseAccount,
      name: "Savings",
      icon: "bank",
      balance: new Prisma.Decimal("250.00"),
    });
    const repository = createAccountsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: "  Savings  ",
      balance: "250.00",
      icon: "  bank  ",
    })).resolves.toMatchObject({
      name: "Savings",
      balance: "250.00",
      currency: "USD",
      icon: "bank",
    });
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        name: "Savings",
        balance: new Prisma.Decimal("250.00"),
        currency: "USD",
        icon: "bank",
      },
    });
  });

  it("returns null when updating a missing or deleted account", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue(null);
    const repository = createAccountsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(baseAccount.id, { name: "Updated" })).resolves.toBeNull();
    expect(prisma.account.update).not.toHaveBeenCalled();
  });

  it("updates active accounts", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: baseAccount.id });
    prisma.account.update.mockResolvedValue({
      ...baseAccount,
      name: "Updated",
      balance: new Prisma.Decimal("20.00"),
      updatedAt: new Date("2026-05-31T11:00:00.000Z"),
    });
    const repository = createAccountsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(baseAccount.id, {
      name: " Updated ",
      balance: "20.00",
    })).resolves.toMatchObject({
      name: "Updated",
      balance: "20.00",
      updatedAt: "2026-05-31T11:00:00.000Z",
    });
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: baseAccount.id },
      data: {
        name: "Updated",
        balance: new Prisma.Decimal("20.00"),
      },
    });
  });

  it("soft deletes active accounts", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: baseAccount.id });
    prisma.account.update.mockResolvedValue({
      ...baseAccount,
      deletedAt: new Date("2026-05-31T12:00:00.000Z"),
    });
    const repository = createAccountsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(baseAccount.id)).resolves.toBe(true);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: baseAccount.id },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});

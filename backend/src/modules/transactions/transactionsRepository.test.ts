import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { createTransactionsRepository } from "./transactionsRepository";

const accountId = "00000000-0000-4000-8000-000000000001";
const categoryId = "00000000-0000-4000-8000-000000000101";
const subcategoryId = "00000000-0000-4000-8000-000000000201";
const goalId = "00000000-0000-4000-8000-000000000301";
const installmentPlanId = "00000000-0000-4000-8000-000000000401";
const transactionId = "00000000-0000-4000-8000-000000000501";

const baseTransaction = {
  id: transactionId,
  accountId,
  categoryId,
  subcategoryId,
  goalId: null,
  installmentPlanId: null,
  transactionType: "REGULAR" as const,
  name: "Groceries",
  amount: new Prisma.Decimal("35.40"),
  currency: "USD" as const,
  date: new Date("2026-06-02T00:00:00.000Z"),
  notes: null,
  uiIcon: "cart",
  uiIconBg: "bg-emerald-500",
  cuotaInstallmentIndex: null,
  cuotaInstallmentsCount: null,
  createdAt: new Date("2026-06-02T10:00:00.000Z"),
  updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  deletedAt: null,
};

const createPrismaMock = () => ({
  account: {
    findFirst: vi.fn(),
  },
  category: {
    findFirst: vi.fn(),
  },
  subcategory: {
    findFirst: vi.fn(),
  },
  goal: {
    findFirst: vi.fn(),
  },
  installmentPlan: {
    findFirst: vi.fn(),
  },
  transaction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
});

describe("createTransactionsRepository", () => {
  it("lists active transactions with indexed finance filters and serializes canonical values", async () => {
    const prisma = createPrismaMock();
    prisma.transaction.findMany.mockResolvedValue([baseTransaction]);
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActive({
      accountId,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    })).resolves.toEqual([{
      id: transactionId,
      accountId,
      categoryId,
      subcategoryId,
      goalId: null,
      installmentPlanId: null,
      transactionType: "regular",
      classification: "income",
      name: "Groceries",
      amount: "35.40",
      currency: "USD",
      date: "2026-06-02",
      notes: null,
      uiIcon: "cart",
      uiIconBg: "bg-emerald-500",
      categoryName: null,
      subcategoryName: null,
      cuotaInstallmentIndex: null,
      cuotaInstallmentsCount: null,
      createdAt: "2026-06-02T10:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
      deletedAt: null,
    }]);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        accountId,
        date: {
          gte: new Date("2026-06-01T00:00:00.000Z"),
          lte: new Date("2026-06-30T00:00:00.000Z"),
        },
      },
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  });

  it("creates regular transactions with Decimal amount and inferred category from subcategory", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    prisma.subcategory.findFirst.mockResolvedValue({ id: subcategoryId, categoryId });
    prisma.category.findFirst.mockResolvedValue({ id: categoryId, incomeEligible: true, expenseEligible: true, savingEligible: true });
    prisma.transaction.create.mockResolvedValue(baseTransaction);
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      accountId,
      subcategoryId,
      name: " Groceries ",
      amount: "35.40",
      date: "2026-06-02",
      uiIcon: " cart ",
      uiIconBg: " bg-emerald-500 ",
    })).resolves.toMatchObject({
      categoryId,
      subcategoryId,
      amount: "35.40",
      transactionType: "regular",
    });
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        accountId,
        categoryId,
        subcategoryId,
        goalId: null,
        installmentPlanId: null,
        transactionType: "REGULAR",
        name: "Groceries",
        amount: new Prisma.Decimal("35.40"),
        currency: "USD",
        date: new Date("2026-06-02T00:00:00.000Z"),
        notes: null,
        uiIcon: null,
        uiIconBg: null,
        cuotaInstallmentIndex: null,
        cuotaInstallmentsCount: null,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });
  });

  it("rejects writes that reference a missing or soft-deleted account", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue(null);
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      accountId,
      name: "Groceries",
      amount: "35.40",
      date: "2026-06-02",
    })).rejects.toMatchObject({
      code: "MISSING_ACCOUNT",
    });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("rejects transactions when subcategory does not belong to the requested category", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    prisma.subcategory.findFirst.mockResolvedValue({
      id: subcategoryId,
      categoryId: "00000000-0000-4000-8000-000000000102",
    });
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      accountId,
      categoryId,
      subcategoryId,
      name: "Groceries",
      amount: "35.40",
      date: "2026-06-02",
    })).rejects.toMatchObject({
      code: "SUBCATEGORY_CATEGORY_MISMATCH",
    });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("rejects saving transactions without a goal reference", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      accountId,
      transactionType: "saving",
      name: "Goal saving",
      amount: "100.00",
      date: "2026-06-02",
    })).rejects.toMatchObject({
      code: "SAVING_REQUIRES_GOAL",
    });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("rejects category eligibility mismatches and zero amounts", async () => {
    const prisma = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    prisma.category.findFirst.mockResolvedValue({
      id: categoryId,
      incomeEligible: false,
      expenseEligible: true,
      savingEligible: true,
    });
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      accountId,
      categoryId,
      name: "Consulting",
      amount: "35.40",
      date: "2026-06-02",
    })).rejects.toMatchObject({ code: "CATEGORY_NOT_ELIGIBLE_FOR_CLASSIFICATION" });

    await expect(repository.create({
      accountId,
      categoryId,
      name: "No amount",
      amount: "0.00",
      date: "2026-06-02",
    })).rejects.toMatchObject({ code: "INVALID_AMOUNT_SIGN" });
  });

  it("updates active transactions and validates new goal/installment links", async () => {
    const prisma = createPrismaMock();
    prisma.transaction.findFirst.mockResolvedValue(baseTransaction);
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    prisma.category.findFirst.mockResolvedValue({ id: categoryId, incomeEligible: true, expenseEligible: true, savingEligible: true });
    prisma.goal.findFirst.mockResolvedValue({ id: goalId });
    prisma.installmentPlan.findFirst.mockResolvedValue({ id: installmentPlanId });
    prisma.transaction.update.mockResolvedValue({
      ...baseTransaction,
      goalId,
      installmentPlanId,
      transactionType: "SAVING" as const,
      name: "Goal saving",
      amount: new Prisma.Decimal("100.00"),
      date: new Date("2026-06-03T00:00:00.000Z"),
      cuotaInstallmentIndex: 1,
      cuotaInstallmentsCount: 12,
      updatedAt: new Date("2026-06-02T11:00:00.000Z"),
    });
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(transactionId, {
      categoryId,
      subcategoryId: null,
      goalId,
      installmentPlanId,
      transactionType: "saving",
      name: " Goal saving ",
      amount: "100.00",
      date: "2026-06-03",
      cuotaInstallmentIndex: 1,
      cuotaInstallmentsCount: 12,
    })).resolves.toMatchObject({
      transactionType: "saving",
      goalId,
      installmentPlanId,
      amount: "100.00",
      date: "2026-06-03",
    });
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: transactionId },
      data: {
        accountId,
        categoryId,
        subcategoryId: null,
        goalId,
        installmentPlanId,
        transactionType: "SAVING",
        name: "Goal saving",
        amount: new Prisma.Decimal("100.00"),
        date: new Date("2026-06-03T00:00:00.000Z"),
        cuotaInstallmentIndex: 1,
        cuotaInstallmentsCount: 12,
        uiIcon: null,
        uiIconBg: null,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });
  });

  it("returns null when updating a missing or soft-deleted transaction", async () => {
    const prisma = createPrismaMock();
    prisma.transaction.findFirst.mockResolvedValue(null);
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(transactionId, { name: "Updated" })).resolves.toBeNull();
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });

  it("soft deletes active transactions", async () => {
    const prisma = createPrismaMock();
    prisma.transaction.findFirst.mockResolvedValue({ id: transactionId });
    prisma.transaction.update.mockResolvedValue({
      ...baseTransaction,
      deletedAt: new Date("2026-06-02T12:00:00.000Z"),
    });
    const repository = createTransactionsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(transactionId)).resolves.toBe(true);
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: transactionId },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});

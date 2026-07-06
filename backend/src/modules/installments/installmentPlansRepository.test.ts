import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { createInstallmentPlansRepository } from "./installmentPlansRepository";

const planId = "00000000-0000-4000-8000-000000001001";
const accountId = "00000000-0000-4000-8000-000000000001";
const categoryId = "00000000-0000-4000-8000-000000000101";
const subcategoryId = "00000000-0000-4000-8000-000000000201";

const basePlan = {
  id: planId,
  title: "Phone",
  description: "New phone",
  totalAmount: new Prisma.Decimal("1200.00"),
  currency: "USD" as const,
  installmentsCount: 12,
  installmentAmount: new Prisma.Decimal("100.00"),
  startMonth: new Date("2026-06-01T00:00:00.000Z"),
  paidInstallmentsCount: 2,
  categoryId,
  subcategoryId,
  createdAt: new Date("2026-06-02T10:00:00.000Z"),
  updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  deletedAt: null,
};

const createTransactionClientMock = () => ({
  account: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  installmentPlan: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  transaction: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
});

const createPrismaMock = () => {
  const tx = createTransactionClientMock();

  return {
    tx,
    prisma: {
      account: {
        findFirst: vi.fn(),
      },
      category: {
        findFirst: vi.fn(),
      },
      subcategory: {
        findFirst: vi.fn(),
      },
      installmentPlan: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx)),
    },
  };
};

describe("createInstallmentPlansRepository", () => {
  it("lists active plans with canonical Decimal and month serialization", async () => {
    const { prisma } = createPrismaMock();
    prisma.installmentPlan.findMany.mockResolvedValue([basePlan]);
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActive()).resolves.toEqual([{
      id: planId,
      title: "Phone",
      description: "New phone",
      totalAmount: "1200.00",
      currency: "USD",
      installmentsCount: 12,
      installmentAmount: "100.00",
      startMonth: "2026-06",
      paidInstallmentsCount: 2,
      categoryId,
      subcategoryId,
      createdAt: "2026-06-02T10:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
      deletedAt: null,
    }]);
    expect(prisma.installmentPlan.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ startMonth: "desc" }, { createdAt: "desc" }],
    });
  });

  it("creates plans and materializes paid installment transactions transactionally", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    prisma.subcategory.findFirst.mockResolvedValue({ id: subcategoryId, categoryId });
    tx.installmentPlan.create.mockResolvedValue(basePlan);
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      title: " Phone ",
      description: " New phone ",
      totalAmount: "1200.00",
      installmentsCount: 12,
      startMonth: "2026-06",
      paidInstallmentsCount: 2,
      categoryId,
      subcategoryId,
      generatedTransactionAccountId: accountId,
    })).resolves.toMatchObject({
      title: "Phone",
      installmentAmount: "100.00",
      paidInstallmentsCount: 2,
    });
    expect(tx.installmentPlan.create).toHaveBeenCalledWith({
      data: {
        title: "Phone",
        description: "New phone",
        totalAmount: new Prisma.Decimal("1200.00"),
        currency: "USD",
        installmentsCount: 12,
        installmentAmount: new Prisma.Decimal("100.00"),
        startMonth: new Date("2026-06-01T00:00:00.000Z"),
        paidInstallmentsCount: 2,
        categoryId,
        subcategoryId,
      },
    });
    expect(tx.transaction.deleteMany).toHaveBeenCalledWith({ where: { installmentPlanId: planId } });
    expect(tx.transaction.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          accountId,
          installmentPlanId: planId,
          amount: new Prisma.Decimal("-100.00"),
          date: new Date("2026-06-01T00:00:00.000Z"),
          cuotaInstallmentIndex: 1,
          cuotaInstallmentsCount: 12,
        }),
        expect.objectContaining({
          accountId,
          installmentPlanId: planId,
          amount: new Prisma.Decimal("-100.00"),
          date: new Date("2026-07-01T00:00:00.000Z"),
          cuotaInstallmentIndex: 2,
          cuotaInstallmentsCount: 12,
        }),
      ],
    });
  });

  it("rejects generated transactions when the account is missing or deleted", async () => {
    const { prisma } = createPrismaMock();
    prisma.account.findFirst.mockResolvedValue(null);
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      title: "Phone",
      totalAmount: "1200.00",
      installmentsCount: 12,
      startMonth: "2026-06",
      paidInstallmentsCount: 1,
      generatedTransactionAccountId: accountId,
    })).rejects.toMatchObject({ code: "MISSING_ACCOUNT" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updates plans and replaces generated transactions when an account is provided", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.installmentPlan.findFirst.mockResolvedValue(basePlan);
    prisma.account.findFirst.mockResolvedValue({ id: accountId });
    prisma.subcategory.findFirst.mockResolvedValue({ id: subcategoryId, categoryId });
    tx.installmentPlan.update.mockResolvedValue({
      ...basePlan,
      paidInstallmentsCount: 3,
      updatedAt: new Date("2026-06-02T11:00:00.000Z"),
    });
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(planId, {
      paidInstallmentsCount: 3,
      generatedTransactionAccountId: accountId,
    })).resolves.toMatchObject({
      paidInstallmentsCount: 3,
      updatedAt: "2026-06-02T11:00:00.000Z",
    });
    expect(tx.transaction.deleteMany).toHaveBeenCalledWith({ where: { installmentPlanId: planId } });
    expect(tx.transaction.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ cuotaInstallmentIndex: 1 }),
        expect.objectContaining({ cuotaInstallmentIndex: 2 }),
        expect.objectContaining({ cuotaInstallmentIndex: 3 }),
      ]),
    });
  });

  it("marks the next due installment paid and creates the generated ledger transaction transactionally", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.installmentPlan.findFirst
      .mockResolvedValueOnce({
        ...basePlan,
        paidInstallmentsCount: 1,
      })
      .mockResolvedValueOnce({
        ...basePlan,
        paidInstallmentsCount: 2,
        updatedAt: new Date("2026-07-15T12:00:00.000Z"),
      });
    tx.account.findFirst.mockResolvedValue({ id: accountId });
    tx.transaction.createMany.mockResolvedValue({ count: 1 });
    tx.installmentPlan.updateMany.mockResolvedValue({ count: 1 });
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.markNextDuePaid(planId, new Date("2026-07-15T12:00:00.000Z"))).resolves.toMatchObject({
      status: "paid",
      installmentIndex: 2,
      dueDate: "2026-07-01",
      plan: { paidInstallmentsCount: 2 },
      effects: [{ planId, installmentIndex: 2, status: "created" }],
    });
    expect(tx.installmentPlan.updateMany).toHaveBeenCalledWith({
      where: { id: planId, deletedAt: null, paidInstallmentsCount: { lt: 2 } },
      data: { paidInstallmentsCount: 2 },
    });
    expect(tx.transaction.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        accountId,
        installmentPlanId: planId,
        amount: new Prisma.Decimal("-100.00"),
        date: new Date("2026-07-01T00:00:00.000Z"),
        cuotaInstallmentIndex: 2,
      })],
      skipDuplicates: true,
    });
  });

  it("treats duplicate installment ledger inserts as already existing", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.installmentPlan.findFirst
      .mockResolvedValueOnce({ ...basePlan, paidInstallmentsCount: 1 })
      .mockResolvedValueOnce({ ...basePlan, paidInstallmentsCount: 2 });
    tx.account.findFirst.mockResolvedValue({ id: accountId });
    tx.transaction.createMany.mockResolvedValue({ count: 0 });
    tx.installmentPlan.updateMany.mockResolvedValue({ count: 0 });
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.markNextDuePaid(planId, new Date("2026-07-15T12:00:00.000Z"))).resolves.toMatchObject({
      status: "paid",
      installmentIndex: 2,
      plan: { paidInstallmentsCount: 2 },
      effects: [{ planId, installmentIndex: 2, status: "already_exists" }],
    });
  });

  it("returns a blocked future state without ledger writes", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.installmentPlan.findFirst.mockResolvedValue({
      ...basePlan,
      startMonth: new Date("2026-08-01T00:00:00.000Z"),
      paidInstallmentsCount: 0,
    });
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.markNextDuePaid(planId, new Date("2026-07-15T12:00:00.000Z"))).resolves.toMatchObject({
      status: "blocked_future",
      installmentIndex: 1,
      dueDate: "2026-08-01",
      effects: [],
    });
    expect(tx.account.findFirst).not.toHaveBeenCalled();
    expect(tx.transaction.createMany).not.toHaveBeenCalled();
    expect(tx.installmentPlan.updateMany).not.toHaveBeenCalled();
  });

  it("reconciles elapsed installments without duplicating existing generated transactions", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.installmentPlan.findMany.mockResolvedValue([{
      ...basePlan,
      installmentsCount: 4,
      paidInstallmentsCount: 1,
      startMonth: new Date("2026-06-01T00:00:00.000Z"),
    }]);
    tx.account.findFirst.mockResolvedValue({ id: accountId });
    tx.transaction.createMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    tx.installmentPlan.updateMany.mockResolvedValue({ count: 1 });
    tx.installmentPlan.findFirst.mockResolvedValue({
      ...basePlan,
      installmentsCount: 4,
      paidInstallmentsCount: 3,
      startMonth: new Date("2026-06-01T00:00:00.000Z"),
    });
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.reconcileDue(new Date("2026-08-20T12:00:00.000Z"))).resolves.toMatchObject([{
      fromPaidInstallmentsCount: 1,
      toPaidInstallmentsCount: 3,
      effects: [
        { installmentIndex: 1, status: "already_exists" },
        { installmentIndex: 2, status: "created" },
        { installmentIndex: 3, status: "created" },
      ],
    }]);
    expect(tx.transaction.createMany).toHaveBeenCalledTimes(3);
    expect(tx.installmentPlan.updateMany).toHaveBeenCalledWith({
      where: { id: planId, deletedAt: null, paidInstallmentsCount: { lt: 3 } },
      data: { paidInstallmentsCount: 3 },
    });
  });

  it("soft deletes generated transactions when deleting active plans", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.installmentPlan.findFirst.mockResolvedValue({ id: planId });
    tx.installmentPlan.update.mockResolvedValue({
      ...basePlan,
      deletedAt: new Date("2026-06-02T12:00:00.000Z"),
    });
    const repository = createInstallmentPlansRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(planId)).resolves.toBe(true);
    expect(tx.installmentPlan.update).toHaveBeenCalledWith({
      where: { id: planId },
      data: { deletedAt: expect.any(Date) as Date },
    });
    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: { installmentPlanId: planId, deletedAt: null },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});

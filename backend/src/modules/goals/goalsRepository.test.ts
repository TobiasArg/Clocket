import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { GoalsRepositoryError, createGoalsRepository } from "./goalsRepository";

const goalId = "00000000-0000-4000-8000-000000000901";
const categoryId = "00000000-0000-4000-8000-000000000101";
const subcategoryId = "00000000-0000-4000-8000-000000000201";

const baseGoal = {
  id: goalId,
  title: "Trip",
  description: "Summer trip",
  targetAmount: new Prisma.Decimal("1200.00"),
  currency: "USD" as const,
  deadlineDate: new Date("2026-12-31T00:00:00.000Z"),
  icon: "airplane-tilt",
  colorKey: "SKY" as const,
  categoryId,
  subcategoryId,
  createdAt: new Date("2026-06-02T10:00:00.000Z"),
  updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  deletedAt: null,
};

const createTransactionClientMock = () => ({
  account: {
    findFirst: vi.fn(),
  },
  category: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  subcategory: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  goal: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  transaction: {
    count: vi.fn(),
    updateMany: vi.fn(),
  },
});

const createPrismaMock = () => {
  const tx = createTransactionClientMock();

  return {
    tx,
    prisma: {
      category: {
        findFirst: vi.fn(),
      },
      subcategory: {
        findFirst: vi.fn(),
      },
      goal: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx)),
    },
  };
};

describe("createGoalsRepository", () => {
  it("lists active goals with canonical Decimal and date serialization", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findMany.mockResolvedValue([baseGoal]);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActive()).resolves.toEqual([{
      id: goalId,
      title: "Trip",
      description: "Summer trip",
      targetAmount: "1200.00",
      currency: "USD",
      deadlineDate: "2026-12-31",
      icon: "airplane-tilt",
      colorKey: "sky",
      categoryId,
      subcategoryId,
      createdAt: "2026-06-02T10:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
      deletedAt: null,
    }]);
    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: [{ deadlineDate: "asc" }, { createdAt: "asc" }],
    });
  });

  it("lists active goals with backend-owned saved amount and progress", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findMany.mockResolvedValue([baseGoal, {
      ...baseGoal,
      id: "00000000-0000-4000-8000-000000000902",
      title: "House",
      targetAmount: new Prisma.Decimal("800.00"),
    }]);
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000301",
        accountId: "00000000-0000-4000-8000-000000000401",
        categoryId,
        subcategoryId,
        goalId,
        installmentPlanId: null,
        transactionType: "SAVING" as const,
        name: "Trip deposit",
        amount: new Prisma.Decimal("-300.00"),
        currency: "USD" as const,
        date: new Date("2026-06-12T00:00:00.000Z"),
        notes: "First deposit",
        uiIcon: "airplane-tilt",
        uiIconBg: "bg-sky-500",
        cuotaInstallmentIndex: null,
        cuotaInstallmentsCount: null,
        createdAt: new Date("2026-06-12T10:00:00.000Z"),
        updatedAt: new Date("2026-06-12T10:00:00.000Z"),
        deletedAt: null,
      },
      {
        id: "00000000-0000-4000-8000-000000000302",
        accountId: "00000000-0000-4000-8000-000000000401",
        categoryId,
        subcategoryId,
        goalId,
        installmentPlanId: null,
        transactionType: "SAVING" as const,
        name: "Refund",
        amount: new Prisma.Decimal("50.00"),
        currency: "USD" as const,
        date: new Date("2026-06-13T00:00:00.000Z"),
        notes: null,
        uiIcon: null,
        uiIconBg: null,
        cuotaInstallmentIndex: null,
        cuotaInstallmentsCount: null,
        createdAt: new Date("2026-06-13T10:00:00.000Z"),
        updatedAt: new Date("2026-06-13T10:00:00.000Z"),
        deletedAt: null,
      },
    ]);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActiveWithProgress()).resolves.toMatchObject({
      goals: [
        { id: goalId, savedAmount: "300.00", progressPercent: 25, entryCount: 2 },
        { id: "00000000-0000-4000-8000-000000000902", savedAmount: "0.00", progressPercent: 0, entryCount: 0 },
      ],
      summary: { totalSaved: "300.00", totalTarget: "2000.00", progressPercent: 15 },
    });
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        goalId: { in: [goalId, "00000000-0000-4000-8000-000000000902"] },
        deletedAt: null,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
  });

  it("converts mixed goal targets and entries to the requested display currency", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findMany.mockResolvedValue([baseGoal]);
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000301",
        accountId: "00000000-0000-4000-8000-000000000401",
        categoryId,
        subcategoryId,
        goalId,
        installmentPlanId: null,
        transactionType: "SAVING" as const,
        name: "Trip deposit",
        amount: new Prisma.Decimal("-150000.00"),
        currency: "ARS" as const,
        date: new Date("2026-06-12T00:00:00.000Z"),
        notes: null,
        uiIcon: null,
        uiIconBg: null,
        cuotaInstallmentIndex: null,
        cuotaInstallmentsCount: null,
        createdAt: new Date("2026-06-12T10:00:00.000Z"),
        updatedAt: new Date("2026-06-12T10:00:00.000Z"),
        deletedAt: null,
      },
    ]);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActiveWithProgress({
      currency: "ARS",
      exchangeRate: {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1500,
        source: "BACKEND_CONFIG",
        asOf: "2026-06-18T12:00:00.000Z",
        isStale: false,
        isDefault: false,
        isUnavailable: false,
        fallbackReason: null,
      },
    })).resolves.toMatchObject({
      goals: [{ targetAmount: "1800000.00", currency: "ARS", savedAmount: "150000.00", progressPercent: 8 }],
      summary: { totalSaved: "150000.00", totalTarget: "1800000.00", progressPercent: 8 },
    });
  });

  it("returns goal detail progress with ordered linked entry presentation data", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue(baseGoal);
    prisma.transaction.findMany.mockResolvedValue([{
      id: "00000000-0000-4000-8000-000000000301",
      accountId: "00000000-0000-4000-8000-000000000401",
      categoryId,
      subcategoryId,
      goalId,
      installmentPlanId: null,
      transactionType: "SAVING" as const,
      name: "Trip deposit",
      amount: new Prisma.Decimal("-1200.00"),
      currency: "USD" as const,
      date: new Date("2026-06-12T00:00:00.000Z"),
      notes: "Complete",
      uiIcon: "airplane-tilt",
      uiIconBg: "bg-sky-500",
      cuotaInstallmentIndex: null,
      cuotaInstallmentsCount: null,
      createdAt: new Date("2026-06-12T10:00:00.000Z"),
      updatedAt: new Date("2026-06-12T10:00:00.000Z"),
      deletedAt: null,
    }]);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.getByIdWithProgress(goalId)).resolves.toMatchObject({
      id: goalId,
      savedAmount: "1200.00",
      progressPercent: 100,
      entryCount: 1,
      entries: [{
        id: "00000000-0000-4000-8000-000000000301",
        amount: "-1200.00",
        date: "2026-06-12",
        notes: "Complete",
        transactionType: "saving",
      }],
    });
  });

  it("creates goals transactionally and synchronizes the parent Goals category", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.category.findFirst.mockResolvedValue(null);
    tx.category.create.mockResolvedValue({ id: categoryId });
    tx.subcategory.findFirst.mockResolvedValue(null);
    tx.subcategory.create.mockResolvedValue({ id: subcategoryId });
    tx.goal.create.mockResolvedValue(baseGoal);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      title: " Trip ",
      description: " Summer trip ",
      targetAmount: "1200.00",
      deadlineDate: "2026-12-31",
      icon: " airplane-tilt ",
      colorKey: "sky",
    })).resolves.toMatchObject({
      title: "Trip",
      categoryId,
      subcategoryId,
      targetAmount: "1200.00",
    });
    expect(tx.category.create).toHaveBeenCalledWith({
      data: {
        name: "Goals",
        icon: "target",
        iconBg: "bg-[#0EA5E9]",
      },
      select: { id: true },
    });
    expect(tx.subcategory.create).toHaveBeenCalledWith({
      data: {
        categoryId,
        name: "Trip",
        sortOrder: 0,
      },
      select: { id: true },
    });
    expect(tx.goal.create).toHaveBeenCalledWith({
      data: {
        title: "Trip",
        description: "Summer trip",
        targetAmount: new Prisma.Decimal("1200.00"),
        currency: "USD",
        deadlineDate: new Date("2026-12-31T00:00:00.000Z"),
        icon: "airplane-tilt",
        colorKey: "SKY",
        categoryId,
        subcategoryId,
      },
    });
  });

  it("reuses existing synced category and subcategory when creating a goal", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.category.findFirst.mockResolvedValue({ id: categoryId });
    tx.subcategory.findFirst.mockResolvedValue({ id: subcategoryId });
    tx.goal.create.mockResolvedValue(baseGoal);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      title: "Trip",
      description: "Summer trip",
      targetAmount: 1200,
      deadlineDate: "2026-12-31",
      icon: "airplane-tilt",
    })).resolves.toMatchObject({ categoryId, subcategoryId });
    expect(tx.category.create).not.toHaveBeenCalled();
    expect(tx.subcategory.create).not.toHaveBeenCalled();
  });

  it("supports explicit category references when synchronization is disabled", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.subcategory.findFirst.mockResolvedValue({ id: subcategoryId, categoryId });
    prisma.goal.create.mockResolvedValue(baseGoal);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      title: "Trip",
      description: "Summer trip",
      targetAmount: 1200,
      deadlineDate: "2026-12-31",
      icon: "airplane-tilt",
      categoryId,
      subcategoryId,
      syncGoalCategory: false,
    })).resolves.toMatchObject({ categoryId, subcategoryId });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updates goals and synchronizes category/subcategory when the title changes", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue(baseGoal);
    tx.category.findFirst.mockResolvedValue({ id: categoryId });
    tx.subcategory.findFirst.mockResolvedValue(null);
    tx.subcategory.create.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000202" });
    tx.goal.update.mockResolvedValue({
      ...baseGoal,
      title: "House",
      subcategoryId: "00000000-0000-4000-8000-000000000202",
      targetAmount: new Prisma.Decimal("5000.00"),
      updatedAt: new Date("2026-06-02T11:00:00.000Z"),
    });
    tx.transaction.updateMany.mockResolvedValue({ count: 2 });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(goalId, {
      title: " House ",
      targetAmount: "5000.00",
    })).resolves.toMatchObject({
      title: "House",
      targetAmount: "5000.00",
      subcategoryId: "00000000-0000-4000-8000-000000000202",
    });
    expect(tx.subcategory.create).toHaveBeenCalledWith({
      data: {
        categoryId,
        name: "House",
        sortOrder: 0,
      },
      select: { id: true },
    });
    expect(tx.goal.update).toHaveBeenCalledWith({
      where: { id: goalId },
      data: {
        title: "House",
        categoryId,
        subcategoryId: "00000000-0000-4000-8000-000000000202",
        targetAmount: new Prisma.Decimal("5000.00"),
      },
    });
    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: { goalId, deletedAt: null },
      data: {
        categoryId,
        subcategoryId: "00000000-0000-4000-8000-000000000202",
        transactionType: "SAVING",
        uiIcon: "airplane-tilt",
        uiIconBg: "bg-[#0EA5E9]",
      },
    });
  });

  it("resolves goal deletion by soft-deleting linked entries and source goal", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.transaction.updateMany.mockResolvedValue({ count: 3 });
    tx.goal.update.mockResolvedValue({ ...baseGoal, deletedAt: new Date("2026-06-02T12:00:00.000Z") });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.resolveDeletion(goalId, { mode: "delete_entries" })).resolves.toEqual({
      deleted: true,
      mode: "delete_entries",
      resolvedEntriesCount: 3,
    });
    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: { goalId, deletedAt: null },
      data: { deletedAt: expect.any(Date) as Date },
    });
    expect(tx.goal.update).toHaveBeenCalledWith({
      where: { id: goalId },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });

  it("resolves goal deletion by redirecting linked entries to another goal", async () => {
    const { prisma, tx } = createPrismaMock();
    const targetGoalId = "00000000-0000-4000-8000-000000000902";
    prisma.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.goal.findFirst
      .mockResolvedValueOnce({ id: goalId })
      .mockResolvedValueOnce({ ...baseGoal, id: targetGoalId, colorKey: "ROSE" as const });
    tx.transaction.updateMany.mockResolvedValueOnce({ count: 2 }).mockResolvedValueOnce({ count: 2 });
    tx.goal.update.mockResolvedValue({ ...baseGoal, deletedAt: new Date("2026-06-02T12:00:00.000Z") });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.resolveDeletion(goalId, { mode: "redirect_goal", targetGoalId })).resolves.toEqual({
      deleted: true,
      mode: "redirect_goal",
      resolvedEntriesCount: 2,
    });
    expect(tx.transaction.updateMany).toHaveBeenNthCalledWith(1, {
      where: { goalId, deletedAt: null },
      data: {
        categoryId,
        subcategoryId,
        transactionType: "SAVING",
        uiIcon: "airplane-tilt",
        uiIconBg: "bg-[#E11D48]",
      },
    });
    expect(tx.transaction.updateMany).toHaveBeenNthCalledWith(2, {
      where: { goalId, deletedAt: null },
      data: { goalId: targetGoalId },
    });
  });

  it("resolves goal deletion by redirecting linked entries to an account with fallback category", async () => {
    const { prisma, tx } = createPrismaMock();
    const accountId = "00000000-0000-4000-8000-000000000401";
    const fallbackCategoryId = "00000000-0000-4000-8000-000000000777";
    prisma.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.account.findFirst.mockResolvedValue({ id: accountId });
    tx.category.findFirst.mockResolvedValue(null);
    tx.category.create.mockResolvedValue({ id: fallbackCategoryId });
    tx.transaction.updateMany.mockResolvedValue({ count: 2 });
    tx.goal.update.mockResolvedValue({ ...baseGoal, deletedAt: new Date("2026-06-02T12:00:00.000Z") });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.resolveDeletion(goalId, { mode: "redirect_account", targetAccountId: accountId })).resolves.toEqual({
      deleted: true,
      mode: "redirect_account",
      resolvedEntriesCount: 2,
    });
    expect(tx.category.create).toHaveBeenCalledWith({
      data: { name: "Sin categoría", icon: "tag", iconBg: "bg-[#71717A]" },
      select: { id: true },
    });
    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: { goalId, deletedAt: null },
      data: {
        accountId,
        categoryId: fallbackCategoryId,
        subcategoryId: null,
        goalId: null,
        transactionType: "REGULAR",
        uiIcon: "tag",
        uiIconBg: "bg-[#71717A]",
      },
    });
  });

  it("rejects invalid redirect targets", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.goal.findFirst.mockResolvedValueOnce({ id: goalId }).mockResolvedValueOnce(null);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.resolveDeletion(goalId, {
      mode: "redirect_goal",
      targetGoalId: "00000000-0000-4000-8000-000000000999",
    })).rejects.toMatchObject({ code: "MISSING_GOAL" });
  });

  it("returns null when updating a missing or soft-deleted goal", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue(null);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(goalId, { title: "Updated" })).resolves.toBeNull();
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it("soft deletes active goals", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.transaction.count.mockResolvedValue(0);
    tx.goal.update.mockResolvedValue({
      ...baseGoal,
      deletedAt: new Date("2026-06-02T12:00:00.000Z"),
    });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(goalId)).resolves.toBe(true);
    expect(tx.transaction.count).toHaveBeenCalledWith({
      where: { goalId, deletedAt: null },
    });
    expect(tx.goal.update).toHaveBeenCalledWith({
      where: { id: goalId },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });

  it("rejects direct goal deletion when active linked entries exist", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.goal.findFirst.mockResolvedValue({ id: goalId });
    tx.transaction.count.mockResolvedValue(1);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(goalId)).rejects.toMatchObject({ code: "GOAL_IN_USE" });
    expect(tx.goal.update).not.toHaveBeenCalled();
  });

  it("rejects bulk goal deletion when active linked entries exist", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.goal.findMany.mockResolvedValue([{ id: goalId }]);
    tx.transaction.count.mockResolvedValue(1);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDeleteAll()).rejects.toBeInstanceOf(GoalsRepositoryError);
    await expect(repository.softDeleteAll()).rejects.toMatchObject({ code: "GOAL_IN_USE" });
    expect(tx.goal.updateMany).not.toHaveBeenCalled();
  });

  it("bulk soft deletes active goals when no linked entries exist", async () => {
    const { prisma, tx } = createPrismaMock();
    tx.goal.findMany.mockResolvedValue([{ id: goalId }]);
    tx.transaction.count.mockResolvedValue(0);
    tx.goal.updateMany.mockResolvedValue({ count: 1 });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDeleteAll()).resolves.toBe(1);
    expect(tx.transaction.count).toHaveBeenCalledWith({
      where: { goalId: { in: [goalId] }, deletedAt: null },
    });
    expect(tx.goal.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});

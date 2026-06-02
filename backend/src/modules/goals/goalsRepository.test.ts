import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { createGoalsRepository } from "./goalsRepository";

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
  category: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  subcategory: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  goal: {
    create: vi.fn(),
    update: vi.fn(),
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
  });

  it("returns null when updating a missing or soft-deleted goal", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue(null);
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(goalId, { title: "Updated" })).resolves.toBeNull();
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it("soft deletes active goals", async () => {
    const { prisma } = createPrismaMock();
    prisma.goal.findFirst.mockResolvedValue({ id: goalId });
    prisma.goal.update.mockResolvedValue({
      ...baseGoal,
      deletedAt: new Date("2026-06-02T12:00:00.000Z"),
    });
    const repository = createGoalsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(goalId)).resolves.toBe(true);
    expect(prisma.goal.update).toHaveBeenCalledWith({
      where: { id: goalId },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});

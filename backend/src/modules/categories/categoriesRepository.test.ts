import { describe, expect, it, vi } from "vitest";
import { type PrismaClient } from "../../generated/prisma/client";
import { createCategoriesRepository } from "./categoriesRepository";

const categoryId = "00000000-0000-4000-8000-000000000101";

const baseSubcategory = {
  id: "00000000-0000-4000-8000-000000000201",
  categoryId,
  name: "Groceries",
  sortOrder: 0,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-01T10:00:00.000Z"),
};

const baseCategory = {
  id: categoryId,
  name: "Food",
  icon: "utensils",
  iconBg: "bg-emerald-500",
  incomeEligible: false,
  expenseEligible: true,
  savingEligible: true,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  updatedAt: new Date("2026-06-01T10:00:00.000Z"),
  deletedAt: null,
  subcategories: [baseSubcategory],
};

const createTransactionClientMock = () => ({
  category: {
    findUnique: vi.fn(),
  },
  subcategory: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  transaction: { count: vi.fn().mockResolvedValue(0) },
  budgetScopeSubcategory: { count: vi.fn().mockResolvedValue(0) },
  goal: { count: vi.fn().mockResolvedValue(0) },
  installmentPlan: { count: vi.fn().mockResolvedValue(0) },
});

const createPrismaMock = () => {
  const tx = createTransactionClientMock();

  return {
    tx,
    prisma: {
      category: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      subcategory: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      transaction: { count: vi.fn().mockResolvedValue(0) },
      budget: { count: vi.fn().mockResolvedValue(0) },
      goal: { count: vi.fn().mockResolvedValue(0) },
      installmentPlan: { count: vi.fn().mockResolvedValue(0) },
      $transaction: vi.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx)),
    },
  };
};

describe("createCategoriesRepository", () => {
  it("lists active categories with ordered subcategories", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findMany.mockResolvedValue([baseCategory]);
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActive()).resolves.toEqual([{
      id: categoryId,
      name: "Food",
      icon: "utensils",
      iconBg: "bg-emerald-500",
      incomeEligible: false,
      expenseEligible: true,
      savingEligible: true,
      createdAt: "2026-06-01T10:00:00.000Z",
      updatedAt: "2026-06-01T10:00:00.000Z",
      deletedAt: null,
      subcategories: [{
        id: baseSubcategory.id,
        categoryId,
        name: "Groceries",
        sortOrder: 0,
        createdAt: "2026-06-01T10:00:00.000Z",
        updatedAt: "2026-06-01T10:00:00.000Z",
      }],
    }]);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: {
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });
  });

  it("creates categories with trimmed metadata and deterministic subcategory order", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.create.mockResolvedValue({
      ...baseCategory,
      subcategories: [
        baseSubcategory,
        {
          ...baseSubcategory,
          id: "00000000-0000-4000-8000-000000000202",
          name: "Restaurants",
          sortOrder: 1,
        },
      ],
    });
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: " Food ",
      icon: " utensils ",
      iconBg: " bg-emerald-500 ",
      subcategories: [" Groceries ", { name: "Restaurants" }, "   "],
    })).resolves.toMatchObject({
      name: "Food",
      icon: "utensils",
      iconBg: "bg-emerald-500",
      subcategories: [
        { name: "Groceries", sortOrder: 0 },
        { name: "Restaurants", sortOrder: 1 },
      ],
    });
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        name: "Food",
        icon: "utensils",
        iconBg: "bg-emerald-500",
        incomeEligible: false,
        expenseEligible: true,
        savingEligible: true,
        subcategories: {
          create: [
            { name: "Groceries", sortOrder: 0 },
            { name: "Restaurants", sortOrder: 1 },
          ],
        },
      },
      include: {
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  });

  it("updates active category metadata", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.category.update.mockResolvedValue({
      ...baseCategory,
      name: "Daily Food",
      iconBg: "bg-sky-500",
      updatedAt: new Date("2026-06-01T11:00:00.000Z"),
    });
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(categoryId, {
      name: " Daily Food ",
      iconBg: " bg-sky-500 ",
    })).resolves.toMatchObject({
      name: "Daily Food",
      iconBg: "bg-sky-500",
      updatedAt: "2026-06-01T11:00:00.000Z",
    });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: categoryId },
      data: {
        name: "Daily Food",
        iconBg: "bg-sky-500",
      },
      include: {
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  });

  it("rejects duplicate category names using normalized comparison", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findMany.mockResolvedValue([{ id: categoryId, name: "Comida" }]);
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: " comida ",
      icon: "utensils",
      iconBg: "bg-emerald-500",
    })).rejects.toMatchObject({ code: "DUPLICATE_CATEGORY" });
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate subcategory names using normalized comparison", async () => {
    const { prisma } = createPrismaMock();
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: "Food",
      icon: "utensils",
      iconBg: "bg-emerald-500",
      subcategories: [" Café ", "cafe"],
    })).rejects.toMatchObject({ code: "DUPLICATE_SUBCATEGORY" });
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it("returns null when updating subcategories for a missing or deleted category", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue(null);
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.replaceSubcategories(categoryId, ["Groceries"])).resolves.toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("replaces subcategories inside a transaction while preserving unchanged IDs", async () => {
    const { prisma, tx } = createPrismaMock();
    const newSubcategory = {
      ...baseSubcategory,
      id: "00000000-0000-4000-8000-000000000203",
      name: "Coffee",
      sortOrder: 1,
    };
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    tx.subcategory.findMany.mockResolvedValue([{ id: baseSubcategory.id, name: "Groceries" }]);
    tx.category.findUnique.mockResolvedValue({
      ...baseCategory,
      subcategories: [baseSubcategory, newSubcategory],
    });
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.replaceSubcategories(categoryId, [
      " Groceries ",
      "Coffee",
    ])).resolves.toMatchObject({
      subcategories: [
        { id: baseSubcategory.id, name: "Groceries", sortOrder: 0 },
        { id: newSubcategory.id, name: "Coffee", sortOrder: 1 },
      ],
    });
    expect(tx.subcategory.deleteMany).toHaveBeenCalledWith({
      where: {
        categoryId,
        name: { notIn: ["Groceries", "Coffee"] },
      },
    });
    expect(tx.subcategory.update).toHaveBeenCalledWith({
      where: { id: baseSubcategory.id },
      data: { sortOrder: 0 },
    });
    expect(tx.subcategory.create).toHaveBeenCalledWith({
      data: {
        categoryId,
        name: "Coffee",
        sortOrder: 1,
      },
    });
    expect(tx.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId },
      include: {
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  });

  it("soft deletes active categories so active lists can exclude them", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.category.update.mockResolvedValue({
      ...baseCategory,
      deletedAt: new Date("2026-06-01T12:00:00.000Z"),
    });
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(categoryId)).resolves.toBe(true);
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: categoryId },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });

  it("rejects deleting categories referenced by transactions", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.transaction.count.mockResolvedValue(1);
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(categoryId)).rejects.toMatchObject({ code: "CATEGORY_IN_USE" });
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it("rejects removing subcategories referenced by transactions", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    tx.subcategory.findMany.mockResolvedValue([{ id: baseSubcategory.id, name: "Groceries" }]);
    tx.transaction.count.mockResolvedValue(1);
    const repository = createCategoriesRepository(prisma as unknown as PrismaClient);

    await expect(repository.replaceSubcategories(categoryId, ["Restaurants"])).rejects.toMatchObject({
      code: "SUBCATEGORY_IN_USE",
    });
    expect(tx.subcategory.deleteMany).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../../generated/prisma/client";
import { createBudgetsRepository } from "./budgetsRepository";

const budgetId = "00000000-0000-4000-8000-000000000601";
const categoryId = "00000000-0000-4000-8000-000000000101";
const otherCategoryId = "00000000-0000-4000-8000-000000000102";
const subcategoryId = "00000000-0000-4000-8000-000000000201";
const otherSubcategoryId = "00000000-0000-4000-8000-000000000202";
const scopeRuleId = "00000000-0000-4000-8000-000000000701";

const baseScopeRule = {
  id: scopeRuleId,
  budgetId,
  categoryId,
  mode: "SELECTED_SUBCATEGORIES" as const,
  includeNoSubcategory: false,
  selectedSubcategories: [{
    id: "00000000-0000-4000-8000-000000000801",
    budgetScopeRuleId: scopeRuleId,
    subcategoryId,
  }],
};

const baseBudget = {
  id: budgetId,
  categoryId,
  name: "Food budget",
  limitAmount: new Prisma.Decimal("500.00"),
  currency: "USD" as const,
  periodMonth: new Date("2026-06-01T00:00:00.000Z"),
  createdAt: new Date("2026-06-02T10:00:00.000Z"),
  updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  deletedAt: null,
  scopeRules: [baseScopeRule],
};

const createTransactionClientMock = () => ({
  budget: {
    update: vi.fn(),
  },
  budgetScopeRule: {
    deleteMany: vi.fn(),
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
        findMany: vi.fn(),
      },
      budget: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      budgetScopeRule: {
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx)),
    },
  };
};

describe("createBudgetsRepository", () => {
  it("lists active budgets and serializes Decimal amounts and scope selections", async () => {
    const { prisma } = createPrismaMock();
    prisma.budget.findMany.mockResolvedValue([baseBudget]);
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.listActive("2026-06")).resolves.toEqual([{
      id: budgetId,
      categoryId,
      name: "Food budget",
      limitAmount: "500.00",
      currency: "USD",
      periodMonth: "2026-06",
      createdAt: "2026-06-02T10:00:00.000Z",
      updatedAt: "2026-06-02T10:00:00.000Z",
      deletedAt: null,
      scopeRules: [{
        id: scopeRuleId,
        categoryId,
        mode: "selected_subcategories",
        selectedSubcategoryIds: [subcategoryId],
        includeNoSubcategory: false,
      }],
    }]);
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        periodMonth: new Date("2026-06-01T00:00:00.000Z"),
      },
      include: {
        scopeRules: {
          include: {
            selectedSubcategories: {
              orderBy: [{ subcategoryId: "asc" }],
            },
          },
          orderBy: [{ categoryId: "asc" }],
        },
      },
      orderBy: [{ periodMonth: "desc" }, { createdAt: "desc" }],
    });
  });

  it("creates all-subcategory budgets without selected subcategory rows", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.budget.findMany.mockResolvedValue([]);
    prisma.budget.create.mockResolvedValue({
      ...baseBudget,
      scopeRules: [{
        ...baseScopeRule,
        mode: "ALL_SUBCATEGORIES" as const,
        selectedSubcategories: [],
      }],
    });
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: " Food budget ",
      limitAmount: "500.00",
      periodMonth: "2026-06",
      scopeRules: [{ categoryId: ` ${categoryId} `, mode: "all_subcategories" }],
    })).resolves.toMatchObject({
      categoryId,
      limitAmount: "500.00",
      scopeRules: [{ mode: "all_subcategories", selectedSubcategoryIds: [] }],
    });
    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: {
        categoryId,
        name: "Food budget",
        limitAmount: new Prisma.Decimal("500.00"),
        currency: "USD",
        periodMonth: new Date("2026-06-01T00:00:00.000Z"),
        scopeRules: {
          create: [{
            categoryId,
            mode: "ALL_SUBCATEGORIES",
            includeNoSubcategory: false,
          }],
        },
      },
      include: {
        scopeRules: {
          include: {
            selectedSubcategories: {
              orderBy: [{ subcategoryId: "asc" }],
            },
          },
          orderBy: [{ categoryId: "asc" }],
        },
      },
    });
  });

  it("creates selected-subcategory budgets with validated relational selections", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.subcategory.findMany.mockResolvedValue([
      { id: subcategoryId },
      { id: otherSubcategoryId },
    ]);
    prisma.budget.findMany.mockResolvedValue([]);
    prisma.budget.create.mockResolvedValue({
      ...baseBudget,
      scopeRules: [{
        ...baseScopeRule,
        selectedSubcategories: [
          baseScopeRule.selectedSubcategories[0],
          {
            id: "00000000-0000-4000-8000-000000000802",
            budgetScopeRuleId: scopeRuleId,
            subcategoryId: otherSubcategoryId,
          },
        ],
      }],
    });
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: "Food budget",
      limitAmount: 500,
      periodMonth: "2026-06",
      scopeRules: [{
        categoryId,
        mode: "selected_subcategories",
        selectedSubcategoryIds: [subcategoryId, otherSubcategoryId, subcategoryId],
      }],
    })).resolves.toMatchObject({
      scopeRules: [{
        mode: "selected_subcategories",
        selectedSubcategoryIds: [subcategoryId, otherSubcategoryId],
      }],
    });
    expect(prisma.subcategory.findMany).toHaveBeenCalledWith({
      where: {
        categoryId,
        id: { in: [subcategoryId, otherSubcategoryId] },
        category: { deletedAt: null },
      },
      select: { id: true },
    });
    expect(prisma.budget.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        scopeRules: {
          create: [{
            categoryId,
            mode: "SELECTED_SUBCATEGORIES",
            includeNoSubcategory: false,
            selectedSubcategories: {
              create: [{ subcategoryId }, { subcategoryId: otherSubcategoryId }],
            },
          }],
        },
      }),
    }));
  });

  it("creates selected-subcategory budgets that include no-subcategory transactions", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.subcategory.findMany.mockResolvedValue([]);
    prisma.budget.findMany.mockResolvedValue([]);
    prisma.budget.create.mockResolvedValue({
      ...baseBudget,
      scopeRules: [{
        ...baseScopeRule,
        includeNoSubcategory: true,
        selectedSubcategories: [],
      }],
    });
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: "Food budget",
      limitAmount: 500,
      periodMonth: "2026-06",
      scopeRules: [{
        categoryId,
        mode: "selected_subcategories",
        selectedSubcategoryNames: ["__none__"],
      }],
    })).resolves.toMatchObject({
      scopeRules: [{
        mode: "selected_subcategories",
        selectedSubcategoryIds: [],
        includeNoSubcategory: true,
      }],
    });
    expect(prisma.budget.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        scopeRules: {
          create: [{
            categoryId,
            mode: "SELECTED_SUBCATEGORIES",
            includeNoSubcategory: true,
            selectedSubcategories: { create: [] },
          }],
        },
      }),
    }));
  });

  it("rejects an overlapping budget for the same month and category", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.subcategory.findMany.mockResolvedValue([{ id: subcategoryId }]);
    prisma.budget.findMany.mockResolvedValue([{
      ...baseBudget,
      scopeRules: [{
        ...baseScopeRule,
        mode: "ALL_SUBCATEGORIES" as const,
        selectedSubcategories: [],
      }],
    }]);
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: "Duplicate budget",
      limitAmount: "200.00",
      periodMonth: "2026-06",
      scopeRules: [{ categoryId, mode: "selected_subcategories", selectedSubcategoryIds: [subcategoryId] }],
    })).rejects.toMatchObject({
      code: "OVERLAPPING_BUDGET",
    });
    expect(prisma.budget.create).not.toHaveBeenCalled();
  });

  it("allows non-overlapping selected subcategory budgets in the same month", async () => {
    const { prisma } = createPrismaMock();
    prisma.category.findFirst.mockResolvedValue({ id: categoryId });
    prisma.subcategory.findMany.mockResolvedValue([{ id: otherSubcategoryId }]);
    prisma.budget.findMany.mockResolvedValue([baseBudget]);
    prisma.budget.create.mockResolvedValue({
      ...baseBudget,
      id: "00000000-0000-4000-8000-000000000602",
      scopeRules: [{
        ...baseScopeRule,
        selectedSubcategories: [{
          id: "00000000-0000-4000-8000-000000000803",
          budgetScopeRuleId: scopeRuleId,
          subcategoryId: otherSubcategoryId,
        }],
      }],
    });
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.create({
      name: "Restaurants budget",
      limitAmount: "150.00",
      periodMonth: "2026-06",
      scopeRules: [{
        categoryId,
        mode: "selected_subcategories",
        selectedSubcategoryIds: [otherSubcategoryId],
      }],
    })).resolves.toMatchObject({
      scopeRules: [{ selectedSubcategoryIds: [otherSubcategoryId] }],
    });
  });

  it("updates budgets transactionally and excludes itself from overlap checks", async () => {
    const { prisma, tx } = createPrismaMock();
    prisma.budget.findFirst.mockResolvedValue(baseBudget);
    prisma.category.findFirst.mockResolvedValue({ id: otherCategoryId });
    prisma.budget.findMany.mockResolvedValue([]);
    tx.budget.update.mockResolvedValue({
      ...baseBudget,
      categoryId: otherCategoryId,
      name: "Updated budget",
      limitAmount: new Prisma.Decimal("650.00"),
      scopeRules: [{
        ...baseScopeRule,
        categoryId: otherCategoryId,
        mode: "ALL_SUBCATEGORIES" as const,
        selectedSubcategories: [],
      }],
      updatedAt: new Date("2026-06-02T11:00:00.000Z"),
    });
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.update(budgetId, {
      name: " Updated budget ",
      limitAmount: "650.00",
      scopeRules: [{ categoryId: otherCategoryId, mode: "all_subcategories" }],
    })).resolves.toMatchObject({
      name: "Updated budget",
      categoryId: otherCategoryId,
      limitAmount: "650.00",
      updatedAt: "2026-06-02T11:00:00.000Z",
    });
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: {
        periodMonth: new Date("2026-06-01T00:00:00.000Z"),
        deletedAt: null,
        id: { not: budgetId },
      },
      include: expect.any(Object),
    });
    expect(tx.budgetScopeRule.deleteMany).toHaveBeenCalledWith({ where: { budgetId } });
    expect(tx.budget.update).toHaveBeenCalledWith({
      where: { id: budgetId },
      data: {
        categoryId: otherCategoryId,
        name: "Updated budget",
        limitAmount: new Prisma.Decimal("650.00"),
        periodMonth: new Date("2026-06-01T00:00:00.000Z"),
        scopeRules: {
          create: [{
            categoryId: otherCategoryId,
            mode: "ALL_SUBCATEGORIES",
            includeNoSubcategory: false,
          }],
        },
      },
      include: expect.any(Object),
    });
  });

  it("soft deletes active budgets", async () => {
    const { prisma } = createPrismaMock();
    prisma.budget.findFirst.mockResolvedValue({ id: budgetId });
    prisma.budget.update.mockResolvedValue({
      ...baseBudget,
      deletedAt: new Date("2026-06-02T12:00:00.000Z"),
    });
    const repository = createBudgetsRepository(prisma as unknown as PrismaClient);

    await expect(repository.softDelete(budgetId)).resolves.toBe(true);
    expect(prisma.budget.update).toHaveBeenCalledWith({
      where: { id: budgetId },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});

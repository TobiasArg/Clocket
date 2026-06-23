import { Prisma, type PrismaClient } from "../../generated/prisma/client";

export interface SubcategoryRecord {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  incomeEligible?: boolean;
  expenseEligible?: boolean;
  savingEligible?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  subcategories: SubcategoryRecord[];
}

export interface SubcategoryInput {
  name: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  iconBg: string;
  incomeEligible?: boolean;
  expenseEligible?: boolean;
  savingEligible?: boolean;
  subcategories?: Array<string | SubcategoryInput>;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  iconBg?: string;
  incomeEligible?: boolean;
  expenseEligible?: boolean;
  savingEligible?: boolean;
}

export type CategoryRepositoryErrorCode =
  | "DUPLICATE_CATEGORY"
  | "DUPLICATE_SUBCATEGORY"
  | "CATEGORY_IN_USE"
  | "SUBCATEGORY_IN_USE";

export class CategoryRepositoryError extends Error {
  public readonly code: CategoryRepositoryErrorCode;

  public constructor(code: CategoryRepositoryErrorCode, message: string) {
    super(message);
    this.name = "CategoryRepositoryError";
    this.code = code;
  }
}

export interface CategoriesRepository {
  listActive: () => Promise<CategoryRecord[]>;
  listTransactionEditorOptions: () => Promise<CategoryRecord[]>;
  getById: (id: string) => Promise<CategoryRecord | null>;
  create: (input: CreateCategoryInput) => Promise<CategoryRecord>;
  update: (id: string, input: UpdateCategoryInput) => Promise<CategoryRecord | null>;
  replaceSubcategories: (
    categoryId: string,
    subcategories: Array<string | SubcategoryInput>,
  ) => Promise<CategoryRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
}

const categoryWithSubcategories = {
  subcategories: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.CategoryInclude;

type CategoryWithSubcategories = Prisma.CategoryGetPayload<{
  include: typeof categoryWithSubcategories;
}>;

type SubcategoryModel = CategoryWithSubcategories["subcategories"][number];

const toIso = (value: Date): string => value.toISOString();

const normalizeName = (value: string): string => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-ES");

const normalizeSubcategoryInputs = (
  subcategories: Array<string | SubcategoryInput> | undefined,
): Array<{ name: string; sortOrder: number }> => {
  const normalized: Array<{ name: string; sortOrder: number }> = [];

  for (const subcategory of subcategories ?? []) {
    const name = (typeof subcategory === "string" ? subcategory : subcategory.name).trim();

    if (!name) {
      continue;
    }

    normalized.push({ name, sortOrder: normalized.length });
  }

  return normalized;
};

const assertNoDuplicateSubcategoryInputs = (subcategories: Array<{ name: string }>): void => {
  const seen = new Set<string>();
  for (const subcategory of subcategories) {
    const normalizedName = normalizeName(subcategory.name);
    if (seen.has(normalizedName)) {
      throw new CategoryRepositoryError("DUPLICATE_SUBCATEGORY", `Subcategory '${subcategory.name}' already exists in this category.`);
    }
    seen.add(normalizedName);
  }
};

const toSubcategoryRecord = (subcategory: SubcategoryModel): SubcategoryRecord => ({
  id: subcategory.id,
  categoryId: subcategory.categoryId,
  name: subcategory.name,
  sortOrder: subcategory.sortOrder,
  createdAt: toIso(subcategory.createdAt),
  updatedAt: toIso(subcategory.updatedAt),
});

const toCategoryRecord = (category: CategoryWithSubcategories): CategoryRecord => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
  iconBg: category.iconBg,
  incomeEligible: category.incomeEligible,
  expenseEligible: category.expenseEligible,
  savingEligible: category.savingEligible,
  createdAt: toIso(category.createdAt),
  updatedAt: toIso(category.updatedAt),
  deletedAt: category.deletedAt ? toIso(category.deletedAt) : null,
  subcategories: category.subcategories.map(toSubcategoryRecord),
});

export const createCategoriesRepository = (prisma: PrismaClient): CategoriesRepository => ({
  async listActive() {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: categoryWithSubcategories,
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });

    return categories.map(toCategoryRecord);
  },

  async listTransactionEditorOptions() {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: categoryWithSubcategories,
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });

    return categories.map(toCategoryRecord);
  },

  async getById(id) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: categoryWithSubcategories,
    });

    return category ? toCategoryRecord(category) : null;
  },

  async create(input) {
    const normalizedName = normalizeName(input.name);
    const existing = await prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });
    if (existing.some((category) => normalizeName(category.name) === normalizedName)) {
      throw new CategoryRepositoryError("DUPLICATE_CATEGORY", `Category '${input.name.trim()}' already exists.`);
    }

    const subcategories = normalizeSubcategoryInputs(input.subcategories);
    assertNoDuplicateSubcategoryInputs(subcategories);
    const category = await prisma.category.create({
      data: {
        name: input.name.trim(),
        icon: input.icon.trim(),
        iconBg: input.iconBg.trim(),
        incomeEligible: input.incomeEligible ?? false,
        expenseEligible: input.expenseEligible ?? true,
        savingEligible: input.savingEligible ?? true,
        ...(subcategories.length > 0
          ? {
              subcategories: {
                create: subcategories,
              },
            }
          : {}),
      },
      include: categoryWithSubcategories,
    });

    return toCategoryRecord(category);
  },

  async update(id, input) {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    if (input.name !== undefined) {
      const normalizedName = normalizeName(input.name);
      const existingCategories = await prisma.category.findMany({
        where: { deletedAt: null, id: { not: id } },
        select: { name: true },
      });
      if (existingCategories.some((category) => normalizeName(category.name) === normalizedName)) {
        throw new CategoryRepositoryError("DUPLICATE_CATEGORY", `Category '${input.name.trim()}' already exists.`);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
        ...(input.iconBg !== undefined ? { iconBg: input.iconBg.trim() } : {}),
        ...(input.incomeEligible !== undefined ? { incomeEligible: input.incomeEligible } : {}),
        ...(input.expenseEligible !== undefined ? { expenseEligible: input.expenseEligible } : {}),
        ...(input.savingEligible !== undefined ? { savingEligible: input.savingEligible } : {}),
      },
      include: categoryWithSubcategories,
    });

    return toCategoryRecord(category);
  },

  async replaceSubcategories(categoryId, inputSubcategories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existingCategory) {
      return null;
    }

    const subcategories = normalizeSubcategoryInputs(inputSubcategories);
    assertNoDuplicateSubcategoryInputs(subcategories);
    const desiredNormalizedNames = new Set(subcategories.map((subcategory) => normalizeName(subcategory.name)));

    const category = await prisma.$transaction(async (tx) => {
      const existingSubcategories = await tx.subcategory.findMany({
        where: { categoryId },
        select: { id: true, name: true },
      });
      for (const existing of existingSubcategories) {
        if (!desiredNormalizedNames.has(normalizeName(existing.name))) {
          const transactionCount = await tx.transaction.count({
            where: { subcategoryId: existing.id, deletedAt: null },
          });
          const budgetSelectionCount = await tx.budgetScopeSubcategory.count({
            where: { subcategoryId: existing.id },
          });
          const goalCount = await tx.goal.count({
            where: { subcategoryId: existing.id, deletedAt: null },
          });
          const installmentPlanCount = await tx.installmentPlan.count({
            where: { subcategoryId: existing.id, deletedAt: null },
          });
          if (transactionCount + budgetSelectionCount + goalCount + installmentPlanCount > 0) {
            throw new CategoryRepositoryError("SUBCATEGORY_IN_USE", `Subcategory '${existing.name}' is in use.`);
          }
        }
      }
      const existingByName = new Map(
        existingSubcategories.map((subcategory) => [subcategory.name, subcategory.id]),
      );
      const existingByNormalizedName = new Map(
        existingSubcategories.map((subcategory) => [normalizeName(subcategory.name), subcategory.id]),
      );
      const retainedExistingIds = subcategories
        .map((subcategory) => existingByName.get(subcategory.name) ?? existingByNormalizedName.get(normalizeName(subcategory.name)))
        .filter((id): id is string => Boolean(id));

      await tx.subcategory.deleteMany({
        where: {
          categoryId,
          ...(retainedExistingIds.length > 0 ? { id: { notIn: retainedExistingIds } } : {}),
        },
      });

      for (const subcategory of subcategories) {
        const existingId = existingByName.get(subcategory.name) ?? existingByNormalizedName.get(normalizeName(subcategory.name));

        if (existingId) {
          await tx.subcategory.update({
            where: { id: existingId },
            data: { name: subcategory.name, sortOrder: subcategory.sortOrder },
          });
        } else {
          await tx.subcategory.create({
            data: {
              categoryId,
              name: subcategory.name,
              sortOrder: subcategory.sortOrder,
            },
          });
        }
      }

      return tx.category.findUnique({
        where: { id: categoryId },
        include: categoryWithSubcategories,
      });
    });

    return category ? toCategoryRecord(category) : null;
  },

  async softDelete(id) {
    const existing = await prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    const [transactionCount, budgetCount, budgetScopeRuleCount, goalCount, installmentPlanCount] = await Promise.all([
      prisma.transaction.count({ where: { categoryId: id, deletedAt: null } }),
      prisma.budget.count({ where: { categoryId: id, deletedAt: null } }),
      prisma.budgetScopeRule.count({ where: { categoryId: id } }),
      prisma.goal.count({ where: { categoryId: id, deletedAt: null } }),
      prisma.installmentPlan.count({ where: { categoryId: id, deletedAt: null } }),
    ]);
    if (transactionCount + budgetCount + budgetScopeRuleCount + goalCount + installmentPlanCount > 0) {
      throw new CategoryRepositoryError("CATEGORY_IN_USE", `Category '${id}' is in use.`);
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },
});

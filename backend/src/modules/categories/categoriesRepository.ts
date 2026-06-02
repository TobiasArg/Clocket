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
  subcategories?: Array<string | SubcategoryInput>;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  iconBg?: string;
}

export interface CategoriesRepository {
  listActive: () => Promise<CategoryRecord[]>;
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

const normalizeSubcategoryInputs = (
  subcategories: Array<string | SubcategoryInput> | undefined,
): Array<{ name: string; sortOrder: number }> => {
  const seen = new Set<string>();
  const normalized: Array<{ name: string; sortOrder: number }> = [];

  for (const subcategory of subcategories ?? []) {
    const name = (typeof subcategory === "string" ? subcategory : subcategory.name).trim();

    if (!name || seen.has(name)) {
      continue;
    }

    seen.add(name);
    normalized.push({ name, sortOrder: normalized.length });
  }

  return normalized;
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
    const subcategories = normalizeSubcategoryInputs(input.subcategories);
    const category = await prisma.category.create({
      data: {
        name: input.name.trim(),
        icon: input.icon.trim(),
        iconBg: input.iconBg.trim(),
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

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
        ...(input.iconBg !== undefined ? { iconBg: input.iconBg.trim() } : {}),
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
    const desiredNames = subcategories.map((subcategory) => subcategory.name);

    const category = await prisma.$transaction(async (tx) => {
      const existingSubcategories = await tx.subcategory.findMany({
        where: { categoryId },
        select: { id: true, name: true },
      });
      const existingByName = new Map(
        existingSubcategories.map((subcategory) => [subcategory.name, subcategory.id]),
      );

      await tx.subcategory.deleteMany({
        where: {
          categoryId,
          name: { notIn: desiredNames },
        },
      });

      for (const subcategory of subcategories) {
        const existingId = existingByName.get(subcategory.name);

        if (existingId) {
          await tx.subcategory.update({
            where: { id: existingId },
            data: { sortOrder: subcategory.sortOrder },
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

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },
});

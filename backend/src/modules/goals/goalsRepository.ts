import {
  Prisma,
  type CurrencyCode,
  type GoalColorKey as PrismaGoalColorKey,
  type PrismaClient,
} from "../../generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type GoalColorKey = "emerald" | "sky" | "indigo" | "violet" | "rose" | "amber" | "cyan" | "lime";

export type GoalsRepositoryErrorCode = "MISSING_CATEGORY" | "MISSING_SUBCATEGORY";

export class GoalsRepositoryError extends Error {
  public readonly code: GoalsRepositoryErrorCode;

  public constructor(code: GoalsRepositoryErrorCode, message: string) {
    super(message);
    this.name = "GoalsRepositoryError";
    this.code = code;
  }
}

export interface GoalRecord {
  id: string;
  title: string;
  description: string;
  targetAmount: string;
  currency: CurrencyCode;
  deadlineDate: string;
  icon: string;
  colorKey: GoalColorKey;
  categoryId: string | null;
  subcategoryId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateGoalInput {
  title: string;
  description: string;
  targetAmount: DecimalInput;
  currency?: CurrencyCode;
  deadlineDate: string | Date;
  icon: string;
  colorKey?: GoalColorKey;
  categoryId?: string | null;
  subcategoryId?: string | null;
  syncGoalCategory?: boolean;
}

export type UpdateGoalInput = Partial<CreateGoalInput>;

export interface GoalsRepository {
  listActive: () => Promise<GoalRecord[]>;
  getById: (id: string) => Promise<GoalRecord | null>;
  create: (input: CreateGoalInput) => Promise<GoalRecord>;
  update: (id: string, input: UpdateGoalInput) => Promise<GoalRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
}

type GoalModel = NonNullable<Awaited<ReturnType<PrismaClient["goal"]["findUnique"]>>>;

type GoalCategorySyncClient = Pick<PrismaClient, "category" | "subcategory" | "goal">;

const GOALS_PARENT_CATEGORY_NAME = "Goals";
const GOALS_PARENT_CATEGORY_ICON = "target";
const GOALS_PARENT_CATEGORY_ICON_BG = "bg-[#0EA5E9]";

const COLOR_TO_PRISMA: Record<GoalColorKey, PrismaGoalColorKey> = {
  emerald: "EMERALD",
  sky: "SKY",
  indigo: "INDIGO",
  violet: "VIOLET",
  rose: "ROSE",
  amber: "AMBER",
  cyan: "CYAN",
  lime: "LIME",
};

const COLOR_FROM_PRISMA: Record<PrismaGoalColorKey, GoalColorKey> = {
  EMERALD: "emerald",
  SKY: "sky",
  INDIGO: "indigo",
  VIOLET: "violet",
  ROSE: "rose",
  AMBER: "amber",
  CYAN: "cyan",
  LIME: "lime",
};

const toDecimal = (value: DecimalInput): Prisma.Decimal => new Prisma.Decimal(value);

const toIso = (value: Date): string => value.toISOString();

const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

const toDbDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
};

const trimNullable = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTitle = (title: string): string => title.trim();

const toGoalRecord = (goal: GoalModel): GoalRecord => ({
  id: goal.id,
  title: goal.title,
  description: goal.description,
  targetAmount: goal.targetAmount.toFixed(2),
  currency: goal.currency,
  deadlineDate: toDateOnly(goal.deadlineDate),
  icon: goal.icon,
  colorKey: COLOR_FROM_PRISMA[goal.colorKey],
  categoryId: goal.categoryId,
  subcategoryId: goal.subcategoryId,
  createdAt: toIso(goal.createdAt),
  updatedAt: toIso(goal.updatedAt),
  deletedAt: goal.deletedAt ? toIso(goal.deletedAt) : null,
});

const assertActiveCategory = async (
  prisma: PrismaClient,
  categoryId: string | null,
): Promise<void> => {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!category) {
    throw new GoalsRepositoryError(
      "MISSING_CATEGORY",
      `Active category '${categoryId}' was not found.`,
    );
  }
};

const assertActiveSubcategory = async (
  prisma: PrismaClient,
  categoryId: string | null,
  subcategoryId: string | null,
): Promise<{ categoryId: string | null; subcategoryId: string | null }> => {
  if (!subcategoryId) {
    return { categoryId, subcategoryId: null };
  }

  const subcategory = await prisma.subcategory.findFirst({
    where: {
      id: subcategoryId,
      ...(categoryId ? { categoryId } : {}),
      category: { deletedAt: null },
    },
    select: { id: true, categoryId: true },
  });

  if (!subcategory) {
    throw new GoalsRepositoryError(
      "MISSING_SUBCATEGORY",
      `Active subcategory '${subcategoryId}' was not found.`,
    );
  }

  return { categoryId: categoryId ?? subcategory.categoryId, subcategoryId };
};

const ensureGoalsCategoryAndSubcategory = async (
  tx: GoalCategorySyncClient,
  title: string,
): Promise<{ categoryId: string; subcategoryId: string }> => {
  const normalizedTitle = normalizeTitle(title);
  let category = await tx.category.findFirst({
    where: {
      name: GOALS_PARENT_CATEGORY_NAME,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!category) {
    category = await tx.category.create({
      data: {
        name: GOALS_PARENT_CATEGORY_NAME,
        icon: GOALS_PARENT_CATEGORY_ICON,
        iconBg: GOALS_PARENT_CATEGORY_ICON_BG,
      },
      select: { id: true },
    });
  }

  let subcategory = await tx.subcategory.findFirst({
    where: {
      categoryId: category.id,
      name: normalizedTitle,
    },
    select: { id: true },
  });

  if (!subcategory) {
    subcategory = await tx.subcategory.create({
      data: {
        categoryId: category.id,
        name: normalizedTitle,
        sortOrder: 0,
      },
      select: { id: true },
    });
  }

  return {
    categoryId: category.id,
    subcategoryId: subcategory.id,
  };
};

export const createGoalsRepository = (prisma: PrismaClient): GoalsRepository => ({
  async listActive() {
    const goals = await prisma.goal.findMany({
      where: { deletedAt: null },
      orderBy: [{ deadlineDate: "asc" }, { createdAt: "asc" }],
    });

    return goals.map(toGoalRecord);
  },

  async getById(id) {
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return goal ? toGoalRecord(goal) : null;
  },

  async create(input) {
    const syncGoalCategory = input.syncGoalCategory ?? true;
    const title = normalizeTitle(input.title);

    if (!syncGoalCategory) {
      const categoryId = trimNullable(input.categoryId) ?? null;
      const initialSubcategoryId = trimNullable(input.subcategoryId) ?? null;
      await assertActiveCategory(prisma, categoryId);
      const refs = await assertActiveSubcategory(prisma, categoryId, initialSubcategoryId);
      const goal = await prisma.goal.create({
        data: {
          title,
          description: input.description.trim(),
          targetAmount: toDecimal(input.targetAmount),
          currency: input.currency ?? "USD",
          deadlineDate: toDbDate(input.deadlineDate),
          icon: input.icon.trim(),
          colorKey: COLOR_TO_PRISMA[input.colorKey ?? "emerald"],
          categoryId: refs.categoryId,
          subcategoryId: refs.subcategoryId,
        },
      });

      return toGoalRecord(goal);
    }

    const goal = await prisma.$transaction(async (tx) => {
      const refs = await ensureGoalsCategoryAndSubcategory(tx, title);

      return tx.goal.create({
        data: {
          title,
          description: input.description.trim(),
          targetAmount: toDecimal(input.targetAmount),
          currency: input.currency ?? "USD",
          deadlineDate: toDbDate(input.deadlineDate),
          icon: input.icon.trim(),
          colorKey: COLOR_TO_PRISMA[input.colorKey ?? "emerald"],
          categoryId: refs.categoryId,
          subcategoryId: refs.subcategoryId,
        },
      });
    });

    return toGoalRecord(goal);
  },

  async update(id, input) {
    const existing = await prisma.goal.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const title = input.title !== undefined ? normalizeTitle(input.title) : existing.title;
    const syncGoalCategory = input.syncGoalCategory ?? true;

    if (!syncGoalCategory) {
      const categoryId = input.categoryId !== undefined
        ? trimNullable(input.categoryId) ?? null
        : existing.categoryId;
      const initialSubcategoryId = input.subcategoryId !== undefined
        ? trimNullable(input.subcategoryId) ?? null
        : existing.subcategoryId;
      await assertActiveCategory(prisma, categoryId);
      const refs = await assertActiveSubcategory(prisma, categoryId, initialSubcategoryId);
      const goal = await prisma.goal.update({
        where: { id },
        data: {
          title,
          categoryId: refs.categoryId,
          subcategoryId: refs.subcategoryId,
          ...(input.description !== undefined ? { description: input.description.trim() } : {}),
          ...(input.targetAmount !== undefined ? { targetAmount: toDecimal(input.targetAmount) } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.deadlineDate !== undefined ? { deadlineDate: toDbDate(input.deadlineDate) } : {}),
          ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
          ...(input.colorKey !== undefined ? { colorKey: COLOR_TO_PRISMA[input.colorKey] } : {}),
        },
      });

      return toGoalRecord(goal);
    }

    const goal = await prisma.$transaction(async (tx) => {
      const refs = await ensureGoalsCategoryAndSubcategory(tx, title);

      return tx.goal.update({
        where: { id },
        data: {
          title,
          categoryId: refs.categoryId,
          subcategoryId: refs.subcategoryId,
          ...(input.description !== undefined ? { description: input.description.trim() } : {}),
          ...(input.targetAmount !== undefined ? { targetAmount: toDecimal(input.targetAmount) } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.deadlineDate !== undefined ? { deadlineDate: toDbDate(input.deadlineDate) } : {}),
          ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
          ...(input.colorKey !== undefined ? { colorKey: COLOR_TO_PRISMA[input.colorKey] } : {}),
        },
      });
    });

    return toGoalRecord(goal);
  },

  async softDelete(id) {
    const existing = await prisma.goal.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },
});

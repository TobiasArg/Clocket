import {
  Prisma,
  type CurrencyCode,
  type GoalColorKey as PrismaGoalColorKey,
  type PrismaClient,
} from "../../generated/prisma/client";
import {
  convertToDisplayCurrency,
  type MoneyConversionContext,
} from "../exchange-rates/moneyConversion";

type DecimalInput = string | number | Prisma.Decimal;

export type GoalColorKey = "emerald" | "sky" | "indigo" | "violet" | "rose" | "amber" | "cyan" | "lime";

export type GoalsRepositoryErrorCode =
  | "MISSING_ACCOUNT"
  | "MISSING_CATEGORY"
  | "MISSING_GOAL"
  | "MISSING_SUBCATEGORY"
  | "GOAL_IN_USE"
  | "INVALID_REQUEST";

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

export interface GoalEntryRecord {
  id: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  goalId: string | null;
  transactionType: "regular" | "saving";
  name: string;
  amount: string;
  currency: CurrencyCode;
  date: string;
  notes: string | null;
  uiIcon: string | null;
  uiIconBg: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgressRecord extends GoalRecord {
  savedAmount: string;
  progressPercent: number;
  entryCount: number;
}

export interface GoalDetailRecord extends GoalProgressRecord {
  entries: GoalEntryRecord[];
}

export interface GoalsProgressSummaryRecord {
  totalSaved: string;
  totalTarget: string;
  progressPercent: number;
}

export interface GoalListWithProgressRecord {
  goals: GoalProgressRecord[];
  summary: GoalsProgressSummaryRecord;
}

export type GoalDeleteResolutionMode = "delete_entries" | "redirect_goal" | "redirect_account";

export type ResolveGoalDeletionInput =
  | { mode: "delete_entries" }
  | { mode: "redirect_goal"; targetGoalId: string }
  | { mode: "redirect_account"; targetAccountId: string };

export interface ResolveGoalDeletionRecord {
  deleted: true;
  mode: GoalDeleteResolutionMode;
  resolvedEntriesCount: number;
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
  listActiveWithProgress: (conversionContext?: MoneyConversionContext | null) => Promise<GoalListWithProgressRecord>;
  getById: (id: string) => Promise<GoalRecord | null>;
  getByIdWithProgress: (id: string, conversionContext?: MoneyConversionContext | null) => Promise<GoalDetailRecord | null>;
  create: (input: CreateGoalInput) => Promise<GoalRecord>;
  update: (id: string, input: UpdateGoalInput) => Promise<GoalRecord | null>;
  resolveDeletion: (id: string, input: ResolveGoalDeletionInput) => Promise<ResolveGoalDeletionRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
  softDeleteAll: () => Promise<number>;
}

type GoalModel = NonNullable<Awaited<ReturnType<PrismaClient["goal"]["findUnique"]>>>;

type TransactionModel = NonNullable<Awaited<ReturnType<PrismaClient["transaction"]["findUnique"]>>>;

type GoalCategorySyncClient = Pick<PrismaClient, "account" | "category" | "subcategory" | "goal" | "transaction">;

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

const GOAL_COLOR_ICON_BG: Record<GoalColorKey, string> = {
  emerald: "bg-[#10B981]",
  sky: "bg-[#0EA5E9]",
  indigo: "bg-[#4F46E5]",
  violet: "bg-[#7C3AED]",
  rose: "bg-[#E11D48]",
  amber: "bg-[#F59E0B]",
  cyan: "bg-[#06B6D4]",
  lime: "bg-[#65A30D]",
};

const FALLBACK_CATEGORY_NAME = "Sin categoría";
const FALLBACK_CATEGORY_ASCII_NAME = "Sin categoria";
const FALLBACK_CATEGORY_ICON = "tag";
const FALLBACK_CATEGORY_ICON_BG = "bg-[#71717A]";

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

const TRANSACTION_TYPE_FROM_PRISMA = {
  REGULAR: "regular",
  SAVING: "saving",
} as const;

const toTransactionEntryRecord = (transaction: TransactionModel): GoalEntryRecord => ({
  id: transaction.id,
  accountId: transaction.accountId,
  categoryId: transaction.categoryId,
  subcategoryId: transaction.subcategoryId,
  goalId: transaction.goalId,
  transactionType: TRANSACTION_TYPE_FROM_PRISMA[transaction.transactionType],
  name: transaction.name,
  amount: transaction.amount.toFixed(2),
  currency: transaction.currency,
  date: toDateOnly(transaction.date),
  notes: transaction.notes,
  uiIcon: transaction.uiIcon,
  uiIconBg: transaction.uiIconBg,
  createdAt: toIso(transaction.createdAt),
  updatedAt: toIso(transaction.updatedAt),
});

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCurrencyString = (value: number): string => (Number.isFinite(value) ? value : 0).toFixed(2);
const getDisplayAmount = (
  amount: string | number,
  currency: CurrencyCode,
  conversionContext: MoneyConversionContext | null | undefined,
): number => convertToDisplayCurrency(amount, currency, conversionContext ?? null);

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const buildProgress = (
  goal: GoalRecord,
  entries: GoalEntryRecord[],
  conversionContext?: MoneyConversionContext | null,
): GoalProgressRecord => {
  const savedAmount = entries.reduce((sum, entry) => {
    const amount = getDisplayAmount(entry.amount, entry.currency, conversionContext);
    return amount < 0 ? sum + Math.abs(amount) : sum;
  }, 0);
  const targetAmount = Math.max(0, getDisplayAmount(goal.targetAmount, goal.currency, conversionContext));

  return {
    ...goal,
    ...(conversionContext ? { targetAmount: toCurrencyString(targetAmount), currency: conversionContext.currency } : {}),
    savedAmount: toCurrencyString(savedAmount),
    progressPercent: targetAmount > 0 ? clampPercent((savedAmount / targetAmount) * 100) : 0,
    entryCount: entries.length,
  };
};

const buildSummary = (goals: GoalProgressRecord[]): GoalsProgressSummaryRecord => {
  const totalSaved = goals.reduce((sum, goal) => sum + toNumber(goal.savedAmount), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Math.max(0, toNumber(goal.targetAmount)), 0);

  return {
    totalSaved: toCurrencyString(totalSaved),
    totalTarget: toCurrencyString(totalTarget),
    progressPercent: totalTarget > 0 ? clampPercent((totalSaved / totalTarget) * 100) : 0,
  };
};

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

const ensureFallbackCategory = async (tx: GoalCategorySyncClient): Promise<{ categoryId: string }> => {
  let category = await tx.category.findFirst({
    where: {
      deletedAt: null,
      OR: [{ name: FALLBACK_CATEGORY_NAME }, { name: FALLBACK_CATEGORY_ASCII_NAME }],
    },
    select: { id: true },
  });

  if (!category) {
    category = await tx.category.create({
      data: {
        name: FALLBACK_CATEGORY_NAME,
        icon: FALLBACK_CATEGORY_ICON,
        iconBg: FALLBACK_CATEGORY_ICON_BG,
      },
      select: { id: true },
    });
  }

  return { categoryId: category.id };
};

const updateLinkedEntriesForGoal = async (
  tx: GoalCategorySyncClient,
  goalId: string,
  goal: { categoryId: string | null; subcategoryId: string | null; icon: string; colorKey: PrismaGoalColorKey },
): Promise<number> => {
  const result = await tx.transaction.updateMany({
    where: {
      goalId,
      deletedAt: null,
    },
    data: {
      categoryId: goal.categoryId,
      subcategoryId: goal.subcategoryId,
      transactionType: "SAVING",
      uiIcon: goal.icon,
      uiIconBg: GOAL_COLOR_ICON_BG[COLOR_FROM_PRISMA[goal.colorKey]],
    },
  });

  return result.count;
};

export const createGoalsRepository = (prisma: PrismaClient): GoalsRepository => ({
  async listActive() {
    const goals = await prisma.goal.findMany({
      where: { deletedAt: null },
      orderBy: [{ deadlineDate: "asc" }, { createdAt: "asc" }],
    });

    return goals.map(toGoalRecord);
  },

  async listActiveWithProgress(conversionContext = null) {
    const goals = await prisma.goal.findMany({
      where: { deletedAt: null },
      orderBy: [{ deadlineDate: "asc" }, { createdAt: "asc" }],
    });
    const goalRecords = goals.map(toGoalRecord);
    const goalIds = goalRecords.map((goal) => goal.id);
    const entries = goalIds.length > 0
      ? await prisma.transaction.findMany({
          where: {
            goalId: { in: goalIds },
            deletedAt: null,
          },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        })
      : [];
    const entriesByGoalId = new Map<string, GoalEntryRecord[]>();
    entries.map(toTransactionEntryRecord).forEach((entry) => {
      if (!entry.goalId) return;
      const current = entriesByGoalId.get(entry.goalId) ?? [];
      current.push(entry);
      entriesByGoalId.set(entry.goalId, current);
    });
    const goalsWithProgress = goalRecords.map((goal) => buildProgress(goal, entriesByGoalId.get(goal.id) ?? [], conversionContext));

    return {
      goals: goalsWithProgress,
      summary: buildSummary(goalsWithProgress),
    };
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

  async getByIdWithProgress(id, conversionContext = null) {
    const goal = await prisma.goal.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!goal) {
      return null;
    }

    const goalRecord = toGoalRecord(goal);
    const entries = await prisma.transaction.findMany({
      where: {
        goalId: id,
        deletedAt: null,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    const entryRecords = entries.map(toTransactionEntryRecord);

    return {
      ...buildProgress(goalRecord, entryRecords, conversionContext),
      entries: entryRecords,
    };
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
      const goal = await prisma.$transaction(async (tx) => {
        const updated = await tx.goal.update({
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

        await updateLinkedEntriesForGoal(tx, id, updated);

        return updated;
      });

      return toGoalRecord(goal);
    }

    const goal = await prisma.$transaction(async (tx) => {
      const refs = await ensureGoalsCategoryAndSubcategory(tx, title);

      const updated = await tx.goal.update({
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

      await updateLinkedEntriesForGoal(tx, id, updated);

      return updated;
    });

    return toGoalRecord(goal);
  },

  async resolveDeletion(id, input) {
    const existing = await prisma.goal.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return prisma.$transaction(async (tx) => {
      const sourceGoal = await tx.goal.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!sourceGoal) {
        return null;
      }

      let resolvedEntriesCount = 0;

      if (input.mode === "delete_entries") {
        const result = await tx.transaction.updateMany({
          where: {
            goalId: id,
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });
        resolvedEntriesCount = result.count;
      }

      if (input.mode === "redirect_goal") {
        if (input.targetGoalId === id) {
          throw new GoalsRepositoryError("INVALID_REQUEST", "Target goal must be different from the deleted goal.");
        }

        const targetGoal = await tx.goal.findFirst({
          where: {
            id: input.targetGoalId,
            deletedAt: null,
          },
        });

        if (!targetGoal) {
          throw new GoalsRepositoryError("MISSING_GOAL", `Active goal '${input.targetGoalId}' was not found.`);
        }

        resolvedEntriesCount = await updateLinkedEntriesForGoal(tx, id, targetGoal);
        await tx.transaction.updateMany({
          where: {
            goalId: id,
            deletedAt: null,
          },
          data: { goalId: input.targetGoalId },
        });
      }

      if (input.mode === "redirect_account") {
        const targetAccount = await tx.account.findFirst({
          where: {
            id: input.targetAccountId,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (!targetAccount) {
          throw new GoalsRepositoryError("MISSING_ACCOUNT", `Active account '${input.targetAccountId}' was not found.`);
        }

        const fallbackCategory = await ensureFallbackCategory(tx);
        const result = await tx.transaction.updateMany({
          where: {
            goalId: id,
            deletedAt: null,
          },
          data: {
            accountId: input.targetAccountId,
            categoryId: fallbackCategory.categoryId,
            subcategoryId: null,
            goalId: null,
            transactionType: "REGULAR",
            uiIcon: FALLBACK_CATEGORY_ICON,
            uiIconBg: FALLBACK_CATEGORY_ICON_BG,
          },
        });
        resolvedEntriesCount = result.count;
      }

      await tx.goal.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        deleted: true,
        mode: input.mode,
        resolvedEntriesCount,
      };
    });
  },

  async softDelete(id) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.goal.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existing) {
        return false;
      }

      const activeEntryCount = await tx.transaction.count({
        where: {
          goalId: id,
          deletedAt: null,
        },
      });

      if (activeEntryCount > 0) {
        throw new GoalsRepositoryError(
          "GOAL_IN_USE",
          "Goal has active linked transactions and requires an explicit deletion resolution.",
        );
      }

      await tx.goal.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return true;
    });
  },

  async softDeleteAll() {
    const result = await prisma.$transaction(async (tx) => {
      const activeGoals = await tx.goal.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      const activeGoalIds = activeGoals.map((goal) => goal.id);
      const activeEntryCount = activeGoalIds.length > 0
        ? await tx.transaction.count({
            where: {
              goalId: { in: activeGoalIds },
              deletedAt: null,
            },
          })
        : 0;

      if (activeEntryCount > 0) {
        throw new GoalsRepositoryError(
          "GOAL_IN_USE",
          "Goals with active linked transactions require explicit deletion resolution before bulk delete.",
        );
      }

      return tx.goal.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });

    return result.count;
  },
});

import {
  Prisma,
  type BudgetScopeMode as PrismaBudgetScopeMode,
  type CurrencyCode,
  type PrismaClient,
} from "../../generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type BudgetScopeMode = "all_subcategories" | "selected_subcategories";

export type BudgetsRepositoryErrorCode =
  | "EMPTY_SCOPE"
  | "MISSING_CATEGORY"
  | "MISSING_SUBCATEGORY"
  | "OVERLAPPING_BUDGET";

export class BudgetsRepositoryError extends Error {
  public readonly code: BudgetsRepositoryErrorCode;

  public constructor(code: BudgetsRepositoryErrorCode, message: string) {
    super(message);
    this.name = "BudgetsRepositoryError";
    this.code = code;
  }
}

export interface BudgetScopeRuleRecord {
  id: string;
  categoryId: string;
  mode: BudgetScopeMode;
  selectedSubcategoryIds: string[];
  includeNoSubcategory: boolean;
}

export interface BudgetRecord {
  id: string;
  categoryId: string | null;
  name: string;
  limitAmount: string;
  currency: CurrencyCode;
  periodMonth: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  scopeRules: BudgetScopeRuleRecord[];
}

export interface BudgetScopeRuleInput {
  categoryId: string;
  mode: BudgetScopeMode;
  selectedSubcategoryIds?: string[];
  selectedSubcategoryNames?: string[];
}

export interface CreateBudgetInput {
  name: string;
  limitAmount: DecimalInput;
  currency?: CurrencyCode;
  periodMonth: string | Date;
  scopeRules: BudgetScopeRuleInput[];
}

export interface UpdateBudgetInput {
  name?: string;
  limitAmount?: DecimalInput;
  currency?: CurrencyCode;
  periodMonth?: string | Date;
  scopeRules?: BudgetScopeRuleInput[];
}

export interface BudgetsRepository {
  listActive: (periodMonth?: string | Date) => Promise<BudgetRecord[]>;
  getById: (id: string) => Promise<BudgetRecord | null>;
  create: (input: CreateBudgetInput) => Promise<BudgetRecord>;
  update: (id: string, input: UpdateBudgetInput) => Promise<BudgetRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
  softDeleteAll: () => Promise<number>;
}

interface NormalizedBudgetScopeRule {
  categoryId: string;
  mode: BudgetScopeMode;
  selectedSubcategoryIds: string[];
  selectedSubcategoryNames: string[];
  includeNoSubcategory: boolean;
}

const BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN = "__none__";

const budgetWithScopeRules = {
  scopeRules: {
    include: {
      selectedSubcategories: {
        orderBy: [{ subcategoryId: "asc" }],
      },
    },
    orderBy: [{ categoryId: "asc" }],
  },
} satisfies Prisma.BudgetInclude;

type BudgetWithScopeRules = Prisma.BudgetGetPayload<{
  include: typeof budgetWithScopeRules;
}>;

type BudgetScopeRuleWithSelections = BudgetWithScopeRules["scopeRules"][number];

const MODE_TO_PRISMA: Record<BudgetScopeMode, PrismaBudgetScopeMode> = {
  all_subcategories: "ALL_SUBCATEGORIES",
  selected_subcategories: "SELECTED_SUBCATEGORIES",
};

const MODE_FROM_PRISMA: Record<PrismaBudgetScopeMode, BudgetScopeMode> = {
  ALL_SUBCATEGORIES: "all_subcategories",
  SELECTED_SUBCATEGORIES: "selected_subcategories",
};

const toDecimal = (value: DecimalInput): Prisma.Decimal => new Prisma.Decimal(value);

const toIso = (value: Date): string => value.toISOString();

const toPeriodMonth = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
  }

  return new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);
};

const toYearMonth = (value: Date): string => value.toISOString().slice(0, 7);

const normalizeId = (value: string): string => value.trim();

const uniqueNormalizedIds = (values: string[] | undefined): string[] => {
  const ids = new Set<string>();

  for (const value of values ?? []) {
    const normalized = normalizeId(value);
    if (normalized) {
      ids.add(normalized);
    }
  }

  return Array.from(ids);
};

const uniqueNormalizedNames = (values: string[] | undefined): string[] => {
  const names = new Map<string, string>();

  for (const value of values ?? []) {
    const normalized = value.trim();
    if (normalized) {
      names.set(normalized.toLocaleLowerCase("es-ES"), normalized);
    }
  }

  return Array.from(names.values());
};

const splitNoSubcategoryToken = (values: string[]): { names: string[]; includeNoSubcategory: boolean } => {
  const names: string[] = [];
  let includeNoSubcategory = false;

  for (const value of values) {
    if (value === BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN) {
      includeNoSubcategory = true;
    } else {
      names.push(value);
    }
  }

  return { names, includeNoSubcategory };
};

const toBudgetScopeRuleRecord = (
  scopeRule: BudgetScopeRuleWithSelections,
): BudgetScopeRuleRecord => ({
  id: scopeRule.id,
  categoryId: scopeRule.categoryId,
  mode: MODE_FROM_PRISMA[scopeRule.mode],
  selectedSubcategoryIds: scopeRule.selectedSubcategories.map((selection) => selection.subcategoryId),
  includeNoSubcategory: scopeRule.includeNoSubcategory,
});

const toBudgetRecord = (budget: BudgetWithScopeRules): BudgetRecord => ({
  id: budget.id,
  categoryId: budget.categoryId,
  name: budget.name,
  limitAmount: budget.limitAmount.toFixed(2),
  currency: budget.currency,
  periodMonth: toYearMonth(budget.periodMonth),
  createdAt: toIso(budget.createdAt),
  updatedAt: toIso(budget.updatedAt),
  deletedAt: budget.deletedAt ? toIso(budget.deletedAt) : null,
  scopeRules: budget.scopeRules.map(toBudgetScopeRuleRecord),
});

const extractScopeRules = (budget: BudgetWithScopeRules): NormalizedBudgetScopeRule[] => (
  budget.scopeRules.map((scopeRule) => ({
    categoryId: scopeRule.categoryId,
    mode: MODE_FROM_PRISMA[scopeRule.mode],
    selectedSubcategoryIds: scopeRule.selectedSubcategories.map((selection) => selection.subcategoryId),
    selectedSubcategoryNames: [],
    includeNoSubcategory: scopeRule.includeNoSubcategory,
  }))
);

const normalizeScopeRules = (scopeRules: BudgetScopeRuleInput[]): NormalizedBudgetScopeRule[] => {
  const merged = new Map<string, NormalizedBudgetScopeRule>();

  for (const scopeRule of scopeRules) {
    const categoryId = normalizeId(scopeRule.categoryId);
    if (!categoryId) {
      continue;
    }

    const selectedSubcategoryIds = uniqueNormalizedIds(scopeRule.selectedSubcategoryIds);
    const selectedNames = splitNoSubcategoryToken(uniqueNormalizedNames(scopeRule.selectedSubcategoryNames));
    const normalized: NormalizedBudgetScopeRule = scopeRule.mode === "selected_subcategories"
      ? {
          categoryId,
          mode: "selected_subcategories",
          selectedSubcategoryIds,
          selectedSubcategoryNames: selectedNames.names,
          includeNoSubcategory: selectedNames.includeNoSubcategory,
        }
      : {
          categoryId,
          mode: "all_subcategories",
          selectedSubcategoryIds: [],
          selectedSubcategoryNames: [],
          includeNoSubcategory: false,
        };

    if (
      normalized.mode === "selected_subcategories" &&
      normalized.selectedSubcategoryIds.length === 0 &&
      normalized.selectedSubcategoryNames.length === 0 &&
      !normalized.includeNoSubcategory
    ) {
      continue;
    }

    const existing = merged.get(categoryId);
    if (!existing || existing.mode === "all_subcategories" || normalized.mode === "all_subcategories") {
      merged.set(categoryId, normalized.mode === "all_subcategories"
        ? {
            categoryId,
            mode: "all_subcategories",
            selectedSubcategoryIds: [],
            selectedSubcategoryNames: [],
            includeNoSubcategory: false,
          }
        : normalized);
      continue;
    }

    merged.set(categoryId, {
      categoryId,
      mode: "selected_subcategories",
      selectedSubcategoryIds: uniqueNormalizedIds([
        ...existing.selectedSubcategoryIds,
        ...normalized.selectedSubcategoryIds,
      ]),
      selectedSubcategoryNames: uniqueNormalizedNames([
        ...existing.selectedSubcategoryNames,
        ...normalized.selectedSubcategoryNames,
      ]),
      includeNoSubcategory: existing.includeNoSubcategory || normalized.includeNoSubcategory,
    });
  }

  const normalizedRules = Array.from(merged.values());
  if (normalizedRules.length === 0) {
    throw new BudgetsRepositoryError(
      "EMPTY_SCOPE",
      "Budget requires at least one valid category scope rule.",
    );
  }

  return normalizedRules;
};

const assertCategoryExists = async (prisma: PrismaClient, categoryId: string): Promise<void> => {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!category) {
    throw new BudgetsRepositoryError(
      "MISSING_CATEGORY",
      `Active category '${categoryId}' was not found.`,
    );
  }
};

const assertSubcategoriesExist = async (
  prisma: PrismaClient,
  categoryId: string,
  subcategoryIds: string[],
): Promise<void> => {
  if (subcategoryIds.length === 0) {
    return;
  }

  const subcategories = await prisma.subcategory.findMany({
    where: {
      categoryId,
      id: { in: subcategoryIds },
      category: { deletedAt: null },
    },
    select: { id: true },
  });
  const foundIds = new Set(subcategories.map((subcategory) => subcategory.id));
  const missingId = subcategoryIds.find((subcategoryId) => !foundIds.has(subcategoryId));

  if (missingId) {
    throw new BudgetsRepositoryError(
      "MISSING_SUBCATEGORY",
      `Active subcategory '${missingId}' was not found for category '${categoryId}'.`,
    );
  }
};

const resolveSubcategoryNames = async (
  prisma: PrismaClient,
  categoryId: string,
  subcategoryNames: string[],
): Promise<string[]> => {
  if (subcategoryNames.length === 0) {
    return [];
  }

  const subcategories = await prisma.subcategory.findMany({
    where: {
      categoryId,
      name: { in: subcategoryNames },
      category: { deletedAt: null },
    },
    select: { id: true, name: true },
  });
  const idsByName = new Map(subcategories.map((subcategory) => [
    subcategory.name.toLocaleLowerCase("es-ES"),
    subcategory.id,
  ]));
  const missingName = subcategoryNames.find((name) => !idsByName.has(name.toLocaleLowerCase("es-ES")));

  if (missingName) {
    throw new BudgetsRepositoryError(
      "MISSING_SUBCATEGORY",
      `Active subcategory '${missingName}' was not found for category '${categoryId}'.`,
    );
  }

  return subcategoryNames.map((name) => idsByName.get(name.toLocaleLowerCase("es-ES")) as string);
};

const validateScopeRules = async (
  prisma: PrismaClient,
  scopeRules: BudgetScopeRuleInput[],
): Promise<NormalizedBudgetScopeRule[]> => {
  const normalizedScopeRules = normalizeScopeRules(scopeRules);

  for (const scopeRule of normalizedScopeRules) {
    await assertCategoryExists(prisma, scopeRule.categoryId);
    if (scopeRule.mode === "selected_subcategories") {
      scopeRule.selectedSubcategoryIds = uniqueNormalizedIds([
        ...scopeRule.selectedSubcategoryIds,
        ...await resolveSubcategoryNames(prisma, scopeRule.categoryId, scopeRule.selectedSubcategoryNames),
      ]);
      await assertSubcategoriesExist(prisma, scopeRule.categoryId, scopeRule.selectedSubcategoryIds);
    }
  }

  return normalizedScopeRules;
};

const doScopeRulesOverlap = (
  left: NormalizedBudgetScopeRule,
  right: NormalizedBudgetScopeRule,
): boolean => {
  if (left.categoryId !== right.categoryId) {
    return false;
  }

  if (left.mode === "all_subcategories" || right.mode === "all_subcategories") {
    return true;
  }

  const rightSubcategoryIds = new Set(right.selectedSubcategoryIds);
  return (left.includeNoSubcategory && right.includeNoSubcategory) ||
    left.selectedSubcategoryIds.some((subcategoryId) => rightSubcategoryIds.has(subcategoryId));
};

const assertNoOverlappingBudget = async (
  prisma: PrismaClient,
  periodMonth: Date,
  scopeRules: NormalizedBudgetScopeRule[],
  excludeBudgetId?: string,
): Promise<void> => {
  const existingBudgets = await prisma.budget.findMany({
    where: {
      periodMonth,
      deletedAt: null,
      ...(excludeBudgetId ? { id: { not: excludeBudgetId } } : {}),
    },
    include: budgetWithScopeRules,
  });

  for (const existingBudget of existingBudgets) {
    const existingScopeRules = extractScopeRules(existingBudget);
    const hasOverlap = scopeRules.some((candidateRule) => (
      existingScopeRules.some((existingRule) => doScopeRulesOverlap(candidateRule, existingRule))
    ));

    if (hasOverlap) {
      throw new BudgetsRepositoryError(
        "OVERLAPPING_BUDGET",
        `Budget scope overlaps active budget '${existingBudget.id}' for ${toYearMonth(periodMonth)}.`,
      );
    }
  }
};

const toScopeRuleCreateInput = (scopeRule: NormalizedBudgetScopeRule) => ({
  categoryId: scopeRule.categoryId,
  mode: MODE_TO_PRISMA[scopeRule.mode],
  includeNoSubcategory: scopeRule.mode === "selected_subcategories" && scopeRule.includeNoSubcategory,
  ...(scopeRule.mode === "selected_subcategories"
    ? {
        selectedSubcategories: {
          create: scopeRule.selectedSubcategoryIds.map((subcategoryId) => ({ subcategoryId })),
        },
      }
    : {}),
});

export const createBudgetsRepository = (prisma: PrismaClient): BudgetsRepository => ({
  async listActive(periodMonth) {
    const budgets = await prisma.budget.findMany({
      where: {
        deletedAt: null,
        ...(periodMonth ? { periodMonth: toPeriodMonth(periodMonth) } : {}),
      },
      include: budgetWithScopeRules,
      orderBy: [{ periodMonth: "desc" }, { createdAt: "desc" }],
    });

    return budgets.map(toBudgetRecord);
  },

  async getById(id) {
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: budgetWithScopeRules,
    });

    return budget ? toBudgetRecord(budget) : null;
  },

  async create(input) {
    const periodMonth = toPeriodMonth(input.periodMonth);
    const scopeRules = await validateScopeRules(prisma, input.scopeRules);
    await assertNoOverlappingBudget(prisma, periodMonth, scopeRules);

    const budget = await prisma.budget.create({
      data: {
        categoryId: scopeRules[0]?.categoryId ?? null,
        name: input.name.trim(),
        limitAmount: toDecimal(input.limitAmount),
        currency: input.currency ?? "USD",
        periodMonth,
        scopeRules: {
          create: scopeRules.map(toScopeRuleCreateInput),
        },
      },
      include: budgetWithScopeRules,
    });

    return toBudgetRecord(budget);
  },

  async update(id, input) {
    const existing = await prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: budgetWithScopeRules,
    });

    if (!existing) {
      return null;
    }

    const periodMonth = input.periodMonth ? toPeriodMonth(input.periodMonth) : existing.periodMonth;
    const scopeRules = input.scopeRules
      ? await validateScopeRules(prisma, input.scopeRules)
      : extractScopeRules(existing);
    await assertNoOverlappingBudget(prisma, periodMonth, scopeRules, id);

    const budget = await prisma.$transaction(async (tx) => {
      await tx.budgetScopeRule.deleteMany({ where: { budgetId: id } });

      return tx.budget.update({
        where: { id },
        data: {
          categoryId: scopeRules[0]?.categoryId ?? null,
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.limitAmount !== undefined ? { limitAmount: toDecimal(input.limitAmount) } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          periodMonth,
          scopeRules: {
            create: scopeRules.map(toScopeRuleCreateInput),
          },
        },
        include: budgetWithScopeRules,
      });
    });

    return toBudgetRecord(budget);
  },

  async softDelete(id) {
    const existing = await prisma.budget.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.budget.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async softDeleteAll() {
    const result = await prisma.budget.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count;
  },
});

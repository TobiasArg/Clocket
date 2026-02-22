import type {
  BudgetPlanItem,
  BudgetsRepository,
  CreateBudgetInput,
  UpdateBudgetPatch,
} from "@/domain/budgets/repository";
import {
  getPrimaryBudgetCategoryId,
  normalizeBudgetScopeRules,
} from "@/domain/budgets/budgetScopeMatcher";

const LEGACY_STORAGE_VERSION_1 = 1 as const;
const STORAGE_VERSION = 2 as const;
const DEFAULT_STORAGE_KEY = "clocket.budgets";
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

interface LegacyBudgetItem {
  id: string;
  categoryId: string;
  name: string;
  limitAmount: number;
  month: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetsStorageV1 {
  version: typeof LEGACY_STORAGE_VERSION_1;
  items: LegacyBudgetItem[];
}

interface BudgetsStorageV2 {
  version: typeof STORAGE_VERSION;
  items: BudgetPlanItem[];
}

const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const cloneBudget = (item: BudgetPlanItem): BudgetPlanItem => ({
  ...item,
  scopeRules: item.scopeRules.map((scopeRule) => ({
    ...scopeRule,
    subcategoryNames: scopeRule.subcategoryNames ? [...scopeRule.subcategoryNames] : undefined,
  })),
});

const cloneBudgets = (items: BudgetPlanItem[]): BudgetPlanItem[] => items.map(cloneBudget);

const buildInitialState = (): BudgetsStorageV2 => ({
  version: STORAGE_VERSION,
  items: [],
});

const normalizeName = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Budget name is required.");
  }

  return normalized;
};

const normalizeLimitAmount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Budget amount must be greater than 0.");
  }

  return Math.round(value * 100) / 100;
};

const normalizeMonth = (value?: string): string => {
  const month = value?.trim() || getCurrentYearMonth();
  if (!YEAR_MONTH_PATTERN.test(month)) {
    throw new Error("Budget month must use YYYY-MM format.");
  }

  return month;
};

const createBudgetId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `budget_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const normalizeScopeRulesOrThrow = (
  scopeRules: BudgetPlanItem["scopeRules"] | undefined,
  legacyCategoryId?: string,
): BudgetPlanItem["scopeRules"] => {
  const normalized = normalizeBudgetScopeRules(scopeRules, legacyCategoryId);
  if (normalized.length === 0) {
    throw new Error("Budget requires at least one category scope rule.");
  }

  return normalized.map((rule) => ({
    ...rule,
    subcategoryNames: rule.subcategoryNames ? [...rule.subcategoryNames] : undefined,
  }));
};

const isLegacyBudgetItem = (value: unknown): value is LegacyBudgetItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<LegacyBudgetItem>;
  return (
    typeof item.id === "string" &&
    typeof item.categoryId === "string" &&
    item.categoryId.trim().length > 0 &&
    typeof item.name === "string" &&
    typeof item.limitAmount === "number" &&
    Number.isFinite(item.limitAmount) &&
    typeof item.month === "string" &&
    YEAR_MONTH_PATTERN.test(item.month) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isScopeRule = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const scopeRule = value as {
    categoryId?: unknown;
    mode?: unknown;
    subcategoryNames?: unknown;
  };

  if (typeof scopeRule.categoryId !== "string" || scopeRule.categoryId.trim().length === 0) {
    return false;
  }

  if (scopeRule.mode === "all_subcategories") {
    return true;
  }

  if (scopeRule.mode !== "selected_subcategories") {
    return false;
  }

  return Array.isArray(scopeRule.subcategoryNames)
    && scopeRule.subcategoryNames.length > 0
    && scopeRule.subcategoryNames.every((subcategory) => typeof subcategory === "string");
};

const isBudgetItem = (value: unknown): value is BudgetPlanItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<BudgetPlanItem>;
  return (
    typeof item.id === "string" &&
    (item.categoryId === undefined || typeof item.categoryId === "string") &&
    typeof item.name === "string" &&
    typeof item.limitAmount === "number" &&
    Number.isFinite(item.limitAmount) &&
    typeof item.month === "string" &&
    YEAR_MONTH_PATTERN.test(item.month) &&
    Array.isArray(item.scopeRules) &&
    item.scopeRules.length > 0 &&
    item.scopeRules.every((scopeRule) => isScopeRule(scopeRule)) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShapeV1 = (value: unknown): value is BudgetsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<BudgetsStorageV1>;
  return (
    state.version === LEGACY_STORAGE_VERSION_1 &&
    Array.isArray(state.items) &&
    state.items.every(isLegacyBudgetItem)
  );
};

const isStorageShapeV2 = (value: unknown): value is BudgetsStorageV2 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<BudgetsStorageV2>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isBudgetItem)
  );
};

const migrateStorageV1 = (state: BudgetsStorageV1): BudgetsStorageV2 => {
  return {
    version: STORAGE_VERSION,
    items: state.items.map((item) => {
      const scopeRules = normalizeScopeRulesOrThrow(undefined, item.categoryId);
      const primaryCategoryId = getPrimaryBudgetCategoryId(scopeRules, item.categoryId);

      return {
        ...item,
        categoryId: primaryCategoryId ?? undefined,
        scopeRules,
      };
    }),
  };
};

const buildCreatedBudget = (input: CreateBudgetInput): BudgetPlanItem => {
  const nowIso = new Date().toISOString();
  const scopeRules = normalizeScopeRulesOrThrow(input.scopeRules, input.categoryId);
  const primaryCategoryId = getPrimaryBudgetCategoryId(scopeRules, input.categoryId);

  return {
    id: createBudgetId(),
    categoryId: primaryCategoryId ?? undefined,
    scopeRules,
    name: normalizeName(input.name),
    limitAmount: normalizeLimitAmount(input.limitAmount),
    month: normalizeMonth(input.month),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const buildUpdatedBudget = (
  current: BudgetPlanItem,
  patch: UpdateBudgetPatch,
): BudgetPlanItem => {
  const nextScopeRules = patch.scopeRules !== undefined || patch.categoryId !== undefined
    ? normalizeScopeRulesOrThrow(patch.scopeRules, patch.categoryId ?? current.categoryId)
    : normalizeScopeRulesOrThrow(current.scopeRules, current.categoryId);
  const primaryCategoryId = getPrimaryBudgetCategoryId(nextScopeRules, patch.categoryId ?? current.categoryId);

  return {
    ...current,
    categoryId: primaryCategoryId ?? undefined,
    scopeRules: nextScopeRules,
    ...(patch.name !== undefined ? { name: normalizeName(patch.name) } : {}),
    ...(patch.limitAmount !== undefined
      ? { limitAmount: normalizeLimitAmount(patch.limitAmount) }
      : {}),
    ...(patch.month !== undefined ? { month: normalizeMonth(patch.month) } : {}),
    updatedAt: new Date().toISOString(),
  };
};

export class LocalStorageBudgetsRepository implements BudgetsRepository {
  private readonly storageKey: string;

  private memoryState: BudgetsStorageV2;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<BudgetPlanItem[]> {
    return cloneBudgets(this.readState().items);
  }

  public async getById(id: string): Promise<BudgetPlanItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneBudget(found) : null;
  }

  public async create(input: CreateBudgetInput): Promise<BudgetPlanItem> {
    const state = this.readState();
    const created = buildCreatedBudget(input);

    state.items.push(created);
    this.writeState(state);

    return cloneBudget(created);
  }

  public async update(id: string, patch: UpdateBudgetPatch): Promise<BudgetPlanItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = buildUpdatedBudget(state.items[index], patch);
    state.items[index] = updated;
    this.writeState(state);

    return cloneBudget(updated);
  }

  public async remove(id: string): Promise<boolean> {
    const state = this.readState();
    const filtered = state.items.filter((item) => item.id !== id);

    if (filtered.length === state.items.length) {
      return false;
    }

    state.items = filtered;
    this.writeState(state);

    return true;
  }

  public async clearAll(): Promise<void> {
    this.writeState(buildInitialState());
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }

  private readState(): BudgetsStorageV2 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneBudgets(this.memoryState.items),
      };
    }

    const raw = storage.getItem(this.storageKey);
    if (!raw) {
      const initial = buildInitialState();
      this.writeState(initial);
      return initial;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStorageShapeV2(parsed)) {
        return {
          version: parsed.version,
          items: cloneBudgets(parsed.items),
        };
      }

      if (isStorageShapeV1(parsed)) {
        const migrated = migrateStorageV1(parsed);
        this.writeState(migrated);
        return migrated;
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: BudgetsStorageV2): void {
    const next: BudgetsStorageV2 = {
      version: state.version,
      items: cloneBudgets(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const budgetsRepository: BudgetsRepository = new LocalStorageBudgetsRepository();

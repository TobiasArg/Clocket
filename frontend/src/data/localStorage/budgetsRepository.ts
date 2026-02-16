import type {
  BudgetPlanItem,
  BudgetsRepository,
  CreateBudgetInput,
  UpdateBudgetPatch,
} from "@/domain/budgets/repository";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.budgets";
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

interface BudgetsStorageV1 {
  version: typeof STORAGE_VERSION;
  items: BudgetPlanItem[];
}

const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const buildInitialState = (): BudgetsStorageV1 => ({
  version: STORAGE_VERSION,
  items: [],
});

const cloneBudget = (item: BudgetPlanItem): BudgetPlanItem => ({ ...item });
const cloneBudgets = (items: BudgetPlanItem[]): BudgetPlanItem[] => items.map(cloneBudget);

const normalizeName = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Budget name is required.");
  }

  return normalized;
};

const normalizeCategoryId = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Category is required.");
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

const isBudgetItem = (value: unknown): value is BudgetPlanItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<BudgetPlanItem>;
  return (
    typeof item.id === "string" &&
    typeof item.categoryId === "string" &&
    typeof item.name === "string" &&
    typeof item.limitAmount === "number" &&
    Number.isFinite(item.limitAmount) &&
    typeof item.month === "string" &&
    YEAR_MONTH_PATTERN.test(item.month) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShape = (value: unknown): value is BudgetsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<BudgetsStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isBudgetItem)
  );
};

const buildCreatedBudget = (input: CreateBudgetInput): BudgetPlanItem => {
  const nowIso = new Date().toISOString();
  return {
    id: createBudgetId(),
    categoryId: normalizeCategoryId(input.categoryId),
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
  return {
    ...current,
    ...(patch.categoryId !== undefined
      ? { categoryId: normalizeCategoryId(patch.categoryId) }
      : {}),
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

  private memoryState: BudgetsStorageV1;

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

  private readState(): BudgetsStorageV1 {
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
      if (isStorageShape(parsed)) {
        return {
          version: parsed.version,
          items: cloneBudgets(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: BudgetsStorageV1): void {
    const next: BudgetsStorageV1 = {
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

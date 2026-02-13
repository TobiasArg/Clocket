import type {
  CreateGoalInput,
  GoalPlanItem,
  GoalsRepository,
  UpdateGoalPatch,
} from "@/utils";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.goals";
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

interface GoalsStorageV1 {
  version: typeof STORAGE_VERSION;
  items: GoalPlanItem[];
}

const buildInitialState = (): GoalsStorageV1 => ({
  version: STORAGE_VERSION,
  items: [],
});

const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const cloneGoal = (item: GoalPlanItem): GoalPlanItem => ({ ...item });
const cloneGoals = (items: GoalPlanItem[]): GoalPlanItem[] => items.map(cloneGoal);

const normalizeTitle = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Goal title is required.");
  }

  return normalized;
};

const normalizeAmount = (value: number, field: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a valid amount.`);
  }

  return Math.round(value * 100) / 100;
};

const normalizeTargetAmount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Target amount must be greater than 0.");
  }

  return Math.round(value * 100) / 100;
};

const normalizeTargetMonth = (value?: string): string => {
  const month = value?.trim() || getCurrentYearMonth();
  if (!YEAR_MONTH_PATTERN.test(month)) {
    throw new Error("Target month must use YYYY-MM format.");
  }

  return month;
};

const createGoalId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `goal_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const isGoalItem = (value: unknown): value is GoalPlanItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<GoalPlanItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.targetAmount === "number" &&
    Number.isFinite(item.targetAmount) &&
    typeof item.savedAmount === "number" &&
    Number.isFinite(item.savedAmount) &&
    typeof item.targetMonth === "string" &&
    YEAR_MONTH_PATTERN.test(item.targetMonth) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShape = (value: unknown): value is GoalsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<GoalsStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isGoalItem)
  );
};

const buildCreatedGoal = (input: CreateGoalInput): GoalPlanItem => {
  const nowIso = new Date().toISOString();
  const targetAmount = normalizeTargetAmount(input.targetAmount);
  const savedAmount = normalizeAmount(input.savedAmount ?? 0, "Saved amount");

  return {
    id: createGoalId(),
    title: normalizeTitle(input.title),
    targetAmount,
    savedAmount: Math.min(savedAmount, targetAmount),
    targetMonth: normalizeTargetMonth(input.targetMonth),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const buildUpdatedGoal = (
  current: GoalPlanItem,
  patch: UpdateGoalPatch,
): GoalPlanItem => {
  const targetAmount =
    patch.targetAmount === undefined
      ? current.targetAmount
      : normalizeTargetAmount(patch.targetAmount);

  const savedAmount =
    patch.savedAmount === undefined
      ? current.savedAmount
      : normalizeAmount(patch.savedAmount, "Saved amount");

  return {
    ...current,
    ...(patch.title !== undefined ? { title: normalizeTitle(patch.title) } : {}),
    ...(patch.targetMonth !== undefined
      ? { targetMonth: normalizeTargetMonth(patch.targetMonth) }
      : {}),
    targetAmount,
    savedAmount: Math.min(savedAmount, targetAmount),
    updatedAt: new Date().toISOString(),
  };
};

export class LocalStorageGoalsRepository implements GoalsRepository {
  private readonly storageKey: string;

  private memoryState: GoalsStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<GoalPlanItem[]> {
    return cloneGoals(this.readState().items);
  }

  public async getById(id: string): Promise<GoalPlanItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneGoal(found) : null;
  }

  public async create(input: CreateGoalInput): Promise<GoalPlanItem> {
    const state = this.readState();
    const created = buildCreatedGoal(input);

    state.items.push(created);
    this.writeState(state);

    return cloneGoal(created);
  }

  public async update(id: string, patch: UpdateGoalPatch): Promise<GoalPlanItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = buildUpdatedGoal(state.items[index], patch);
    state.items[index] = updated;
    this.writeState(state);

    return cloneGoal(updated);
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

  private readState(): GoalsStorageV1 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneGoals(this.memoryState.items),
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
          items: cloneGoals(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: GoalsStorageV1): void {
    const next: GoalsStorageV1 = {
      version: state.version,
      items: cloneGoals(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const goalsRepository: GoalsRepository = new LocalStorageGoalsRepository();

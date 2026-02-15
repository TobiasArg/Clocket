import type {
  CreateGoalInput,
  GoalPlanItem,
  GoalsRepository,
  UpdateGoalPatch,
} from "./goalsRepository";
import {
  DEFAULT_GOAL_COLOR_KEY,
  getGoalCategoryName,
  getGoalColorOption,
} from "./goalAppearance";
import { categoriesRepository } from "./localStorageCategoriesRepository";

const STORAGE_VERSION = 2 as const;
const LEGACY_STORAGE_VERSION_1 = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.goals";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface GoalsStorageV1 {
  version: typeof LEGACY_STORAGE_VERSION_1;
  items: Array<{
    id: string;
    title: string;
    targetAmount: number;
    savedAmount: number;
    targetMonth: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface GoalsStorageV2 {
  version: typeof STORAGE_VERSION;
  items: GoalPlanItem[];
}

const buildInitialState = (): GoalsStorageV2 => ({
  version: STORAGE_VERSION,
  items: [],
});

const cloneGoal = (item: GoalPlanItem): GoalPlanItem => ({ ...item });
const cloneGoals = (items: GoalPlanItem[]): GoalPlanItem[] => items.map(cloneGoal);

const normalizeTitle = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Goal title is required.");
  }

  return normalized;
};

const normalizeDescription = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Goal description is required.");
  }

  return normalized;
};

const normalizeTargetAmount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Target amount must be greater than 0.");
  }

  return Math.round(value * 100) / 100;
};

const normalizeDeadlineDate = (value: string): string => {
  const normalized = value.trim();
  if (!ISO_DATE_PATTERN.test(normalized)) {
    throw new Error("Deadline date must use YYYY-MM-DD format.");
  }

  return normalized;
};

const normalizeIcon = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Goal icon is required.");
  }

  return normalized;
};

const normalizeColorKey = (value: CreateGoalInput["colorKey"]): CreateGoalInput["colorKey"] => {
  return value ?? DEFAULT_GOAL_COLOR_KEY;
};

const createGoalId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `goal_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const normalizeForTitleComparison = (value: string): string => value.trim().toLocaleLowerCase("es-ES");

const ensureUniqueGoalTitle = (
  title: string,
  items: GoalPlanItem[],
  excludedId?: string,
): void => {
  const normalizedTitle = normalizeForTitleComparison(title);
  const hasDuplicate = items.some((goal) => (
    goal.id !== excludedId &&
    normalizeForTitleComparison(goal.title) === normalizedTitle
  ));

  if (hasDuplicate) {
    throw new Error("Goal title must be unique.");
  }
};

const isGoalItemV2 = (value: unknown): value is GoalPlanItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<GoalPlanItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.targetAmount === "number" &&
    Number.isFinite(item.targetAmount) &&
    item.targetAmount > 0 &&
    typeof item.deadlineDate === "string" &&
    ISO_DATE_PATTERN.test(item.deadlineDate) &&
    typeof item.icon === "string" &&
    typeof item.colorKey === "string" &&
    typeof item.categoryId === "string" &&
    item.categoryId.trim().length > 0 &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isLegacyGoalItemV1 = (value: unknown): value is GoalsStorageV1["items"][number] => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<GoalsStorageV1["items"][number]>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.targetAmount === "number" &&
    Number.isFinite(item.targetAmount) &&
    typeof item.savedAmount === "number" &&
    Number.isFinite(item.savedAmount) &&
    typeof item.targetMonth === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShapeV2 = (value: unknown): value is GoalsStorageV2 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<GoalsStorageV2>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isGoalItemV2)
  );
};

const isStorageShapeV1 = (value: unknown): value is GoalsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<GoalsStorageV1>;
  return (
    state.version === LEGACY_STORAGE_VERSION_1 &&
    Array.isArray(state.items) &&
    state.items.every(isLegacyGoalItemV1)
  );
};

const buildCreatedGoal = (
  input: CreateGoalInput,
  categoryId: string,
): GoalPlanItem => {
  const nowIso = new Date().toISOString();

  return {
    id: createGoalId(),
    title: normalizeTitle(input.title),
    description: normalizeDescription(input.description),
    targetAmount: normalizeTargetAmount(input.targetAmount),
    deadlineDate: normalizeDeadlineDate(input.deadlineDate),
    icon: normalizeIcon(input.icon),
    colorKey: normalizeColorKey(input.colorKey),
    categoryId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const buildUpdatedGoal = (
  current: GoalPlanItem,
  patch: UpdateGoalPatch,
): GoalPlanItem => {
  return {
    ...current,
    ...(patch.title !== undefined ? { title: normalizeTitle(patch.title) } : {}),
    ...(patch.description !== undefined
      ? { description: normalizeDescription(patch.description) }
      : {}),
    ...(patch.targetAmount !== undefined
      ? { targetAmount: normalizeTargetAmount(patch.targetAmount) }
      : {}),
    ...(patch.deadlineDate !== undefined
      ? { deadlineDate: normalizeDeadlineDate(patch.deadlineDate) }
      : {}),
    ...(patch.icon !== undefined ? { icon: normalizeIcon(patch.icon) } : {}),
    ...(patch.colorKey !== undefined ? { colorKey: normalizeColorKey(patch.colorKey) } : {}),
    ...(patch.categoryId !== undefined && patch.categoryId.trim().length > 0
      ? { categoryId: patch.categoryId.trim() }
      : {}),
    updatedAt: new Date().toISOString(),
  };
};

export class LocalStorageGoalsRepository implements GoalsRepository {
  private readonly storageKey: string;

  private memoryState: GoalsStorageV2;

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
    const normalizedTitle = normalizeTitle(input.title);
    ensureUniqueGoalTitle(normalizedTitle, state.items);

    const colorKey = normalizeColorKey(input.colorKey);
    const color = getGoalColorOption(colorKey);
    const createdCategory = await categoriesRepository.create({
      name: getGoalCategoryName(normalizedTitle),
      icon: "target",
      iconBg: color.iconBgClass,
    });

    const created = buildCreatedGoal(
      {
        ...input,
        colorKey,
        title: normalizedTitle,
      },
      createdCategory.id,
    );
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
    ensureUniqueGoalTitle(updated.title, state.items, updated.id);
    const color = getGoalColorOption(updated.colorKey);

    const updatedCategory = await categoriesRepository.update(updated.categoryId, {
      name: getGoalCategoryName(updated.title),
      icon: "target",
      iconBg: color.iconBgClass,
    });

    if (!updatedCategory) {
      const createdCategory = await categoriesRepository.create({
        name: getGoalCategoryName(updated.title),
        icon: "target",
        iconBg: color.iconBgClass,
      });
      updated.categoryId = createdCategory.id;
    }

    state.items[index] = updated;
    this.writeState(state);

    return cloneGoal(updated);
  }

  public async remove(id: string): Promise<boolean> {
    const state = this.readState();
    const target = state.items.find((item) => item.id === id);
    if (!target) {
      return false;
    }

    state.items = state.items.filter((item) => item.id !== id);
    this.writeState(state);
    await categoriesRepository.remove(target.categoryId);

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

  private readState(): GoalsStorageV2 {
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
      if (isStorageShapeV2(parsed)) {
        return {
          version: parsed.version,
          items: cloneGoals(parsed.items),
        };
      }

      if (isStorageShapeV1(parsed)) {
        const resetState = buildInitialState();
        this.writeState(resetState);
        return resetState;
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: GoalsStorageV2): void {
    const next: GoalsStorageV2 = {
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

import type {
  CreateGoalInput,
  GoalPlanItem,
  GoalsRepository,
  UpdateGoalPatch,
} from "@/domain/goals/repository";
import {
  DEFAULT_GOAL_COLOR_KEY,
  GOALS_PARENT_CATEGORY_ICON,
  GOALS_PARENT_CATEGORY_ICON_BG,
  GOALS_PARENT_CATEGORY_NAME,
} from "@/domain/goals/goalAppearance";
import type { CategoryItem } from "@/domain/categories/repository";
import { categoriesRepository } from "@/data/localStorage/categoriesRepository";

const STORAGE_VERSION = 2 as const;
const LEGACY_STORAGE_VERSION_1 = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.goals";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LEGACY_GOAL_CATEGORY_PREFIX = "Goal - \"";

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

const normalizeSubcategories = (value: string[] | undefined): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Map<string, string>();
  value.forEach((item) => {
    const normalized = item.trim();
    if (!normalized) {
      return;
    }

    const key = normalizeForTitleComparison(normalized);
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
  });

  return Array.from(deduped.values());
};

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
    updatedAt: new Date().toISOString(),
  };
};

const isGoalsParentCategory = (category: CategoryItem): boolean => {
  return normalizeForTitleComparison(category.name) === normalizeForTitleComparison(GOALS_PARENT_CATEGORY_NAME);
};

export class LocalStorageGoalsRepository implements GoalsRepository {
  private readonly storageKey: string;

  private memoryState: GoalsStorageV2;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<GoalPlanItem[]> {
    const state = await this.syncGoalsCategoryStructure(this.readState());
    return cloneGoals(state.items);
  }

  public async getById(id: string): Promise<GoalPlanItem | null> {
    const state = await this.syncGoalsCategoryStructure(this.readState());
    const found = state.items.find((item) => item.id === id);
    return found ? cloneGoal(found) : null;
  }

  public async create(input: CreateGoalInput): Promise<GoalPlanItem> {
    const state = await this.syncGoalsCategoryStructure(this.readState());
    const normalizedTitle = normalizeTitle(input.title);
    ensureUniqueGoalTitle(normalizedTitle, state.items);

    const goalsCategory = await this.ensureGoalsParentCategory();
    await this.ensureGoalSubcategory(goalsCategory.id, normalizedTitle);

    const created = buildCreatedGoal(
      {
        ...input,
        colorKey: normalizeColorKey(input.colorKey),
        title: normalizedTitle,
      },
      goalsCategory.id,
    );

    state.items.push(created);
    this.writeState(state);

    return cloneGoal(created);
  }

  public async update(id: string, patch: UpdateGoalPatch): Promise<GoalPlanItem | null> {
    const state = await this.syncGoalsCategoryStructure(this.readState());
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const current = state.items[index];
    const updated = buildUpdatedGoal(current, patch);
    ensureUniqueGoalTitle(updated.title, state.items, updated.id);

    const goalsCategory = await this.ensureGoalsParentCategory();
    updated.categoryId = goalsCategory.id;

    await this.ensureGoalSubcategory(goalsCategory.id, updated.title);

    if (normalizeForTitleComparison(current.title) !== normalizeForTitleComparison(updated.title)) {
      const remainingGoals = state.items.filter((item) => item.id !== id);
      await this.removeGoalSubcategoryIfUnused(goalsCategory.id, current.title, remainingGoals);
    }

    state.items[index] = updated;
    this.writeState(state);

    return cloneGoal(updated);
  }

  public async remove(id: string): Promise<boolean> {
    const state = await this.syncGoalsCategoryStructure(this.readState());
    const target = state.items.find((item) => item.id === id);
    if (!target) {
      return false;
    }

    state.items = state.items.filter((item) => item.id !== id);
    this.writeState(state);

    await this.removeGoalSubcategoryIfUnused(target.categoryId, target.title, state.items);

    return true;
  }

  public async clearAll(): Promise<void> {
    const categories = await categoriesRepository.list();
    const goalsCategory = categories.find(isGoalsParentCategory);

    if (goalsCategory) {
      await categoriesRepository.update(goalsCategory.id, {
        subcategoryCount: 0,
        subcategories: [],
      });
    }

    this.writeState(buildInitialState());
  }

  private async syncGoalsCategoryStructure(state: GoalsStorageV2): Promise<GoalsStorageV2> {
    if (state.items.length === 0) {
      return state;
    }

    const goalsCategory = await this.ensureGoalsParentCategory();
    const previousCategoryIds = new Set<string>(
      state.items
        .map((item) => item.categoryId)
        .filter((categoryId) => categoryId !== goalsCategory.id),
    );

    let hasStateChanges = false;
    const normalizedState: GoalsStorageV2 = {
      version: state.version,
      items: state.items.map((item) => {
        if (item.categoryId === goalsCategory.id) {
          return item;
        }

        hasStateChanges = true;
        return {
          ...item,
          categoryId: goalsCategory.id,
        };
      }),
    };

    const goalTitles = normalizedState.items.map((item) => item.title);
    const goalsCategorySnapshot = await categoriesRepository.getById(goalsCategory.id);
    const currentSubcategories = normalizeSubcategories(goalsCategorySnapshot?.subcategories);
    const mergedSubcategories = normalizeSubcategories([...currentSubcategories, ...goalTitles]);

    if (
      mergedSubcategories.length !== currentSubcategories.length ||
      mergedSubcategories.some((value, index) => value !== currentSubcategories[index])
    ) {
      await categoriesRepository.update(goalsCategory.id, {
        subcategoryCount: mergedSubcategories.length,
        subcategories: mergedSubcategories,
      });
    }

    if (hasStateChanges) {
      this.writeState(normalizedState);
    }

    const categories = await categoriesRepository.list();
    for (const categoryId of previousCategoryIds) {
      const legacyCategory = categories.find((category) => category.id === categoryId);
      if (!legacyCategory) {
        continue;
      }

      if (!legacyCategory.name.startsWith(LEGACY_GOAL_CATEGORY_PREFIX)) {
        continue;
      }

      await categoriesRepository.remove(categoryId);
    }

    return normalizedState;
  }

  private async ensureGoalsParentCategory(): Promise<CategoryItem> {
    const categories = await categoriesRepository.list();
    const existing = categories.find(isGoalsParentCategory);

    if (existing) {
      if (
        existing.icon !== GOALS_PARENT_CATEGORY_ICON ||
        existing.iconBg !== GOALS_PARENT_CATEGORY_ICON_BG
      ) {
        const updated = await categoriesRepository.update(existing.id, {
          icon: GOALS_PARENT_CATEGORY_ICON,
          iconBg: GOALS_PARENT_CATEGORY_ICON_BG,
        });

        return updated ?? existing;
      }

      return existing;
    }

    return categoriesRepository.create({
      name: GOALS_PARENT_CATEGORY_NAME,
      icon: GOALS_PARENT_CATEGORY_ICON,
      iconBg: GOALS_PARENT_CATEGORY_ICON_BG,
    });
  }

  private async ensureGoalSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
    const category = await categoriesRepository.getById(categoryId);
    if (!category) {
      return;
    }

    const normalizedName = normalizeTitle(subcategoryName);
    const current = normalizeSubcategories(category.subcategories);
    const alreadyExists = current.some(
      (item) => normalizeForTitleComparison(item) === normalizeForTitleComparison(normalizedName),
    );

    if (alreadyExists) {
      return;
    }

    const next = [...current, normalizedName];
    await categoriesRepository.update(categoryId, {
      subcategoryCount: next.length,
      subcategories: next,
    });
  }

  private async removeGoalSubcategoryIfUnused(
    categoryId: string,
    subcategoryName: string,
    remainingGoals: GoalPlanItem[],
  ): Promise<void> {
    const normalizedTarget = normalizeForTitleComparison(subcategoryName);
    const isStillUsed = remainingGoals.some(
      (goal) => normalizeForTitleComparison(goal.title) === normalizedTarget,
    );

    if (isStillUsed) {
      return;
    }

    const category = await categoriesRepository.getById(categoryId);
    if (!category) {
      return;
    }

    const current = normalizeSubcategories(category.subcategories);
    const next = current.filter(
      (item) => normalizeForTitleComparison(item) !== normalizedTarget,
    );

    if (next.length === current.length) {
      return;
    }

    await categoriesRepository.update(categoryId, {
      subcategoryCount: next.length,
      subcategories: next,
    });
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

import type {
  CategoriesRepository,
  CategoryItem,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "@/domain/categories/repository";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.categories";
const PROTECTED_CATEGORY_NAMES = new Set(["tarjeta de credito"]);

interface CategoriesStorageV1 {
  version: typeof STORAGE_VERSION;
  items: CategoryItem[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: "category_food",
    name: "Alimentación",
    icon: "fork-knife",
    iconBg: "bg-[#DC2626]",
    subcategoryCount: 0,
  },
  {
    id: "category_transport",
    name: "Transporte",
    icon: "car",
    iconBg: "bg-[#2563EB]",
    subcategoryCount: 0,
  },
  {
    id: "category_services",
    name: "Servicios",
    icon: "wrench",
    iconBg: "bg-[#0891B2]",
    subcategoryCount: 0,
  },
];

const cloneCategory = (category: CategoryItem): CategoryItem => ({
  ...category,
  subcategories: category.subcategories ? [...category.subcategories] : undefined,
});

const cloneCategories = (categories: CategoryItem[]): CategoryItem[] =>
  categories.map(cloneCategory);

const buildInitialState = (): CategoriesStorageV1 => ({
  version: STORAGE_VERSION,
  items: cloneCategories(DEFAULT_CATEGORIES),
});

const normalizeCategoryName = (name: string): string => {
  const normalized = name.trim();
  if (!normalized) {
    throw new Error("Category name is required.");
  }

  return normalized;
};

const normalizeSubcategories = (subcategories: string[] | undefined): string[] | undefined => {
  if (!subcategories || subcategories.length === 0) {
    return undefined;
  }

  const unique = Array.from(
    new Set(
      subcategories
        .map((subcategory) => subcategory.trim())
        .filter((subcategory) => subcategory.length > 0),
    ),
  );

  return unique.length > 0 ? unique : undefined;
};

const isProtectedCategory = (category: CategoryItem): boolean => {
  return PROTECTED_CATEGORY_NAMES.has(category.name.trim().toLocaleLowerCase("es-ES"));
};

const isCategoryItem = (value: unknown): value is CategoryItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<CategoryItem>;
  const hasValidSubcategories =
    item.subcategories === undefined ||
    (Array.isArray(item.subcategories) &&
      item.subcategories.every((subcategory) => typeof subcategory === "string"));

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.icon === "string" &&
    typeof item.iconBg === "string" &&
    typeof item.subcategoryCount === "number" &&
    Number.isFinite(item.subcategoryCount) &&
    item.subcategoryCount >= 0 &&
    hasValidSubcategories
  );
};

const isStorageShape = (value: unknown): value is CategoriesStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<CategoriesStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isCategoryItem)
  );
};

const createCategoryId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `category_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

export class LocalStorageCategoriesRepository implements CategoriesRepository {
  private readonly storageKey: string;

  private memoryState: CategoriesStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<CategoryItem[]> {
    return cloneCategories(this.readState().items);
  }

  public async getById(id: string): Promise<CategoryItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneCategory(found) : null;
  }

  public async create(input: CreateCategoryInput): Promise<CategoryItem> {
    const state = this.readState();
    const name = normalizeCategoryName(input.name);
    const created: CategoryItem = {
      id: createCategoryId(),
      name,
      icon: input.icon ?? "tag",
      iconBg: input.iconBg ?? "bg-[#71717A]",
      subcategoryCount: 0,
    };

    state.items.push(created);
    this.writeState(state);

    return cloneCategory(created);
  }

  public async update(id: string, patch: UpdateCategoryPatch): Promise<CategoryItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const normalizedSubcategories = patch.subcategories === undefined
      ? state.items[index].subcategories
      : normalizeSubcategories(patch.subcategories);
    const normalizedSubcategoryCount = patch.subcategoryCount === undefined
      ? (patch.subcategories === undefined
        ? state.items[index].subcategoryCount
        : (normalizedSubcategories?.length ?? 0))
      : Math.max(0, Math.floor(patch.subcategoryCount));

    const updated: CategoryItem = {
      ...state.items[index],
      ...(patch.name ? { name: normalizeCategoryName(patch.name) } : {}),
      ...(patch.icon ? { icon: patch.icon } : {}),
      ...(patch.iconBg ? { iconBg: patch.iconBg } : {}),
      subcategoryCount: normalizedSubcategoryCount,
      subcategories: normalizedSubcategories,
    };

    state.items[index] = updated;
    this.writeState(state);

    return cloneCategory(updated);
  }

  public async remove(id: string): Promise<boolean> {
    const state = this.readState();
    const target = state.items.find((item) => item.id === id);
    if (!target || isProtectedCategory(target)) {
      return false;
    }

    const filtered = state.items.filter((item) => item.id !== id);

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

  private readState(): CategoriesStorageV1 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneCategories(this.memoryState.items),
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
          items: cloneCategories(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: CategoriesStorageV1): void {
    const next: CategoriesStorageV1 = {
      version: state.version,
      items: cloneCategories(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const categoriesRepository: CategoriesRepository =
  new LocalStorageCategoriesRepository();

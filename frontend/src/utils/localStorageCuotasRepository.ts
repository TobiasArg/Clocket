import type {
  CreateCuotaInput,
  CuotaPlanItem,
  CuotasRepository,
  UpdateCuotaPatch,
} from "@/utils";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.cuotas";
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const YEAR_MONTH_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface CuotasStorageV1 {
  version: typeof STORAGE_VERSION;
  items: CuotaPlanItem[];
}

const buildInitialState = (): CuotasStorageV1 => ({
  version: STORAGE_VERSION,
  items: [],
});

const toYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const toCurrencyNumber = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const normalizeTitle = (value?: string): string => {
  const title = value?.trim();
  return title && title.length > 0 ? title : "Nueva cuota";
};

const normalizeDescription = (value?: string): string | undefined => {
  const description = value?.trim();
  return description && description.length > 0 ? description : undefined;
};

const normalizeCategoryId = (value?: string): string | undefined => {
  const categoryId = value?.trim();
  return categoryId && categoryId.length > 0 ? categoryId : undefined;
};

const normalizeInstallmentsCount = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Installments count must be a valid number.");
  }

  const normalized = Math.floor(value);
  if (normalized < 1) {
    throw new Error("Installments count must be at least 1.");
  }

  return normalized;
};

const normalizeTotalAmount = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Total amount must be a valid number.");
  }

  if (value <= 0) {
    throw new Error("Total amount must be greater than 0.");
  }

  return toCurrencyNumber(value);
};

const normalizePaidInstallmentsCount = (
  value: number | undefined,
  installmentsCount: number,
): number => {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    throw new Error("Paid installments count must be a valid number.");
  }

  const normalized = Math.max(0, Math.floor(value));
  return Math.min(normalized, installmentsCount);
};

const normalizeStartMonth = (value?: string): string => {
  const raw = value?.trim();
  if (!raw) {
    return toYearMonth(new Date());
  }

  const match = YEAR_MONTH_PATTERN.exec(raw);
  if (!match) {
    throw new Error("Start month must use YYYY-MM format.");
  }

  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error("Start month must use YYYY-MM format.");
  }

  return raw;
};

const normalizeCreatedAt = (value?: string): string => {
  const raw = value?.trim();
  if (!raw) {
    return new Date().toISOString();
  }

  const yearMonthDayMatch = YEAR_MONTH_DAY_PATTERN.exec(raw);
  if (yearMonthDayMatch) {
    const year = Number(yearMonthDayMatch[0].slice(0, 4));
    const month = Number(yearMonthDayMatch[0].slice(5, 7));
    const day = Number(yearMonthDayMatch[0].slice(8, 10));
    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    const isValidLocalDate = localDate.getFullYear() === year &&
      localDate.getMonth() + 1 === month &&
      localDate.getDate() === day;
    if (!isValidLocalDate) {
      throw new Error("Created date must be a valid date.");
    }

    return localDate.toISOString();
  }

  const dateCandidate = new Date(raw);
  if (Number.isNaN(dateCandidate.getTime())) {
    throw new Error("Created date must be a valid date.");
  }

  return dateCandidate.toISOString();
};

const calculateInstallmentAmount = (
  totalAmount: number,
  installmentsCount: number,
): number => {
  return toCurrencyNumber(totalAmount / installmentsCount);
};

const createCuotaId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cuota_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const normalizeForCreate = (input: CreateCuotaInput): CuotaPlanItem => {
  const totalAmount = normalizeTotalAmount(input.totalAmount);
  const installmentsCount = normalizeInstallmentsCount(input.installmentsCount);
  const paidInstallmentsCount = normalizePaidInstallmentsCount(
    input.paidInstallmentsCount,
    installmentsCount,
  );
  const createdAt = normalizeCreatedAt(input.createdAt);

  return {
    id: createCuotaId(),
    title: normalizeTitle(input.title),
    description: normalizeDescription(input.description),
    totalAmount,
    installmentsCount,
    installmentAmount: calculateInstallmentAmount(totalAmount, installmentsCount),
    startMonth: normalizeStartMonth(input.startMonth),
    paidInstallmentsCount,
    categoryId: normalizeCategoryId(input.categoryId),
    createdAt,
    updatedAt: createdAt,
  };
};

const normalizeForUpdate = (
  current: CuotaPlanItem,
  patch: UpdateCuotaPatch,
): CuotaPlanItem => {
  const totalAmount =
    patch.totalAmount === undefined
      ? current.totalAmount
      : normalizeTotalAmount(patch.totalAmount);
  const installmentsCount =
    patch.installmentsCount === undefined
      ? current.installmentsCount
      : normalizeInstallmentsCount(patch.installmentsCount);
  const paidInstallmentsCount =
    patch.paidInstallmentsCount === undefined
      ? Math.min(current.paidInstallmentsCount, installmentsCount)
      : normalizePaidInstallmentsCount(patch.paidInstallmentsCount, installmentsCount);

  return {
    ...current,
    ...(patch.title !== undefined ? { title: normalizeTitle(patch.title) } : {}),
    ...(patch.description !== undefined
      ? { description: normalizeDescription(patch.description) }
      : {}),
    ...(patch.categoryId !== undefined
      ? { categoryId: normalizeCategoryId(patch.categoryId) }
      : {}),
    ...(patch.startMonth !== undefined
      ? { startMonth: normalizeStartMonth(patch.startMonth) }
      : {}),
    totalAmount,
    installmentsCount,
    paidInstallmentsCount,
    installmentAmount: calculateInstallmentAmount(totalAmount, installmentsCount),
    updatedAt: new Date().toISOString(),
  };
};

const cloneCuota = (item: CuotaPlanItem): CuotaPlanItem => ({ ...item });
const cloneCuotas = (items: CuotaPlanItem[]): CuotaPlanItem[] => items.map(cloneCuota);

const isCuotaPlanItem = (value: unknown): value is CuotaPlanItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<CuotaPlanItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    (item.description === undefined || typeof item.description === "string") &&
    typeof item.totalAmount === "number" &&
    Number.isFinite(item.totalAmount) &&
    typeof item.installmentsCount === "number" &&
    Number.isFinite(item.installmentsCount) &&
    typeof item.installmentAmount === "number" &&
    Number.isFinite(item.installmentAmount) &&
    typeof item.startMonth === "string" &&
    YEAR_MONTH_PATTERN.test(item.startMonth) &&
    typeof item.paidInstallmentsCount === "number" &&
    Number.isFinite(item.paidInstallmentsCount) &&
    (item.categoryId === undefined || typeof item.categoryId === "string") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShape = (value: unknown): value is CuotasStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<CuotasStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isCuotaPlanItem)
  );
};

export class LocalStorageCuotasRepository implements CuotasRepository {
  private readonly storageKey: string;

  private memoryState: CuotasStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<CuotaPlanItem[]> {
    return cloneCuotas(this.readState().items);
  }

  public async getById(id: string): Promise<CuotaPlanItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneCuota(found) : null;
  }

  public async create(input: CreateCuotaInput): Promise<CuotaPlanItem> {
    const state = this.readState();
    const created = normalizeForCreate(input);

    state.items.push(created);
    this.writeState(state);

    return cloneCuota(created);
  }

  public async update(id: string, patch: UpdateCuotaPatch): Promise<CuotaPlanItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = normalizeForUpdate(state.items[index], patch);
    state.items[index] = updated;
    this.writeState(state);

    return cloneCuota(updated);
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

  private readState(): CuotasStorageV1 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneCuotas(this.memoryState.items),
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
          items: cloneCuotas(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: CuotasStorageV1): void {
    const next: CuotasStorageV1 = {
      version: state.version,
      items: cloneCuotas(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const cuotasRepository: CuotasRepository = new LocalStorageCuotasRepository();

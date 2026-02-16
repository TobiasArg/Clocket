import { TRANSACTIONS_CHANGED_EVENT } from "@/utils";
import type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "@/utils";
import { DEFAULT_ACCOUNT_ID } from "./accountsRepository";

const LEGACY_STORAGE_VERSION_1 = 1 as const;
const LEGACY_STORAGE_VERSION_2 = 2 as const;
const LEGACY_STORAGE_VERSION_3 = 3 as const;
const DEFAULT_STORAGE_KEY = "clocket.transactions";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TRANSACTION_TYPE_REGULAR = "regular" as const;
const TRANSACTION_TYPE_SAVING = "saving" as const;
const TRANSACTION_TYPES = new Set([TRANSACTION_TYPE_REGULAR, TRANSACTION_TYPE_SAVING]);

const STORAGE_VERSION_V4 = 4 as const;

interface LegacyTransactionItem extends Omit<TransactionItem, "date" | "accountId" | "transactionType" | "goalId"> {
  accountId?: string;
  transactionType?: string;
  goalId?: string;
  date?: string;
}

interface TransactionsStorageV1 {
  version: typeof LEGACY_STORAGE_VERSION_1;
  items: LegacyTransactionItem[];
}

interface TransactionsStorageV2 {
  version: typeof LEGACY_STORAGE_VERSION_2;
  items: LegacyTransactionItem[];
}

interface TransactionsStorageV3 {
  version: typeof LEGACY_STORAGE_VERSION_3;
  items: LegacyTransactionItem[];
}

interface TransactionsStorageV4 {
  version: typeof STORAGE_VERSION_V4;
  items: TransactionItem[];
}

const cloneItem = (item: TransactionItem): TransactionItem => ({ ...item });
const cloneItems = (items: TransactionItem[]): TransactionItem[] => items.map(cloneItem);

const buildInitialState = (): TransactionsStorageV4 => ({
  version: STORAGE_VERSION_V4,
  items: [],
});

const toLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateCandidate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (ISO_DATE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toLocalIsoDate(parsed);
};

const parseDateFromMeta = (meta: string): string | null => {
  const isoDate = meta.split(" • ")[0]?.trim();
  if (!isoDate || !ISO_DATE_PATTERN.test(isoDate)) {
    return null;
  }

  return isoDate;
};

const normalizeMetaWithDate = (meta: string, date: string): string => {
  const trimmed = meta.trim();
  if (!trimmed) {
    return date;
  }

  const parts = trimmed.split(" • ");
  const firstPart = parts[0]?.trim();
  if (firstPart && ISO_DATE_PATTERN.test(firstPart)) {
    const detail = parts.slice(1).join(" • ").trim();
    return detail ? `${date} • ${detail}` : date;
  }

  return `${date} • ${trimmed}`;
};

const normalizeAccountId = (value?: string): string => {
  const normalized = value?.trim();
  if (normalized) {
    return normalized;
  }

  return DEFAULT_ACCOUNT_ID;
};

const normalizeTransactionType = (value?: string): TransactionItem["transactionType"] => {
  return value && TRANSACTION_TYPES.has(value as TransactionItem["transactionType"])
    ? value as TransactionItem["transactionType"]
    : TRANSACTION_TYPE_REGULAR;
};

const normalizeGoalId = (
  value: string | undefined,
  transactionType: TransactionItem["transactionType"],
): string | undefined => {
  if (transactionType !== TRANSACTION_TYPE_SAVING) {
    return undefined;
  }

  const normalized = value?.trim();
  if (!normalized || normalized.length === 0) {
    throw new Error("Saving transactions require a goalId.");
  }

  return normalized;
};

const getNormalizedDate = (item: { date?: string; createdAt?: string; meta: string }): string => {
  return (
    (item.date ? parseDateCandidate(item.date) : null) ??
    (item.createdAt ? parseDateCandidate(item.createdAt) : null) ??
    parseDateFromMeta(item.meta) ??
    toLocalIsoDate(new Date())
  );
};

const normalizeTransactionItem = (
  item: Omit<TransactionItem, "date" | "meta" | "accountId"> & {
    accountId?: string;
    transactionType?: string;
    goalId?: string;
    date?: string;
    meta: string;
  },
): TransactionItem => {
  const date = getNormalizedDate(item);
  const transactionType = normalizeTransactionType(item.transactionType);
  return {
    ...item,
    accountId: normalizeAccountId(item.accountId),
    transactionType,
    goalId: normalizeGoalId(item.goalId, transactionType),
    date,
    // `meta` always stores a date prefix to keep transaction metadata predictable.
    meta: normalizeMetaWithDate(item.meta, date),
  };
};

const isLegacyTransactionItem = (value: unknown): value is LegacyTransactionItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<LegacyTransactionItem>;
  return (
    typeof item.id === "string" &&
    typeof item.icon === "string" &&
    typeof item.iconBg === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    (item.accountId === undefined || typeof item.accountId === "string") &&
    (item.transactionType === undefined || typeof item.transactionType === "string") &&
    (item.goalId === undefined || typeof item.goalId === "string") &&
    (item.categoryId === undefined || typeof item.categoryId === "string") &&
    (item.subcategoryName === undefined || typeof item.subcategoryName === "string") &&
    (item.cuotaPlanId === undefined || typeof item.cuotaPlanId === "string") &&
    (item.cuotaInstallmentIndex === undefined ||
      (typeof item.cuotaInstallmentIndex === "number" &&
        Number.isFinite(item.cuotaInstallmentIndex))) &&
    (item.cuotaInstallmentsCount === undefined ||
      (typeof item.cuotaInstallmentsCount === "number" &&
        Number.isFinite(item.cuotaInstallmentsCount))) &&
    (item.date === undefined || typeof item.date === "string") &&
    (item.createdAt === undefined || typeof item.createdAt === "string") &&
    typeof item.amount === "string" &&
    typeof item.amountColor === "string" &&
    typeof item.meta === "string"
  );
};

const isTransactionItem = (value: unknown): value is TransactionItem => {
  if (!isLegacyTransactionItem(value)) {
    return false;
  }

  return (
    typeof value.date === "string" &&
    ISO_DATE_PATTERN.test(value.date) &&
    typeof value.accountId === "string" &&
    value.accountId.trim().length > 0 &&
    typeof value.transactionType === "string" &&
    TRANSACTION_TYPES.has(value.transactionType as TransactionItem["transactionType"]) &&
    (value.transactionType !== TRANSACTION_TYPE_SAVING ||
      (typeof value.goalId === "string" && value.goalId.trim().length > 0))
  );
};

const isStorageShapeV1 = (value: unknown): value is TransactionsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<TransactionsStorageV1>;
  return (
    state.version === LEGACY_STORAGE_VERSION_1 &&
    Array.isArray(state.items) &&
    state.items.every(isLegacyTransactionItem)
  );
};

const isStorageShapeV2 = (value: unknown): value is TransactionsStorageV2 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<TransactionsStorageV2>;
  return (
    state.version === LEGACY_STORAGE_VERSION_2 &&
    Array.isArray(state.items) &&
    state.items.every(isLegacyTransactionItem)
  );
};

const isStorageShapeV3 = (value: unknown): value is TransactionsStorageV3 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<TransactionsStorageV3>;
  return (
    state.version === LEGACY_STORAGE_VERSION_3 &&
    Array.isArray(state.items) &&
    state.items.every(isLegacyTransactionItem)
  );
};

const isStorageShapeV4 = (value: unknown): value is TransactionsStorageV4 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<TransactionsStorageV4>;
  return (
    state.version === STORAGE_VERSION_V4 &&
    Array.isArray(state.items) &&
    state.items.every(isTransactionItem)
  );
};

const migrateStorageV1 = (state: TransactionsStorageV1): TransactionsStorageV4 => {
  return {
    version: STORAGE_VERSION_V4,
    items: state.items.map((item) => normalizeTransactionItem(item)),
  };
};

const migrateStorageV2 = (state: TransactionsStorageV2): TransactionsStorageV4 => {
  return {
    version: STORAGE_VERSION_V4,
    items: state.items.map((item) => normalizeTransactionItem(item)),
  };
};

const migrateStorageV3 = (state: TransactionsStorageV3): TransactionsStorageV4 => {
  return {
    version: STORAGE_VERSION_V4,
    items: state.items.map((item) => normalizeTransactionItem(item)),
  };
};

const createTransactionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tx_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

export class LocalStorageTransactionsRepository implements TransactionsRepository {
  private readonly storageKey: string;

  private memoryState: TransactionsStorageV4;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<TransactionItem[]> {
    return cloneItems(this.readState().items);
  }

  public async getById(id: string): Promise<TransactionItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneItem(found) : null;
  }

  public async create(input: CreateTransactionInput): Promise<TransactionItem> {
    const state = this.readState();
    const created = normalizeTransactionItem({
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString(),
      id: createTransactionId(),
    });

    state.items.push(created);
    this.writeState(state);

    return cloneItem(created);
  }

  public async update(id: string, patch: UpdateTransactionPatch): Promise<TransactionItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = normalizeTransactionItem({
      ...state.items[index],
      ...patch,
    });

    state.items[index] = updated;
    this.writeState(state);

    return cloneItem(updated);
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

  private readState(): TransactionsStorageV4 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneItems(this.memoryState.items),
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
      if (isStorageShapeV4(parsed)) {
        return {
          version: parsed.version,
          items: cloneItems(parsed.items),
        };
      }

      if (isStorageShapeV1(parsed)) {
        const migrated = migrateStorageV1(parsed);
        this.writeState(migrated);
        return migrated;
      }

      if (isStorageShapeV2(parsed)) {
        const migrated = migrateStorageV2(parsed);
        this.writeState(migrated);
        return migrated;
      }

      if (isStorageShapeV3(parsed)) {
        const migrated = migrateStorageV3(parsed);
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

  private writeState(state: TransactionsStorageV4): void {
    const next: TransactionsStorageV4 = {
      version: state.version,
      items: cloneItems(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
    }
  }
}

export const transactionsRepository: TransactionsRepository =
  new LocalStorageTransactionsRepository();

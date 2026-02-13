import type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "@/utils";

const STORAGE_VERSION = 2 as const;
const LEGACY_STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.transactions";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface LegacyTransactionItem extends Omit<TransactionItem, "date"> {
  date?: string;
}

interface TransactionsStorageV1 {
  version: typeof LEGACY_STORAGE_VERSION;
  items: LegacyTransactionItem[];
}

interface TransactionsStorageV2 {
  version: typeof STORAGE_VERSION;
  items: TransactionItem[];
}

const cloneItem = (item: TransactionItem): TransactionItem => ({ ...item });
const cloneItems = (items: TransactionItem[]): TransactionItem[] => items.map(cloneItem);

const buildInitialState = (): TransactionsStorageV2 => ({
  version: STORAGE_VERSION,
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

const getNormalizedDate = (item: { date?: string; createdAt?: string; meta: string }): string => {
  return (
    (item.date ? parseDateCandidate(item.date) : null) ??
    (item.createdAt ? parseDateCandidate(item.createdAt) : null) ??
    parseDateFromMeta(item.meta) ??
    toLocalIsoDate(new Date())
  );
};

const normalizeTransactionItem = (
  item: Omit<TransactionItem, "date" | "meta"> & { date?: string; meta: string },
): TransactionItem => {
  const date = getNormalizedDate(item);
  return {
    ...item,
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
    (item.categoryId === undefined || typeof item.categoryId === "string") &&
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

  return typeof value.date === "string" && ISO_DATE_PATTERN.test(value.date);
};

const isStorageShapeV1 = (value: unknown): value is TransactionsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<TransactionsStorageV1>;
  return (
    state.version === LEGACY_STORAGE_VERSION &&
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
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isTransactionItem)
  );
};

const migrateStorageV1 = (state: TransactionsStorageV1): TransactionsStorageV2 => {
  return {
    version: STORAGE_VERSION,
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

  private memoryState: TransactionsStorageV2;

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

  private readState(): TransactionsStorageV2 {
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
      if (isStorageShapeV2(parsed)) {
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
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: TransactionsStorageV2): void {
    const next: TransactionsStorageV2 = {
      version: state.version,
      items: cloneItems(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const transactionsRepository: TransactionsRepository =
  new LocalStorageTransactionsRepository();

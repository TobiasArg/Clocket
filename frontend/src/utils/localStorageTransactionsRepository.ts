import type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "@/utils";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.transactions";

interface TransactionsStorageV1 {
  version: typeof STORAGE_VERSION;
  items: TransactionItem[];
}

const cloneItem = (item: TransactionItem): TransactionItem => ({ ...item });
const cloneItems = (items: TransactionItem[]): TransactionItem[] => items.map(cloneItem);

const buildInitialState = (): TransactionsStorageV1 => ({
  version: STORAGE_VERSION,
  items: [],
});

const isTransactionItem = (value: unknown): value is TransactionItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<TransactionItem>;
  return (
    typeof item.id === "string" &&
    typeof item.icon === "string" &&
    typeof item.iconBg === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    (item.categoryId === undefined || typeof item.categoryId === "string") &&
    typeof item.amount === "string" &&
    typeof item.amountColor === "string" &&
    typeof item.meta === "string"
  );
};

const isStorageShape = (value: unknown): value is TransactionsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<TransactionsStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isTransactionItem)
  );
};

const createTransactionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tx_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

export class LocalStorageTransactionsRepository implements TransactionsRepository {
  private readonly storageKey: string;

  private memoryState: TransactionsStorageV1;

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
    const created: TransactionItem = {
      ...input,
      id: createTransactionId(),
    };

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

    const updated: TransactionItem = {
      ...state.items[index],
      ...patch,
    };

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

  private readState(): TransactionsStorageV1 {
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
      if (isStorageShape(parsed)) {
        return {
          version: parsed.version,
          items: cloneItems(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: TransactionsStorageV1): void {
    const next: TransactionsStorageV1 = {
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

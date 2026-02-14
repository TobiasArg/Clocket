import type {
  AccountItem,
  AccountsRepository,
  CreateAccountInput,
  UpdateAccountPatch,
} from "@/utils";
import { DEFAULT_ACCOUNT_ID, DEFAULT_ACCOUNT_NAME } from "./accountsRepository";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.accounts";

interface AccountsStorageV1 {
  version: typeof STORAGE_VERSION;
  items: AccountItem[];
}

const buildInitialState = (): AccountsStorageV1 => ({
  version: STORAGE_VERSION,
  items: [
    {
      id: DEFAULT_ACCOUNT_ID,
      name: DEFAULT_ACCOUNT_NAME,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
});

const cloneAccount = (item: AccountItem): AccountItem => ({ ...item });
const cloneAccounts = (items: AccountItem[]): AccountItem[] => items.map(cloneAccount);

const normalizeName = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Account name is required.");
  }

  return normalized;
};

const normalizeBalance = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Account balance must be a valid number.");
  }

  return Math.round(value * 100) / 100;
};

const createAccountId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `account_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const isAccountItem = (value: unknown): value is AccountItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<AccountItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.balance === "number" &&
    Number.isFinite(item.balance) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShape = (value: unknown): value is AccountsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<AccountsStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isAccountItem)
  );
};

const buildCreatedAccount = (input: CreateAccountInput): AccountItem => {
  const nowIso = new Date().toISOString();

  return {
    id: createAccountId(),
    name: normalizeName(input.name),
    balance: normalizeBalance(input.balance),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const buildUpdatedAccount = (
  current: AccountItem,
  patch: UpdateAccountPatch,
): AccountItem => {
  return {
    ...current,
    ...(patch.name !== undefined ? { name: normalizeName(patch.name) } : {}),
    ...(patch.balance !== undefined
      ? { balance: normalizeBalance(patch.balance) }
      : {}),
    updatedAt: new Date().toISOString(),
  };
};

export class LocalStorageAccountsRepository implements AccountsRepository {
  private readonly storageKey: string;

  private memoryState: AccountsStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<AccountItem[]> {
    return cloneAccounts(this.readState().items);
  }

  public async getById(id: string): Promise<AccountItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneAccount(found) : null;
  }

  public async create(input: CreateAccountInput): Promise<AccountItem> {
    const state = this.readState();
    const created = buildCreatedAccount(input);

    state.items.push(created);
    this.writeState(state);

    return cloneAccount(created);
  }

  public async update(id: string, patch: UpdateAccountPatch): Promise<AccountItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = buildUpdatedAccount(state.items[index], patch);
    state.items[index] = updated;
    this.writeState(state);

    return cloneAccount(updated);
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

  private readState(): AccountsStorageV1 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneAccounts(this.memoryState.items),
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
          items: cloneAccounts(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: AccountsStorageV1): void {
    const next: AccountsStorageV1 = {
      version: state.version,
      items: cloneAccounts(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const accountsRepository: AccountsRepository =
  new LocalStorageAccountsRepository();

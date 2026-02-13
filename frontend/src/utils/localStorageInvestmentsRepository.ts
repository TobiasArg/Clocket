import type {
  CreateInvestmentInput,
  InvestmentPositionItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "@/utils";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.investments";

interface InvestmentsStorageV1 {
  version: typeof STORAGE_VERSION;
  items: InvestmentPositionItem[];
}

const buildInitialState = (): InvestmentsStorageV1 => ({
  version: STORAGE_VERSION,
  items: [],
});

const clonePosition = (item: InvestmentPositionItem): InvestmentPositionItem => ({ ...item });
const clonePositions = (items: InvestmentPositionItem[]): InvestmentPositionItem[] =>
  items.map(clonePosition);

const normalizeText = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
};

const normalizeNumber = (value: number, field: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be greater than 0.`);
  }

  return Math.round(value * 10000) / 10000;
};

const createInvestmentId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `inv_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const isInvestmentItem = (value: unknown): value is InvestmentPositionItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<InvestmentPositionItem>;
  return (
    typeof item.id === "string" &&
    typeof item.ticker === "string" &&
    typeof item.name === "string" &&
    typeof item.exchange === "string" &&
    typeof item.shares === "number" &&
    Number.isFinite(item.shares) &&
    typeof item.costBasis === "number" &&
    Number.isFinite(item.costBasis) &&
    typeof item.currentPrice === "number" &&
    Number.isFinite(item.currentPrice) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShape = (value: unknown): value is InvestmentsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<InvestmentsStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isInvestmentItem)
  );
};

const buildCreatedPosition = (input: CreateInvestmentInput): InvestmentPositionItem => {
  const nowIso = new Date().toISOString();
  return {
    id: createInvestmentId(),
    ticker: normalizeText(input.ticker, "Ticker").toUpperCase(),
    name: normalizeText(input.name, "Name"),
    exchange: input.exchange?.trim() || "CUSTOM",
    shares: normalizeNumber(input.shares, "Shares"),
    costBasis: normalizeNumber(input.costBasis, "Cost basis"),
    currentPrice: normalizeNumber(input.currentPrice, "Current price"),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const buildUpdatedPosition = (
  current: InvestmentPositionItem,
  patch: UpdateInvestmentPatch,
): InvestmentPositionItem => {
  return {
    ...current,
    ...(patch.ticker !== undefined
      ? { ticker: normalizeText(patch.ticker, "Ticker").toUpperCase() }
      : {}),
    ...(patch.name !== undefined ? { name: normalizeText(patch.name, "Name") } : {}),
    ...(patch.exchange !== undefined
      ? { exchange: patch.exchange.trim() || "CUSTOM" }
      : {}),
    ...(patch.shares !== undefined
      ? { shares: normalizeNumber(patch.shares, "Shares") }
      : {}),
    ...(patch.costBasis !== undefined
      ? { costBasis: normalizeNumber(patch.costBasis, "Cost basis") }
      : {}),
    ...(patch.currentPrice !== undefined
      ? { currentPrice: normalizeNumber(patch.currentPrice, "Current price") }
      : {}),
    updatedAt: new Date().toISOString(),
  };
};

export class LocalStorageInvestmentsRepository implements InvestmentsRepository {
  private readonly storageKey: string;

  private memoryState: InvestmentsStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<InvestmentPositionItem[]> {
    return clonePositions(this.readState().items);
  }

  public async getById(id: string): Promise<InvestmentPositionItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? clonePosition(found) : null;
  }

  public async create(input: CreateInvestmentInput): Promise<InvestmentPositionItem> {
    const state = this.readState();
    const created = buildCreatedPosition(input);

    state.items.push(created);
    this.writeState(state);

    return clonePosition(created);
  }

  public async update(
    id: string,
    patch: UpdateInvestmentPatch,
  ): Promise<InvestmentPositionItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const updated = buildUpdatedPosition(state.items[index], patch);
    state.items[index] = updated;
    this.writeState(state);

    return clonePosition(updated);
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

  private readState(): InvestmentsStorageV1 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: clonePositions(this.memoryState.items),
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
          items: clonePositions(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: InvestmentsStorageV1): void {
    const next: InvestmentsStorageV1 = {
      version: state.version,
      items: clonePositions(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const investmentsRepository: InvestmentsRepository =
  new LocalStorageInvestmentsRepository();

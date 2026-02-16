import type {
  CreateInvestmentInput,
  InvestmentPositionItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "@/domain/investments/repository";

const LEGACY_STORAGE_VERSION = 1 as const;
const STORAGE_VERSION = 2 as const;
const DEFAULT_STORAGE_KEY = "clocket.investments";

interface LegacyInvestmentPositionItem {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface InvestmentsStorageV1 {
  version: typeof LEGACY_STORAGE_VERSION;
  items: LegacyInvestmentPositionItem[];
}

interface InvestmentsStorageV2 {
  version: typeof STORAGE_VERSION;
  items: InvestmentPositionItem[];
}

const buildInitialState = (): InvestmentsStorageV2 => ({
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

const normalizePriceSource = (
  value: "market" | "manual" | undefined,
): "market" | "manual" => {
  return value === "manual" ? "manual" : "market";
};

const createInvestmentId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `inv_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const isLegacyInvestmentItem = (value: unknown): value is LegacyInvestmentPositionItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<LegacyInvestmentPositionItem>;
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

const isInvestmentItem = (value: unknown): value is InvestmentPositionItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<InvestmentPositionItem>;
  return (
    isLegacyInvestmentItem(value) &&
    (
      item.priceSource === "market" ||
      (
        item.priceSource === "manual" &&
        typeof item.manualPrice === "number" &&
        Number.isFinite(item.manualPrice) &&
        item.manualPrice > 0
      )
    )
  );
};

const isStorageShapeV1 = (value: unknown): value is InvestmentsStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<InvestmentsStorageV1>;
  return (
    state.version === LEGACY_STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isLegacyInvestmentItem)
  );
};

const isStorageShapeV2 = (value: unknown): value is InvestmentsStorageV2 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<InvestmentsStorageV2>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isInvestmentItem)
  );
};

const migrateStorageV1 = (state: InvestmentsStorageV1): InvestmentsStorageV2 => ({
  version: STORAGE_VERSION,
  items: state.items.map((item) => ({
    ...item,
    priceSource: "market",
    manualPrice: undefined,
  })),
});

const buildCreatedPosition = (input: CreateInvestmentInput): InvestmentPositionItem => {
  const nowIso = new Date().toISOString();
  const priceSource = normalizePriceSource(input.priceSource);
  const normalizedShares = normalizeNumber(input.shares, "Shares");
  const normalizedCostBasis = normalizeNumber(input.costBasis, "Cost basis");
  const normalizedManualPrice = input.manualPrice !== undefined
    ? normalizeNumber(input.manualPrice, "Manual price")
    : undefined;

  if (priceSource === "manual" && normalizedManualPrice === undefined) {
    throw new Error("Manual positions require a manual price.");
  }

  const normalizedCurrentPrice = normalizeNumber(
    input.currentPrice ?? normalizedManualPrice ?? normalizedCostBasis,
    "Current price",
  );

  return {
    id: createInvestmentId(),
    ticker: normalizeText(input.ticker, "Ticker").toUpperCase(),
    name: normalizeText(input.name, "Name"),
    exchange: input.exchange?.trim() || "CUSTOM",
    shares: normalizedShares,
    costBasis: normalizedCostBasis,
    currentPrice: normalizedCurrentPrice,
    priceSource,
    manualPrice: priceSource === "manual" ? normalizedManualPrice : undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

const buildUpdatedPosition = (
  current: InvestmentPositionItem,
  patch: UpdateInvestmentPatch,
): InvestmentPositionItem => {
  const priceSource = normalizePriceSource(patch.priceSource ?? current.priceSource);
  const shares = patch.shares !== undefined
    ? normalizeNumber(patch.shares, "Shares")
    : current.shares;
  const costBasis = patch.costBasis !== undefined
    ? normalizeNumber(patch.costBasis, "Cost basis")
    : current.costBasis;
  const manualPriceCandidate = patch.manualPrice !== undefined
    ? normalizeNumber(patch.manualPrice, "Manual price")
    : current.manualPrice;
  const currentPriceCandidate = patch.currentPrice !== undefined
    ? normalizeNumber(patch.currentPrice, "Current price")
    : current.currentPrice;

  if (priceSource === "manual" && manualPriceCandidate === undefined) {
    throw new Error("Manual positions require a manual price.");
  }

  return {
    ...current,
    ...(patch.ticker !== undefined
      ? { ticker: normalizeText(patch.ticker, "Ticker").toUpperCase() }
      : {}),
    ...(patch.name !== undefined ? { name: normalizeText(patch.name, "Name") } : {}),
    ...(patch.exchange !== undefined
      ? { exchange: patch.exchange.trim() || "CUSTOM" }
      : {}),
    shares,
    costBasis,
    currentPrice: priceSource === "manual"
      ? (manualPriceCandidate ?? currentPriceCandidate)
      : currentPriceCandidate,
    priceSource,
    manualPrice: priceSource === "manual" ? manualPriceCandidate : undefined,
    updatedAt: new Date().toISOString(),
  };
};

export class LocalStorageInvestmentsRepository implements InvestmentsRepository {
  private readonly storageKey: string;

  private memoryState: InvestmentsStorageV2;

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

  private readState(): InvestmentsStorageV2 {
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
      if (isStorageShapeV2(parsed)) {
        return {
          version: parsed.version,
          items: clonePositions(parsed.items),
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

  private writeState(state: InvestmentsStorageV2): void {
    const next: InvestmentsStorageV2 = {
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

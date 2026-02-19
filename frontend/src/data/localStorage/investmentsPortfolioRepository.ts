import type {
  AddSnapshotInput,
  CreateInvestmentInput,
  InvestmentPositionItem,
  InvestmentSnapshotItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "@/domain/investments/repository";
import type {
  AssetKey,
  AssetRefs,
  AssetType,
} from "@/domain/investments/portfolioTypes";

const POSITIONS_STORAGE_KEY = "investments.positions";
const SNAPSHOTS_STORAGE_KEY = "investments.snapshots";
const REFS_STORAGE_KEY = "investments.refs";

const EMPTY_REFS_MAP: Record<AssetKey, AssetRefs> = {};

const roundNumber = (value: number, decimals = 8): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const parsePositiveNumber = (value: number, field: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be greater than 0.`);
  }

  return roundNumber(value);
};

const normalizeTicker = (ticker: string): string => {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Ticker is required.");
  }

  return normalized;
};

const normalizeAssetType = (assetType: AssetType): AssetType => {
  if (assetType !== "stock" && assetType !== "crypto") {
    throw new Error("Asset type must be 'stock' or 'crypto'.");
  }

  return assetType;
};

const normalizeTimestamp = (value: string | undefined): string => {
  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
};

const createId = (prefix: string): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const toUtcDayKey = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().slice(0, 10)
    : parsed.toISOString().slice(0, 10);
};

const toUtcMonthKey = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().slice(0, 7)
    : parsed.toISOString().slice(0, 7);
};

export const buildAssetKey = (assetType: AssetType, ticker: string): AssetKey => {
  return `${normalizeAssetType(assetType)}:${normalizeTicker(ticker)}`;
};

const clonePosition = (item: InvestmentPositionItem): InvestmentPositionItem => ({ ...item });
const cloneSnapshot = (item: InvestmentSnapshotItem): InvestmentSnapshotItem => ({ ...item });
const cloneRefs = (item: AssetRefs): AssetRefs => ({ ...item });

const isPosition = (value: unknown): value is InvestmentPositionItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<InvestmentPositionItem>;
  return (
    typeof item.id === "string" &&
    (item.assetType === "stock" || item.assetType === "crypto") &&
    typeof item.ticker === "string" &&
    typeof item.usd_gastado === "number" &&
    Number.isFinite(item.usd_gastado) &&
    item.usd_gastado > 0 &&
    typeof item.buy_price === "number" &&
    Number.isFinite(item.buy_price) &&
    item.buy_price > 0 &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    item.amount > 0 &&
    typeof item.createdAt === "string"
  );
};

const isSnapshot = (value: unknown): value is InvestmentSnapshotItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<InvestmentSnapshotItem>;
  return (
    typeof item.id === "string" &&
    (item.assetType === "stock" || item.assetType === "crypto") &&
    typeof item.ticker === "string" &&
    typeof item.timestamp === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price > 0 &&
    (item.source === "GLOBAL_QUOTE" || item.source === "CURRENCY_EXCHANGE_RATE")
  );
};

const isRefs = (value: unknown): value is AssetRefs => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<AssetRefs>;
  return (
    typeof item.dailyRefPrice === "number" &&
    Number.isFinite(item.dailyRefPrice) &&
    item.dailyRefPrice >= 0 &&
    typeof item.dailyRefTimestamp === "string" &&
    typeof item.monthRefPrice === "number" &&
    Number.isFinite(item.monthRefPrice) &&
    item.monthRefPrice >= 0 &&
    typeof item.monthRefTimestamp === "string"
  );
};

const cloneRefsMap = (value: Record<AssetKey, AssetRefs>): Record<AssetKey, AssetRefs> => {
  const next: Record<AssetKey, AssetRefs> = {};
  Object.entries(value).forEach(([key, refs]) => {
    if (isRefs(refs)) {
      next[key as AssetKey] = cloneRefs(refs);
    }
  });
  return next;
};

interface InMemoryState {
  positions: InvestmentPositionItem[];
  snapshots: InvestmentSnapshotItem[];
  refs: Record<AssetKey, AssetRefs>;
}

const createInitialState = (): InMemoryState => ({
  positions: [],
  snapshots: [],
  refs: EMPTY_REFS_MAP,
});

export class LocalStorageInvestmentsPortfolioRepository implements InvestmentsRepository {
  private memoryState: InMemoryState;

  public constructor() {
    this.memoryState = createInitialState();
  }

  public async listPositions(): Promise<InvestmentPositionItem[]> {
    return this.readPositions().map(clonePosition);
  }

  public async getPositionById(id: string): Promise<InvestmentPositionItem | null> {
    const found = this.readPositions().find((item) => item.id === id);
    return found ? clonePosition(found) : null;
  }

  public async addPosition(input: CreateInvestmentInput): Promise<InvestmentPositionItem> {
    const assetType = normalizeAssetType(input.assetType);
    const ticker = normalizeTicker(input.ticker);
    const usd_gastado = parsePositiveNumber(input.usd_gastado, "usd_gastado");
    const buy_price = parsePositiveNumber(input.buy_price, "buy_price");
    const amount = roundNumber(usd_gastado / buy_price);
    const createdAt = normalizeTimestamp(input.createdAt);

    const created: InvestmentPositionItem = {
      id: createId("pos"),
      assetType,
      ticker,
      usd_gastado,
      buy_price,
      amount,
      createdAt,
    };

    const positions = this.readPositions();
    positions.push(created);
    this.writePositions(positions);

    return clonePosition(created);
  }

  public async editPosition(
    id: string,
    patch: UpdateInvestmentPatch,
  ): Promise<InvestmentPositionItem | null> {
    const positions = this.readPositions();
    const index = positions.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const current = positions[index];
    const assetType = patch.assetType !== undefined
      ? normalizeAssetType(patch.assetType)
      : current.assetType;
    const ticker = patch.ticker !== undefined
      ? normalizeTicker(patch.ticker)
      : current.ticker;
    const usd_gastado = patch.usd_gastado !== undefined
      ? parsePositiveNumber(patch.usd_gastado, "usd_gastado")
      : current.usd_gastado;
    const buy_price = patch.buy_price !== undefined
      ? parsePositiveNumber(patch.buy_price, "buy_price")
      : current.buy_price;

    const updated: InvestmentPositionItem = {
      ...current,
      assetType,
      ticker,
      usd_gastado,
      buy_price,
      amount: roundNumber(usd_gastado / buy_price),
      createdAt: patch.createdAt !== undefined
        ? normalizeTimestamp(patch.createdAt)
        : current.createdAt,
    };

    positions[index] = updated;
    this.writePositions(positions);

    return clonePosition(updated);
  }

  public async deletePosition(id: string): Promise<boolean> {
    const positions = this.readPositions();
    const filtered = positions.filter((item) => item.id !== id);

    if (filtered.length === positions.length) {
      return false;
    }

    this.writePositions(filtered);
    return true;
  }

  public async addSnapshot(input: AddSnapshotInput): Promise<InvestmentSnapshotItem> {
    const created: InvestmentSnapshotItem = {
      id: createId("snap"),
      ticker: normalizeTicker(input.ticker),
      assetType: normalizeAssetType(input.assetType),
      timestamp: normalizeTimestamp(input.timestamp),
      price: parsePositiveNumber(input.price, "price"),
      source: input.source,
      ...(input.bid !== undefined ? { bid: parsePositiveNumber(input.bid, "bid") } : {}),
      ...(input.ask !== undefined ? { ask: parsePositiveNumber(input.ask, "ask") } : {}),
    };

    const snapshots = this.readSnapshots();
    snapshots.push(created);
    this.writeSnapshots(snapshots);

    return cloneSnapshot(created);
  }

  public async listSnapshotsByAsset(
    assetType: AssetType,
    ticker: string,
  ): Promise<InvestmentSnapshotItem[]> {
    const key = buildAssetKey(assetType, ticker);
    return this.readSnapshots()
      .filter((item) => buildAssetKey(item.assetType, item.ticker) === key)
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      .map(cloneSnapshot);
  }

  public async getLatestSnapshotByAsset(
    assetType: AssetType,
    ticker: string,
  ): Promise<InvestmentSnapshotItem | null> {
    const byAsset = await this.listSnapshotsByAsset(assetType, ticker);
    const latest = byAsset[byAsset.length - 1] ?? null;
    return latest ? cloneSnapshot(latest) : null;
  }

  public async getOrInitRefs(assetType: AssetType, ticker: string): Promise<AssetRefs> {
    const key = buildAssetKey(assetType, ticker);
    const refsMap = this.readRefsMap();
    const existing = refsMap[key];
    if (existing) {
      return cloneRefs(existing);
    }

    const nowIso = new Date().toISOString();
    const latest = await this.getLatestSnapshotByAsset(assetType, ticker);
    const initial: AssetRefs = {
      dailyRefPrice: latest?.price ?? 0,
      dailyRefTimestamp: latest?.timestamp ?? nowIso,
      monthRefPrice: latest?.price ?? 0,
      monthRefTimestamp: latest?.timestamp ?? nowIso,
    };

    refsMap[key] = initial;
    this.writeRefsMap(refsMap);
    return cloneRefs(initial);
  }

  public async updateDailyRefIfNeeded(
    assetType: AssetType,
    ticker: string,
    currentPrice: number,
    timestamp?: string,
  ): Promise<AssetRefs> {
    const normalizedPrice = parsePositiveNumber(currentPrice, "dailyRefPrice");
    const nowIso = normalizeTimestamp(timestamp);
    const key = buildAssetKey(assetType, ticker);
    const refsMap = this.readRefsMap();
    const refs = refsMap[key] ?? await this.getOrInitRefs(assetType, ticker);

    const shouldUpdate = refs.dailyRefPrice <= 0 ||
      toUtcDayKey(refs.dailyRefTimestamp) !== toUtcDayKey(nowIso);

    if (shouldUpdate) {
      refs.dailyRefPrice = normalizedPrice;
      refs.dailyRefTimestamp = nowIso;
      refsMap[key] = refs;
      this.writeRefsMap(refsMap);
    }

    return cloneRefs(refs);
  }

  public async updateMonthRefIfNeeded(
    assetType: AssetType,
    ticker: string,
    currentPrice: number,
    timestamp?: string,
  ): Promise<AssetRefs> {
    const normalizedPrice = parsePositiveNumber(currentPrice, "monthRefPrice");
    const nowIso = normalizeTimestamp(timestamp);
    const key = buildAssetKey(assetType, ticker);
    const refsMap = this.readRefsMap();
    const refs = refsMap[key] ?? await this.getOrInitRefs(assetType, ticker);

    const shouldUpdate = refs.monthRefPrice <= 0 ||
      toUtcMonthKey(refs.monthRefTimestamp) !== toUtcMonthKey(nowIso);

    if (shouldUpdate) {
      refs.monthRefPrice = normalizedPrice;
      refs.monthRefTimestamp = nowIso;
      refsMap[key] = refs;
      this.writeRefsMap(refsMap);
    }

    return cloneRefs(refs);
  }

  public async getRefsMap(): Promise<Record<AssetKey, AssetRefs>> {
    return cloneRefsMap(this.readRefsMap());
  }

  public async clearAll(): Promise<void> {
    this.writePositions([]);
    this.writeSnapshots([]);
    this.writeRefsMap(EMPTY_REFS_MAP);
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }

  private readPositions(): InvestmentPositionItem[] {
    const storage = this.getStorage();

    if (!storage) {
      return this.memoryState.positions.map(clonePosition);
    }

    const raw = storage.getItem(POSITIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isPosition).map(clonePosition);
      }
    } catch {
      // Ignore invalid payloads and reset lazily on write.
    }

    return [];
  }

  private writePositions(items: InvestmentPositionItem[]): void {
    const normalized = items.filter(isPosition).map(clonePosition);
    this.memoryState.positions = normalized;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(normalized));
  }

  private readSnapshots(): InvestmentSnapshotItem[] {
    const storage = this.getStorage();

    if (!storage) {
      return this.memoryState.snapshots.map(cloneSnapshot);
    }

    const raw = storage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isSnapshot).map(cloneSnapshot);
      }
    } catch {
      // Ignore invalid payloads and reset lazily on write.
    }

    return [];
  }

  private writeSnapshots(items: InvestmentSnapshotItem[]): void {
    const normalized = items.filter(isSnapshot).map(cloneSnapshot);
    this.memoryState.snapshots = normalized;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(normalized));
  }

  private readRefsMap(): Record<AssetKey, AssetRefs> {
    const storage = this.getStorage();

    if (!storage) {
      return cloneRefsMap(this.memoryState.refs);
    }

    const raw = storage.getItem(REFS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        const entries = Object.entries(parsed as Record<string, unknown>);
        const next: Record<AssetKey, AssetRefs> = {};

        entries.forEach(([key, refs]) => {
          if (isRefs(refs)) {
            next[key as AssetKey] = cloneRefs(refs);
          }
        });

        return next;
      }
    } catch {
      // Ignore invalid payloads and reset lazily on write.
    }

    return {};
  }

  private writeRefsMap(value: Record<AssetKey, AssetRefs>): void {
    const normalized = cloneRefsMap(value);
    this.memoryState.refs = normalized;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(REFS_STORAGE_KEY, JSON.stringify(normalized));
  }
}

export const investmentsPortfolioRepository: InvestmentsRepository =
  new LocalStorageInvestmentsPortfolioRepository();

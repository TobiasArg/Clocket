import type {
  AddInvestmentEntryInput,
  AddInvestmentEntryResult,
  AddSnapshotInput,
  CreateInvestmentInput,
  InvestmentEntryItem,
  InvestmentPositionItem,
  InvestmentSnapshotItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "@/domain/investments/repository";
import type {
  AssetKey,
  AssetRefs,
  AssetType,
  EntryType,
} from "@/domain/investments/portfolioTypes";

const POSITIONS_STORAGE_KEY = "investments.positions";
const ENTRIES_STORAGE_KEY = "investments.entries";
const SNAPSHOTS_STORAGE_KEY = "investments.snapshots";
const REFS_STORAGE_KEY = "investments.refs";

const EMPTY_REFS_MAP: Record<AssetKey, AssetRefs> = {};
const EPSILON = 0.00000001;

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

const normalizeEntryType = (entryType: EntryType): EntryType => {
  if (entryType !== "ingreso" && entryType !== "egreso") {
    throw new Error("Entry type must be 'ingreso' or 'egreso'.");
  }

  return entryType;
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

const byCreatedAtAsc = <T extends { createdAt: string; id: string }>(left: T, right: T): number => {
  const createdDiff = left.createdAt.localeCompare(right.createdAt);
  return createdDiff !== 0 ? createdDiff : left.id.localeCompare(right.id);
};

const byEntryCreatedAtAsc = (left: InvestmentEntryItem, right: InvestmentEntryItem): number => {
  const createdDiff = left.createdAt.localeCompare(right.createdAt);
  if (createdDiff !== 0) {
    return createdDiff;
  }

  if (left.entryType !== right.entryType) {
    return left.entryType === "ingreso" ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
};

const byTimestampAsc = <T extends { timestamp: string; id: string }>(left: T, right: T): number => {
  const timestampDiff = left.timestamp.localeCompare(right.timestamp);
  return timestampDiff !== 0 ? timestampDiff : left.id.localeCompare(right.id);
};

const byCreatedAtDesc = <T extends { createdAt: string; id: string }>(left: T, right: T): number => {
  return byCreatedAtAsc(right, left);
};

export const buildAssetKey = (assetType: AssetType, ticker: string): AssetKey => {
  return `${normalizeAssetType(assetType)}:${normalizeTicker(ticker)}`;
};

const clonePosition = (item: InvestmentPositionItem): InvestmentPositionItem => ({ ...item });
const cloneEntry = (item: InvestmentEntryItem): InvestmentEntryItem => ({ ...item });
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
    item.ticker.trim().length > 0 &&
    typeof item.usd_gastado === "number" &&
    Number.isFinite(item.usd_gastado) &&
    item.usd_gastado >= 0 &&
    typeof item.buy_price === "number" &&
    Number.isFinite(item.buy_price) &&
    item.buy_price > 0 &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    item.amount >= 0 &&
    typeof item.createdAt === "string"
  );
};

const isEntry = (value: unknown): value is InvestmentEntryItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<InvestmentEntryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.positionId === "string" &&
    item.positionId.trim().length > 0 &&
    (item.assetType === "stock" || item.assetType === "crypto") &&
    typeof item.ticker === "string" &&
    item.ticker.trim().length > 0 &&
    (item.entryType === "ingreso" || item.entryType === "egreso") &&
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
  entries: InvestmentEntryItem[];
  snapshots: InvestmentSnapshotItem[];
  refs: Record<AssetKey, AssetRefs>;
}

interface PositionSummary {
  netAmount: number;
  netCostUSD: number;
  firstCreatedAt: string;
  fallbackBuyPrice: number;
}

const createInitialState = (): InMemoryState => ({
  positions: [],
  entries: [],
  snapshots: [],
  refs: EMPTY_REFS_MAP,
});

const summarizeEntries = (entries: InvestmentEntryItem[]): PositionSummary | null => {
  if (entries.length === 0) {
    return null;
  }

  const sorted = entries.slice().sort(byEntryCreatedAtAsc);

  let netAmount = 0;
  let netCostUSD = 0;

  sorted.forEach((entry) => {
    if (entry.entryType === "ingreso") {
      netAmount += entry.amount;
      netCostUSD += entry.usd_gastado;
      return;
    }

    if (netAmount <= EPSILON) {
      netAmount = 0;
      netCostUSD = 0;
      return;
    }

    const sellAmount = Math.min(entry.amount, netAmount);
    const avgCost = netAmount > EPSILON ? netCostUSD / netAmount : 0;
    const reducedCost = avgCost * sellAmount;

    netAmount -= sellAmount;
    netCostUSD -= reducedCost;

    if (netAmount <= EPSILON) {
      netAmount = 0;
      netCostUSD = 0;
    }
  });

  const firstCreatedAt = sorted[0].createdAt;
  const fallbackBuyPrice = sorted[sorted.length - 1].buy_price;

  return {
    netAmount: roundNumber(Math.max(0, netAmount)),
    netCostUSD: roundNumber(Math.max(0, netCostUSD)),
    firstCreatedAt,
    fallbackBuyPrice,
  };
};

const toEntryFromLegacyPosition = (position: InvestmentPositionItem): InvestmentEntryItem => {
  const assetType = normalizeAssetType(position.assetType);
  const ticker = normalizeTicker(position.ticker);
  const usd_gastado = parsePositiveNumber(position.usd_gastado, "usd_gastado");
  const buy_price = parsePositiveNumber(position.buy_price, "buy_price");
  const amount = roundNumber(usd_gastado / buy_price);

  return {
    id: createId("entry"),
    positionId: position.id,
    assetType,
    ticker,
    entryType: "ingreso",
    usd_gastado,
    buy_price,
    amount,
    createdAt: normalizeTimestamp(position.createdAt),
  };
};

export class LocalStorageInvestmentsPortfolioRepository implements InvestmentsRepository {
  private memoryState: InMemoryState;

  private hasNormalizedState: boolean;

  public constructor() {
    this.memoryState = createInitialState();
    this.hasNormalizedState = false;
  }

  public async listPositions(): Promise<InvestmentPositionItem[]> {
    this.ensureNormalizedState();
    return this.readPositionsRaw().map(clonePosition);
  }

  public async getPositionById(id: string): Promise<InvestmentPositionItem | null> {
    this.ensureNormalizedState();
    const found = this.readPositionsRaw().find((item) => item.id === id);
    return found ? clonePosition(found) : null;
  }

  public async listEntriesByPosition(positionId: string): Promise<InvestmentEntryItem[]> {
    this.ensureNormalizedState();
    return this.readEntriesRaw()
      .filter((entry) => entry.positionId === positionId)
      .sort(byCreatedAtDesc)
      .map(cloneEntry);
  }

  public async listEntriesByAsset(
    assetType: AssetType,
    ticker: string,
  ): Promise<InvestmentEntryItem[]> {
    this.ensureNormalizedState();
    const key = buildAssetKey(assetType, ticker);
    return this.readEntriesRaw()
      .filter((entry) => buildAssetKey(entry.assetType, entry.ticker) === key)
      .sort(byCreatedAtDesc)
      .map(cloneEntry);
  }

  public async addEntry(input: AddInvestmentEntryInput): Promise<AddInvestmentEntryResult> {
    this.ensureNormalizedState();

    const assetType = normalizeAssetType(input.assetType);
    const ticker = normalizeTicker(input.ticker);
    const entryType = normalizeEntryType(input.entryType);
    const usd_gastado = parsePositiveNumber(input.usd_gastado, "usd_gastado");
    const buy_price = parsePositiveNumber(input.buy_price, "buy_price");
    const amount = roundNumber(usd_gastado / buy_price);
    const createdAt = normalizeTimestamp(input.createdAt);

    const assetKey = buildAssetKey(assetType, ticker);
    const positions = this.readPositionsRaw();
    const entries = this.readEntriesRaw();

    const existingPosition = positions.find((position) => {
      return buildAssetKey(position.assetType, position.ticker) === assetKey;
    });

    const existingEntries = entries
      .filter((entry) => buildAssetKey(entry.assetType, entry.ticker) === assetKey)
      .sort(byEntryCreatedAtAsc);

    const currentSummary = summarizeEntries(existingEntries);
    const availableAmount = currentSummary?.netAmount ?? 0;

    if (entryType === "egreso") {
      if (availableAmount <= EPSILON) {
        throw new Error("No hay cantidad disponible para registrar un egreso.");
      }

      if (amount > availableAmount + EPSILON) {
        throw new Error("No podés egresar más cantidad de la disponible en la posición.");
      }
    }

    const positionId = existingPosition?.id
      ?? existingEntries[0]?.positionId
      ?? createId("pos");

    const createdEntry: InvestmentEntryItem = {
      id: createId("entry"),
      positionId,
      assetType,
      ticker,
      entryType,
      usd_gastado,
      buy_price,
      amount,
      createdAt,
    };

    this.writeEntriesRaw([...entries, createdEntry]);
    this.rebuildPositionsFromEntries();

    const refreshedPosition = this.readPositionsRaw().find((position) => {
      return buildAssetKey(position.assetType, position.ticker) === assetKey;
    }) ?? null;

    return {
      position: refreshedPosition ? clonePosition(refreshedPosition) : null,
      entry: cloneEntry(createdEntry),
    };
  }

  public async deleteEntry(entryId: string): Promise<boolean> {
    this.ensureNormalizedState();

    const entries = this.readEntriesRaw();
    const filtered = entries.filter((entry) => entry.id !== entryId);

    if (filtered.length === entries.length) {
      return false;
    }

    this.writeEntriesRaw(filtered);
    this.rebuildPositionsFromEntries();
    return true;
  }

  public async addPosition(input: CreateInvestmentInput): Promise<InvestmentPositionItem> {
    const result = await this.addEntry({
      assetType: input.assetType,
      ticker: input.ticker,
      entryType: input.entryType ?? "ingreso",
      usd_gastado: input.usd_gastado,
      buy_price: input.buy_price,
      createdAt: input.createdAt,
    });

    if (!result.position) {
      throw new Error("La posición quedó en cero luego del movimiento.");
    }

    return result.position;
  }

  public async editPosition(
    id: string,
    patch: UpdateInvestmentPatch,
  ): Promise<InvestmentPositionItem | null> {
    this.ensureNormalizedState();

    const current = this.readPositionsRaw().find((position) => position.id === id);
    if (!current) {
      return null;
    }

    const nextAssetType = patch.assetType !== undefined
      ? normalizeAssetType(patch.assetType)
      : current.assetType;
    const nextTicker = patch.ticker !== undefined
      ? normalizeTicker(patch.ticker)
      : current.ticker;
    const nextUsd = patch.usd_gastado !== undefined
      ? parsePositiveNumber(patch.usd_gastado, "usd_gastado")
      : current.usd_gastado;
    const nextBuy = patch.buy_price !== undefined
      ? parsePositiveNumber(patch.buy_price, "buy_price")
      : current.buy_price;
    const nextCreatedAt = patch.createdAt !== undefined
      ? normalizeTimestamp(patch.createdAt)
      : current.createdAt;

    const entries = this.readEntriesRaw().filter((entry) => entry.positionId !== id);
    const replacement: InvestmentEntryItem = {
      id: createId("entry"),
      positionId: id,
      assetType: nextAssetType,
      ticker: nextTicker,
      entryType: "ingreso",
      usd_gastado: nextUsd,
      buy_price: nextBuy,
      amount: roundNumber(nextUsd / nextBuy),
      createdAt: nextCreatedAt,
    };

    this.writeEntriesRaw([...entries, replacement]);
    this.rebuildPositionsFromEntries();

    return this.readPositionsRaw().find((position) => position.id === id) ?? null;
  }

  public async deletePosition(id: string): Promise<boolean> {
    this.ensureNormalizedState();

    const entries = this.readEntriesRaw();
    const filteredEntries = entries.filter((entry) => entry.positionId !== id);

    if (filteredEntries.length === entries.length) {
      return false;
    }

    this.writeEntriesRaw(filteredEntries);
    this.rebuildPositionsFromEntries();
    return true;
  }

  public async addSnapshot(input: AddSnapshotInput): Promise<InvestmentSnapshotItem> {
    this.ensureNormalizedState();

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

    const snapshots = this.readSnapshotsRaw();
    snapshots.push(created);
    this.writeSnapshotsRaw(snapshots);

    return cloneSnapshot(created);
  }

  public async listSnapshotsByAsset(
    assetType: AssetType,
    ticker: string,
  ): Promise<InvestmentSnapshotItem[]> {
    this.ensureNormalizedState();

    const key = buildAssetKey(assetType, ticker);
    return this.readSnapshotsRaw()
      .filter((item) => buildAssetKey(item.assetType, item.ticker) === key)
      .sort(byTimestampAsc)
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
    this.ensureNormalizedState();

    const key = buildAssetKey(assetType, ticker);
    const refsMap = this.readRefsMapRaw();
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
    this.writeRefsMapRaw(refsMap);
    return cloneRefs(initial);
  }

  public async updateDailyRefIfNeeded(
    assetType: AssetType,
    ticker: string,
    currentPrice: number,
    timestamp?: string,
  ): Promise<AssetRefs> {
    this.ensureNormalizedState();

    const normalizedPrice = parsePositiveNumber(currentPrice, "dailyRefPrice");
    const nowIso = normalizeTimestamp(timestamp);
    const key = buildAssetKey(assetType, ticker);
    const refsMap = this.readRefsMapRaw();
    const refs = refsMap[key] ?? await this.getOrInitRefs(assetType, ticker);

    const shouldUpdate = refs.dailyRefPrice <= 0 ||
      toUtcDayKey(refs.dailyRefTimestamp) !== toUtcDayKey(nowIso);

    if (shouldUpdate) {
      refs.dailyRefPrice = normalizedPrice;
      refs.dailyRefTimestamp = nowIso;
      refsMap[key] = refs;
      this.writeRefsMapRaw(refsMap);
    }

    return cloneRefs(refs);
  }

  public async updateMonthRefIfNeeded(
    assetType: AssetType,
    ticker: string,
    currentPrice: number,
    timestamp?: string,
  ): Promise<AssetRefs> {
    this.ensureNormalizedState();

    const normalizedPrice = parsePositiveNumber(currentPrice, "monthRefPrice");
    const nowIso = normalizeTimestamp(timestamp);
    const key = buildAssetKey(assetType, ticker);
    const refsMap = this.readRefsMapRaw();
    const refs = refsMap[key] ?? await this.getOrInitRefs(assetType, ticker);

    const shouldUpdate = refs.monthRefPrice <= 0 ||
      toUtcMonthKey(refs.monthRefTimestamp) !== toUtcMonthKey(nowIso);

    if (shouldUpdate) {
      refs.monthRefPrice = normalizedPrice;
      refs.monthRefTimestamp = nowIso;
      refsMap[key] = refs;
      this.writeRefsMapRaw(refsMap);
    }

    return cloneRefs(refs);
  }

  public async getRefsMap(): Promise<Record<AssetKey, AssetRefs>> {
    this.ensureNormalizedState();
    return cloneRefsMap(this.readRefsMapRaw());
  }

  public async clearAll(): Promise<void> {
    this.writePositionsRaw([]);
    this.writeEntriesRaw([]);
    this.writeSnapshotsRaw([]);
    this.writeRefsMapRaw(EMPTY_REFS_MAP);
    this.hasNormalizedState = true;
  }

  private ensureNormalizedState(): void {
    if (this.hasNormalizedState) {
      return;
    }

    const rawPositions = this.readPositionsRaw();
    const rawEntries = this.readEntriesRaw();

    const existingKeys = new Set(rawEntries.map((entry) => buildAssetKey(entry.assetType, entry.ticker)));
    const synthesizedFromPositions = rawPositions
      .filter((position) => !existingKeys.has(buildAssetKey(position.assetType, position.ticker)))
      .map(toEntryFromLegacyPosition);

    const mergedEntries = [...rawEntries.map(cloneEntry), ...synthesizedFromPositions];
    this.writeEntriesRaw(mergedEntries);

    this.rebuildPositionsFromEntries(rawPositions);
    this.hasNormalizedState = true;
  }

  private rebuildPositionsFromEntries(seedPositions?: InvestmentPositionItem[]): void {
    const positions = (seedPositions ?? this.readPositionsRaw()).map(clonePosition);
    const entries = this.readEntriesRaw().map(cloneEntry);

    const positionByAsset = new Map<string, InvestmentPositionItem>();
    positions.forEach((position) => {
      const key = buildAssetKey(position.assetType, position.ticker);
      const existing = positionByAsset.get(key);
      if (!existing || byCreatedAtAsc(position, existing) < 0) {
        positionByAsset.set(key, position);
      }
    });

    const groupedEntries = new Map<string, InvestmentEntryItem[]>();
    entries.forEach((entry) => {
      const key = buildAssetKey(entry.assetType, entry.ticker);
      const group = groupedEntries.get(key);
      if (group) {
        group.push(entry);
      } else {
        groupedEntries.set(key, [entry]);
      }
    });

    const nextPositions: InvestmentPositionItem[] = [];

    groupedEntries.forEach((groupEntries, assetKey) => {
      const [assetType, ticker] = assetKey.split(":") as [AssetType, string];
      const sortedEntries = groupEntries.slice().sort(byEntryCreatedAtAsc);

      const preferredPosition = positionByAsset.get(assetKey);
      const canonicalPositionId = preferredPosition?.id
        ?? sortedEntries[0]?.positionId
        ?? createId("pos");

      sortedEntries.forEach((entry) => {
        entry.positionId = canonicalPositionId;
      });

      const summary = summarizeEntries(sortedEntries);
      if (!summary || summary.netAmount <= EPSILON) {
        return;
      }

      const buyPrice = summary.netAmount > EPSILON
        ? roundNumber(summary.netCostUSD / summary.netAmount)
        : roundNumber(summary.fallbackBuyPrice);

      const createdAt = preferredPosition?.createdAt ?? summary.firstCreatedAt;

      nextPositions.push({
        id: canonicalPositionId,
        assetType,
        ticker,
        usd_gastado: roundNumber(summary.netCostUSD),
        buy_price: buyPrice > EPSILON ? buyPrice : roundNumber(summary.fallbackBuyPrice),
        amount: roundNumber(summary.netAmount),
        createdAt: normalizeTimestamp(createdAt),
      });
    });

    this.writeEntriesRaw(entries);
    this.writePositionsRaw(nextPositions.sort(byCreatedAtAsc));
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }

  private readPositionsRaw(): InvestmentPositionItem[] {
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

  private writePositionsRaw(items: InvestmentPositionItem[]): void {
    const normalized = items
      .filter(isPosition)
      .map((position) => ({
        ...clonePosition(position),
        ticker: normalizeTicker(position.ticker),
        assetType: normalizeAssetType(position.assetType),
      }));
    this.memoryState.positions = normalized;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(normalized));
  }

  private readEntriesRaw(): InvestmentEntryItem[] {
    const storage = this.getStorage();

    if (!storage) {
      return this.memoryState.entries.map(cloneEntry);
    }

    const raw = storage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isEntry).map(cloneEntry);
      }
    } catch {
      // Ignore invalid payloads and reset lazily on write.
    }

    return [];
  }

  private writeEntriesRaw(items: InvestmentEntryItem[]): void {
    const normalized = items
      .filter(isEntry)
      .map((entry) => ({
        ...cloneEntry(entry),
        ticker: normalizeTicker(entry.ticker),
        assetType: normalizeAssetType(entry.assetType),
        entryType: normalizeEntryType(entry.entryType),
      }));

    this.memoryState.entries = normalized;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(normalized));
  }

  private readSnapshotsRaw(): InvestmentSnapshotItem[] {
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

  private writeSnapshotsRaw(items: InvestmentSnapshotItem[]): void {
    const normalized = items.filter(isSnapshot).map(cloneSnapshot);
    this.memoryState.snapshots = normalized;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(normalized));
  }

  private readRefsMapRaw(): Record<AssetKey, AssetRefs> {
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

  private writeRefsMapRaw(value: Record<AssetKey, AssetRefs>): void {
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

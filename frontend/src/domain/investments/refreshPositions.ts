import type {
  InvestmentPositionItem,
  InvestmentSnapshotItem,
  InvestmentsRepository,
} from "@/domain/investments/repository";
import type { AssetRefs, HistoricalPoint } from "@/domain/investments/portfolioTypes";
import {
  fetchCryptoRate,
  fetchStockQuote,
  MarketQuoteApiError,
} from "@/data/http/marketQuoteApiClient";
import { investmentsRepository } from "@/data/localStorage/investmentsRepository";
import {
  buildHistoricalSeries,
  computePositionMetrics,
  type PositionMetrics,
} from "./portfolioMetrics";

const DAILY_REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export interface RefreshedPositionViewModel extends PositionMetrics {
  id: string;
  ticker: string;
  assetType: InvestmentPositionItem["assetType"];
  createdAt: string;
  staleWarning: string | null;
  refreshError: string | null;
  historicalPoints: HistoricalPoint[];
}

export interface RefreshPositionsOptions {
  force?: boolean;
  now?: Date;
  repository?: InvestmentsRepository;
}

interface AssetRefreshState {
  currentPrice: number | null;
  lastUpdatedTimestamp: string | null;
  staleWarning: string | null;
  refreshError: string | null;
}

interface RefreshRuntime {
  repository: InvestmentsRepository;
  force: boolean;
  now: Date;
  latestSnapshotCache: Map<string, Promise<InvestmentSnapshotItem | null>>;
  snapshotsCache: Map<string, Promise<InvestmentSnapshotItem[]>>;
  refsCache: Map<string, Promise<AssetRefs>>;
  assetRefreshCache: Map<string, Promise<AssetRefreshState>>;
}

const buildAssetCacheKey = (
  assetType: InvestmentPositionItem["assetType"],
  ticker: string,
): string => `${assetType}:${ticker.trim().toUpperCase()}`;

const shouldRefreshByUtcDay = (
  latestSnapshot: InvestmentSnapshotItem | null,
  now: Date,
): boolean => {
  if (!latestSnapshot) {
    return true;
  }

  const latestTimestamp = new Date(latestSnapshot.timestamp);
  if (Number.isNaN(latestTimestamp.getTime())) {
    return true;
  }

  return latestTimestamp.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);
};

const toStaleFallback = (
  fallbackPrice: number,
  latestSnapshot: InvestmentSnapshotItem | null,
): { currentPrice: number; lastUpdatedTimestamp: string | null } => {
  if (latestSnapshot) {
    return {
      currentPrice: latestSnapshot.price,
      lastUpdatedTimestamp: latestSnapshot.timestamp,
    };
  }

  return {
    currentPrice: fallbackPrice,
    lastUpdatedTimestamp: null,
  };
};

const getLatestSnapshot = (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): Promise<InvestmentSnapshotItem | null> => {
  const assetKey = buildAssetCacheKey(position.assetType, position.ticker);
  const cached = runtime.latestSnapshotCache.get(assetKey);
  if (cached) {
    return cached;
  }

  const pending = runtime.repository.getLatestSnapshotByAsset(position.assetType, position.ticker);
  runtime.latestSnapshotCache.set(assetKey, pending);
  return pending;
};

const getRefs = (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): Promise<AssetRefs> => {
  const assetKey = buildAssetCacheKey(position.assetType, position.ticker);
  const cached = runtime.refsCache.get(assetKey);
  if (cached) {
    return cached;
  }

  const pending = runtime.repository.getOrInitRefs(position.assetType, position.ticker);
  runtime.refsCache.set(assetKey, pending);
  return pending;
};

const getSnapshots = (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): Promise<InvestmentSnapshotItem[]> => {
  const assetKey = buildAssetCacheKey(position.assetType, position.ticker);
  const cached = runtime.snapshotsCache.get(assetKey);
  if (cached) {
    return cached;
  }

  const pending = runtime.repository.listSnapshotsByAsset(position.assetType, position.ticker);
  runtime.snapshotsCache.set(assetKey, pending);
  return pending;
};

const refreshAssetIfNeeded = (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): Promise<AssetRefreshState> => {
  const assetKey = buildAssetCacheKey(position.assetType, position.ticker);
  const cached = runtime.assetRefreshCache.get(assetKey);
  if (cached) {
    return cached;
  }

  const pending = (async (): Promise<AssetRefreshState> => {
    const latestSnapshot = await getLatestSnapshot(runtime, position);

    let currentPrice = latestSnapshot?.price ?? null;
    let fallbackPrice = position.buy_price;
    let lastUpdatedTimestamp: string | null = latestSnapshot?.timestamp ?? null;
    let staleWarning: string | null = null;
    let refreshError: string | null = null;

    const shouldRefresh = shouldRefreshByUtcDay(latestSnapshot, runtime.now);

    if (shouldRefresh) {
      try {
        const quote = position.assetType === "crypto"
          ? await fetchCryptoRate(position.ticker)
          : await fetchStockQuote(position.ticker);

        const snapshot = await runtime.repository.addSnapshot({
          ticker: position.ticker,
          assetType: position.assetType,
          price: quote.currentPrice,
          source: quote.source,
          timestamp: quote.asOf,
          ...(quote.bid !== null ? { bid: quote.bid } : {}),
          ...(quote.ask !== null ? { ask: quote.ask } : {}),
        });

        await runtime.repository.updateDailyRefIfNeeded(
          position.assetType,
          position.ticker,
          quote.currentPrice,
          quote.asOf,
        );
        const updatedRefs = await runtime.repository.updateMonthRefIfNeeded(
          position.assetType,
          position.ticker,
          quote.currentPrice,
          quote.asOf,
        );

        runtime.latestSnapshotCache.set(assetKey, Promise.resolve(snapshot));
        runtime.snapshotsCache.delete(assetKey);
        runtime.refsCache.set(assetKey, Promise.resolve(updatedRefs));

        currentPrice = snapshot.price;
        lastUpdatedTimestamp = snapshot.timestamp;
        fallbackPrice = snapshot.price;
      } catch (error) {
        const fallback = toStaleFallback(fallbackPrice, latestSnapshot);
        currentPrice = fallback.currentPrice;
        lastUpdatedTimestamp = fallback.lastUpdatedTimestamp;

        if (error instanceof MarketQuoteApiError) {
          refreshError = error.message;
          staleWarning = error.staleWarning;
        } else if (error instanceof Error) {
          refreshError = error.message;
          staleWarning = "No se pudo actualizar. Manteniendo último precio guardado.";
        } else {
          refreshError = "No se pudo actualizar la cotización.";
          staleWarning = "No se pudo actualizar. Manteniendo último precio guardado.";
        }
      }
    }

    return {
      currentPrice,
      lastUpdatedTimestamp,
      staleWarning,
      refreshError,
    };
  })();

  runtime.assetRefreshCache.set(assetKey, pending);
  return pending;
};

const buildPositionViewModel = async (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): Promise<RefreshedPositionViewModel> => {
  const assetState = await refreshAssetIfNeeded(runtime, position);
  const currentPrice = assetState.currentPrice ?? position.buy_price;
  const lastUpdatedTimestamp = assetState.lastUpdatedTimestamp;

  const refs = await getRefs(runtime, position);
  const snapshots = await getSnapshots(runtime, position);
  const historicalPoints = buildHistoricalSeries(position, snapshots);

  const metrics = computePositionMetrics(
    position,
    currentPrice,
    refs,
    lastUpdatedTimestamp,
  );

  return {
    id: position.id,
    ticker: position.ticker,
    assetType: position.assetType,
    createdAt: position.createdAt,
    staleWarning: assetState.staleWarning,
    refreshError: assetState.refreshError,
    historicalPoints,
    ...metrics,
  };
};

export const refreshPositions = async (
  positions: InvestmentPositionItem[],
  options: RefreshPositionsOptions = {},
): Promise<RefreshedPositionViewModel[]> => {
  const runtime: RefreshRuntime = {
    repository: options.repository ?? investmentsRepository,
    force: options.force ?? false,
    now: options.now ?? new Date(),
    latestSnapshotCache: new Map<string, Promise<InvestmentSnapshotItem | null>>(),
    snapshotsCache: new Map<string, Promise<InvestmentSnapshotItem[]>>(),
    refsCache: new Map<string, Promise<AssetRefs>>(),
    assetRefreshCache: new Map<string, Promise<AssetRefreshState>>(),
  };

  const result: RefreshedPositionViewModel[] = [];

  for (const position of positions) {
    const refreshed = await buildPositionViewModel(runtime, position);
    result.push(refreshed);
  }

  return result;
};

export const REFRESH_THRESHOLDS_MS = {
  stock: DAILY_REFRESH_THRESHOLD_MS,
  crypto: DAILY_REFRESH_THRESHOLD_MS,
} as const;

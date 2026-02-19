import type {
  InvestmentPositionItem,
  InvestmentSnapshotItem,
  InvestmentsRepository,
} from "@/domain/investments/repository";
import type { HistoricalPoint } from "@/domain/investments/portfolioTypes";
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

const STOCK_REFRESH_THRESHOLD_MS = 45 * 60 * 1000;
const CRYPTO_REFRESH_THRESHOLD_MS = 12 * 60 * 1000;

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

const shouldRefreshByAge = (
  latestSnapshot: InvestmentSnapshotItem | null,
  position: InvestmentPositionItem,
  now: Date,
): boolean => {
  if (!latestSnapshot) {
    return true;
  }

  const latestTimestamp = new Date(latestSnapshot.timestamp);
  if (Number.isNaN(latestTimestamp.getTime())) {
    return true;
  }

  const ageMs = now.getTime() - latestTimestamp.getTime();
  const threshold = position.assetType === "crypto"
    ? CRYPTO_REFRESH_THRESHOLD_MS
    : STOCK_REFRESH_THRESHOLD_MS;

  return ageMs >= threshold;
};

const toStaleFallback = (
  position: InvestmentPositionItem,
  latestSnapshot: InvestmentSnapshotItem | null,
): { currentPrice: number; lastUpdatedTimestamp: string | null } => {
  if (latestSnapshot) {
    return {
      currentPrice: latestSnapshot.price,
      lastUpdatedTimestamp: latestSnapshot.timestamp,
    };
  }

  return {
    currentPrice: position.buy_price,
    lastUpdatedTimestamp: null,
  };
};

const refreshPosition = async (
  position: InvestmentPositionItem,
  options: Required<Pick<RefreshPositionsOptions, "force" | "now">> & {
    repository: InvestmentsRepository;
  },
): Promise<RefreshedPositionViewModel> => {
  const latestSnapshot = await options.repository.getLatestSnapshotByAsset(
    position.assetType,
    position.ticker,
  );

  let currentPrice = latestSnapshot?.price ?? position.buy_price;
  let lastUpdatedTimestamp: string | null = latestSnapshot?.timestamp ?? null;
  let staleWarning: string | null = null;
  let refreshError: string | null = null;

  const shouldRefresh = options.force ||
    shouldRefreshByAge(latestSnapshot, position, options.now);

  if (shouldRefresh) {
    try {
      const quote = position.assetType === "crypto"
        ? await fetchCryptoRate(position.ticker)
        : await fetchStockQuote(position.ticker);

      const snapshot = await options.repository.addSnapshot({
        ticker: position.ticker,
        assetType: position.assetType,
        price: quote.currentPrice,
        source: quote.source,
        timestamp: quote.asOf,
        ...(quote.bid !== null ? { bid: quote.bid } : {}),
        ...(quote.ask !== null ? { ask: quote.ask } : {}),
      });

      await options.repository.updateDailyRefIfNeeded(
        position.assetType,
        position.ticker,
        quote.currentPrice,
        quote.asOf,
      );
      await options.repository.updateMonthRefIfNeeded(
        position.assetType,
        position.ticker,
        quote.currentPrice,
        quote.asOf,
      );

      currentPrice = snapshot.price;
      lastUpdatedTimestamp = snapshot.timestamp;
    } catch (error) {
      const fallback = toStaleFallback(position, latestSnapshot);
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

  const refs = await options.repository.getOrInitRefs(position.assetType, position.ticker);
  const snapshots = await options.repository.listSnapshotsByAsset(position.assetType, position.ticker);
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
    staleWarning,
    refreshError,
    historicalPoints,
    ...metrics,
  };
};

export const refreshPositions = async (
  positions: InvestmentPositionItem[],
  options: RefreshPositionsOptions = {},
): Promise<RefreshedPositionViewModel[]> => {
  const repository = options.repository ?? investmentsRepository;
  const force = options.force ?? false;
  const now = options.now ?? new Date();

  const result: RefreshedPositionViewModel[] = [];

  for (const position of positions) {
    const refreshed = await refreshPosition(position, {
      repository,
      force,
      now,
    });
    result.push(refreshed);
  }

  return result;
};

export const REFRESH_THRESHOLDS_MS = {
  stock: STOCK_REFRESH_THRESHOLD_MS,
  crypto: CRYPTO_REFRESH_THRESHOLD_MS,
} as const;

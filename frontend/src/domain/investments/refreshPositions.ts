import type {
  InvestmentPositionItem,
  InvestmentsRepository,
  RefreshInvestmentPositionResult,
} from "@/domain/investments/repository";
import type { AssetRefs, HistoricalPoint } from "@/domain/investments/portfolioTypes";
import { httpInvestmentsRepository as investmentsRepository } from "@/data/http/investmentsRepository";
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

interface RefreshRuntime {
  repository: InvestmentsRepository;
  force: boolean;
  resultsByPositionId: Map<string, RefreshInvestmentPositionResult>;
  resultsByAssetKey: Map<string, RefreshInvestmentPositionResult>;
}

const buildAssetCacheKey = (
  assetType: InvestmentPositionItem["assetType"],
  ticker: string,
): string => `${assetType}:${ticker.trim().toUpperCase()}`;

const getRefreshResult = (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): RefreshInvestmentPositionResult | null => runtime.resultsByPositionId.get(position.id)
  ?? runtime.resultsByAssetKey.get(buildAssetCacheKey(position.assetType, position.ticker))
  ?? null;

const createFallbackRefs = (price: number, timestamp: string | null): AssetRefs => ({
  dailyRefPrice: price,
  dailyRefTimestamp: timestamp ?? new Date(0).toISOString(),
  monthRefPrice: price,
  monthRefTimestamp: timestamp ?? new Date(0).toISOString(),
});

const buildPositionViewModel = async (
  runtime: RefreshRuntime,
  position: InvestmentPositionItem,
): Promise<RefreshedPositionViewModel> => {
  const refreshResult = getRefreshResult(runtime, position);
  const currentPrice = refreshResult?.currentPrice
    ?? refreshResult?.latestSnapshot?.price
    ?? position.buy_price;
  const lastUpdatedTimestamp = refreshResult?.lastUpdatedTimestamp
    ?? refreshResult?.latestSnapshot?.timestamp
    ?? null;
  const refs = refreshResult?.refs ?? createFallbackRefs(currentPrice, lastUpdatedTimestamp);
  const snapshots = refreshResult?.snapshots ?? [];
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
    staleWarning: refreshResult?.staleWarning ?? null,
    refreshError: refreshResult?.refreshError ?? null,
    historicalPoints,
    ...metrics,
  };
};

export const refreshPositions = async (
  positions: InvestmentPositionItem[],
  options: RefreshPositionsOptions = {},
): Promise<RefreshedPositionViewModel[]> => {
  if (positions.length === 0) {
    return [];
  }

  const repository = options.repository ?? investmentsRepository;
  const refreshResponse = await repository.refreshPositions({
    positionIds: positions.map((position) => position.id),
    force: options.force ?? false,
  });
  const resultsByPositionId = new Map<string, RefreshInvestmentPositionResult>();
  const resultsByAssetKey = new Map<string, RefreshInvestmentPositionResult>();

  for (const result of refreshResponse.results) {
    if (result.positionId) {
      resultsByPositionId.set(result.positionId, result);
    }
    resultsByAssetKey.set(buildAssetCacheKey(result.assetType, result.ticker), result);
  }

  const runtime: RefreshRuntime = {
    repository,
    force: options.force ?? false,
    resultsByPositionId,
    resultsByAssetKey,
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

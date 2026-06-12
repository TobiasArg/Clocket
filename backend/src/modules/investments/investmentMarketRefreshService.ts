import { getAlphaVantageConfig, type RuntimeEnv } from "../../config/alphaVantageConfig";
import {
  AlphaVantageClientError,
  createAlphaVantageClient,
  type MarketQuoteProvider,
} from "../../providers/alpha-vantage/alphaVantageClient";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { parseJsonObjectBody } from "../core-finance/coreFinanceRequest";
import {
  isValidAssetType,
  isValidTicker,
  normalizeTicker,
  withMarketQuoteAsOf,
  type MarketQuoteErrorCode,
} from "../market/marketQuoteContracts";
import type {
  InvestmentRefreshStatus,
  RefreshInvestmentPositionResult,
  RefreshInvestmentPositionsResponse,
} from "./investmentsContracts";
import type {
  InvestmentAssetRecordType,
  InvestmentAssetRefsRecord,
  InvestmentsRepository,
  MarketQuoteSnapshotRecord,
} from "./investmentsRepository";

interface RefreshAssetTarget {
  positionId: string | null;
  assetType: InvestmentAssetRecordType;
  ticker: string;
}

interface AssetRefreshRecord {
  assetType: InvestmentAssetRecordType;
  ticker: string;
  currentPrice: string | null;
  lastUpdatedTimestamp: string | null;
  status: InvestmentRefreshStatus;
  staleWarning: string | null;
  refreshError: string | null;
  errorCode: MarketQuoteErrorCode | null;
  latestSnapshot: MarketQuoteSnapshotRecord | null;
  refs: InvestmentAssetRefsRecord | null;
  snapshots: MarketQuoteSnapshotRecord[];
}

export interface FailureCooldownEntry {
  expiresAtMs: number;
  staleWarning: string;
  refreshError: string;
  errorCode: MarketQuoteErrorCode;
}

export interface InvestmentMarketRefreshService {
  refreshPositions: (body: unknown) => Promise<RefreshInvestmentPositionsResponse>;
}

export interface InvestmentMarketRefreshServiceDependencies {
  repository: InvestmentsRepository;
  env?: RuntimeEnv;
  alphaVantageClient?: MarketQuoteProvider;
  now?: () => Date;
  failureCooldownCache?: Map<string, FailureCooldownEntry>;
}

const THROTTLED_COOLDOWN_MS = 30 * 60 * 1000;
const INVALID_SYMBOL_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const TRANSIENT_ERROR_COOLDOWN_MS = 5 * 60 * 1000;

const DEFAULT_FAILURE_WARNING = "No se pudo actualizar. Manteniendo último precio guardado.";
const THROTTLED_WARNING = "Rate limit alcanzado. Manteniendo último precio guardado.";
const INVALID_SYMBOL_WARNING = "Ticker inválido. Manteniendo último precio guardado.";
const COOLDOWN_ERROR = "Reintento pausado para evitar exceso de requests.";

const defaultFailureCooldownCache = new Map<string, FailureCooldownEntry>();

const toAssetKey = (assetType: InvestmentAssetRecordType, ticker: string): string => `${assetType}:${normalizeTicker(ticker)}`;

const toUtcDayKey = (value: string): string | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const isSameUtcDay = (snapshot: MarketQuoteSnapshotRecord, now: Date): boolean => {
  const snapshotDay = toUtcDayKey(snapshot.timestamp);
  return snapshotDay !== null && snapshotDay === now.toISOString().slice(0, 10);
};

const readForce = (value: unknown): boolean => {
  if (value === undefined) return false;
  if (typeof value !== "boolean") {
    throw new CoreFinanceApiError("Field 'force' must be a boolean.", { code: "INVALID_REQUEST", status: 400 });
  }
  return value;
};

const readPositionIds = (value: unknown): string[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new CoreFinanceApiError("Field 'positionIds' must be an array.", { code: "INVALID_REQUEST", status: 400 });
  }
  return value.map((item) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new CoreFinanceApiError("Position ids must be non-empty strings.", { code: "INVALID_REQUEST", status: 400 });
    }
    return item.trim();
  });
};

const readAssets = (value: unknown): Array<{ assetType: InvestmentAssetRecordType; ticker: string }> => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new CoreFinanceApiError("Field 'assets' must be an array.", { code: "INVALID_REQUEST", status: 400 });
  }

  return value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new CoreFinanceApiError("Each asset must be a JSON object.", { code: "INVALID_REQUEST", status: 400 });
    }
    const asset = item as Record<string, unknown>;
    const assetType = typeof asset.assetType === "string" ? asset.assetType.trim().toLowerCase() : asset.assetType;
    const ticker = normalizeTicker(asset.ticker);
    if (!isValidAssetType(assetType)) {
      throw new CoreFinanceApiError("Asset type must be 'stock' or 'crypto'.", { code: "INVALID_ASSET_TYPE", status: 400 });
    }
    if (!isValidTicker(ticker)) {
      throw new CoreFinanceApiError("Ticker is invalid.", { code: "INVALID_TICKER", status: 400 });
    }
    return { assetType, ticker };
  });
};

const resolveCooldownMs = (code: MarketQuoteErrorCode): number => {
  if (code === "THROTTLED") return THROTTLED_COOLDOWN_MS;
  if (code === "INVALID_SYMBOL") return INVALID_SYMBOL_COOLDOWN_MS;
  return TRANSIENT_ERROR_COOLDOWN_MS;
};

const resolveWarning = (code: MarketQuoteErrorCode): string => {
  if (code === "THROTTLED") return THROTTLED_WARNING;
  if (code === "INVALID_SYMBOL") return INVALID_SYMBOL_WARNING;
  return DEFAULT_FAILURE_WARNING;
};

const toFallbackStatus = (latestSnapshot: MarketQuoteSnapshotRecord | null): InvestmentRefreshStatus => latestSnapshot ? "stale_fallback" : "no_snapshot";

const toAssetRecord = async (
  repository: InvestmentsRepository,
  target: { assetType: InvestmentAssetRecordType; ticker: string },
  options: {
    status: InvestmentRefreshStatus;
    staleWarning: string | null;
    refreshError: string | null;
    errorCode: MarketQuoteErrorCode | null;
    latestSnapshot?: MarketQuoteSnapshotRecord | null;
    refs?: InvestmentAssetRefsRecord | null;
    snapshots?: MarketQuoteSnapshotRecord[];
  },
): Promise<AssetRefreshRecord> => {
  const latestSnapshot = options.latestSnapshot === undefined
    ? await repository.getLatestSnapshotByAsset(target.assetType, target.ticker)
    : options.latestSnapshot;
  const refs = options.refs === undefined
    ? latestSnapshot
      ? await repository.getOrInitRefs(target.assetType, target.ticker)
      : null
    : options.refs;
  const snapshots = options.snapshots ?? await repository.listSnapshotsByAsset(target.assetType, target.ticker);

  return {
    assetType: target.assetType,
    ticker: target.ticker,
    currentPrice: latestSnapshot?.price ?? null,
    lastUpdatedTimestamp: latestSnapshot?.timestamp ?? null,
    status: options.status,
    staleWarning: options.staleWarning,
    refreshError: options.refreshError,
    errorCode: options.errorCode,
    latestSnapshot,
    refs,
    snapshots,
  };
};

const parseRequestTargets = async (
  repository: InvestmentsRepository,
  body: unknown,
): Promise<{ force: boolean; targets: RefreshAssetTarget[] }> => {
  const parsedBody = parseJsonObjectBody(body);
  if (!parsedBody.ok) {
    throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
  }

  const positionIds = readPositionIds(parsedBody.value.positionIds);
  const assets = readAssets(parsedBody.value.assets);
  const force = readForce(parsedBody.value.force);

  if (positionIds.length === 0 && assets.length === 0) {
    throw new CoreFinanceApiError("At least one position id or asset is required.", { code: "INVALID_REQUEST", status: 400 });
  }

  const targets: RefreshAssetTarget[] = [];

  for (const positionId of positionIds) {
    const position = await repository.getPositionById(positionId);
    if (!position) {
      throw new CoreFinanceApiError(`Investment position '${positionId}' was not found.`, { code: "NOT_FOUND", status: 404 });
    }
    targets.push({
      positionId: position.id,
      assetType: position.assetType,
      ticker: normalizeTicker(position.ticker),
    });
  }

  for (const asset of assets) {
    targets.push({
      positionId: null,
      assetType: asset.assetType,
      ticker: asset.ticker,
    });
  }

  return { force, targets };
};

const toResult = (target: RefreshAssetTarget, record: AssetRefreshRecord): RefreshInvestmentPositionResult => ({
  positionId: target.positionId,
  assetType: target.assetType,
  ticker: target.ticker,
  currentPrice: record.currentPrice,
  lastUpdatedTimestamp: record.lastUpdatedTimestamp,
  status: record.status,
  staleWarning: record.staleWarning,
  refreshError: record.refreshError,
  errorCode: record.errorCode,
  latestSnapshot: record.latestSnapshot,
  refs: record.refs,
  snapshots: record.snapshots,
});

export const createInvestmentMarketRefreshService = ({
  repository,
  env,
  alphaVantageClient,
  now = () => new Date(),
  failureCooldownCache = defaultFailureCooldownCache,
}: InvestmentMarketRefreshServiceDependencies): InvestmentMarketRefreshService => {
  const refreshAsset = async (
    target: { assetType: InvestmentAssetRecordType; ticker: string },
    force: boolean,
  ): Promise<AssetRefreshRecord> => {
    const currentNow = now();
    const latestSnapshot = await repository.getLatestSnapshotByAsset(target.assetType, target.ticker);

    if (!force && latestSnapshot && isSameUtcDay(latestSnapshot, currentNow)) {
      return toAssetRecord(repository, target, {
        status: "skipped_fresh",
        staleWarning: null,
        refreshError: null,
        errorCode: null,
        latestSnapshot,
      });
    }

    const assetKey = toAssetKey(target.assetType, target.ticker);
    const activeCooldown = failureCooldownCache.get(assetKey);
    if (!force && activeCooldown && currentNow.getTime() < activeCooldown.expiresAtMs) {
      return toAssetRecord(repository, target, {
        status: "cooldown",
        staleWarning: activeCooldown.staleWarning,
        refreshError: COOLDOWN_ERROR,
        errorCode: activeCooldown.errorCode,
        latestSnapshot,
      });
    }

    if (activeCooldown && currentNow.getTime() >= activeCooldown.expiresAtMs) {
      failureCooldownCache.delete(assetKey);
    }

    const config = getAlphaVantageConfig(env);
    if (!config.apiKey) {
      const errorCode: MarketQuoteErrorCode = "MISSING_API_KEY";
      const staleWarning = resolveWarning(errorCode);
      const refreshError = "Missing ALPHA_VANTAGE_API_KEY environment variable.";
      failureCooldownCache.set(assetKey, {
        expiresAtMs: currentNow.getTime() + resolveCooldownMs(errorCode),
        staleWarning,
        refreshError,
        errorCode,
      });
      return toAssetRecord(repository, target, {
        status: toFallbackStatus(latestSnapshot),
        staleWarning,
        refreshError,
        errorCode,
        latestSnapshot,
      });
    }

    const provider = alphaVantageClient ?? createAlphaVantageClient({ timeoutMs: config.timeoutMs });

    try {
      const rawQuote = target.assetType === "crypto"
        ? await provider.fetchCryptoRate(target.ticker, config.apiKey)
        : await provider.fetchStockQuote(target.ticker, config.apiKey);
      const quote = withMarketQuoteAsOf(rawQuote, currentNow);
      const snapshot = await repository.addSnapshot({
        assetType: target.assetType,
        ticker: target.ticker,
        price: quote.currentPrice,
        source: quote.source,
        timestamp: quote.asOf,
        fetchedAt: currentNow.toISOString(),
        bid: quote.bid,
        ask: quote.ask,
      });
      await repository.updateDailyRefIfNeeded(target.assetType, target.ticker, quote.currentPrice, quote.asOf);
      const refs = await repository.updateMonthRefIfNeeded(target.assetType, target.ticker, quote.currentPrice, quote.asOf);
      const snapshots = await repository.listSnapshotsByAsset(target.assetType, target.ticker);
      failureCooldownCache.delete(assetKey);

      return {
        assetType: target.assetType,
        ticker: target.ticker,
        currentPrice: snapshot.price,
        lastUpdatedTimestamp: snapshot.timestamp,
        status: "refreshed",
        staleWarning: null,
        refreshError: null,
        errorCode: null,
        latestSnapshot: snapshot,
        refs,
        snapshots,
      };
    } catch (error) {
      const errorCode: MarketQuoteErrorCode = error instanceof AlphaVantageClientError ? error.code : "UNKNOWN";
      const refreshError = error instanceof Error ? error.message : "No se pudo actualizar la cotización.";
      const staleWarning = resolveWarning(errorCode);
      failureCooldownCache.set(assetKey, {
        expiresAtMs: currentNow.getTime() + resolveCooldownMs(errorCode),
        staleWarning,
        refreshError,
        errorCode,
      });
      return toAssetRecord(repository, target, {
        status: toFallbackStatus(latestSnapshot),
        staleWarning,
        refreshError,
        errorCode,
        latestSnapshot,
      });
    }
  };

  return {
    async refreshPositions(body) {
      const { force, targets } = await parseRequestTargets(repository, body);
      const assetRefreshCache = new Map<string, Promise<AssetRefreshRecord>>();

      const results: RefreshInvestmentPositionResult[] = [];
      for (const target of targets) {
        const assetKey = toAssetKey(target.assetType, target.ticker);
        let pending = assetRefreshCache.get(assetKey);
        if (!pending) {
          pending = refreshAsset({ assetType: target.assetType, ticker: target.ticker }, force);
          assetRefreshCache.set(assetKey, pending);
        }
        results.push(toResult(target, await pending));
      }

      return {
        refreshedAt: now().toISOString(),
        results,
      };
    },
  };
};

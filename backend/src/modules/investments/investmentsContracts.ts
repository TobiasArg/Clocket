import type { AddInvestmentEntryResult, InvestmentAssetRefsRecord, InvestmentEntryRecord, InvestmentPositionRecord, MarketQuoteSnapshotRecord } from "./investmentsRepository";
import type { MarketQuoteErrorCode } from "../market/marketQuoteContracts";

export type InvestmentPositionResponse = InvestmentPositionRecord;
export type InvestmentEntryResponse = InvestmentEntryRecord;
export type MarketQuoteSnapshotResponse = MarketQuoteSnapshotRecord;
export type InvestmentAssetRefsResponse = InvestmentAssetRefsRecord;
export type AddInvestmentEntryResponse = AddInvestmentEntryResult;

export interface InvestmentPositionListResponse { positions: InvestmentPositionResponse[] }
export interface InvestmentEntryListResponse { entries: InvestmentEntryResponse[] }
export interface MarketQuoteSnapshotListResponse { snapshots: MarketQuoteSnapshotResponse[] }
export interface InvestmentRefsMapResponse { refs: Record<string, InvestmentAssetRefsResponse> }
export interface DeleteInvestmentResponse { deleted: true }
export interface ClearInvestmentsResponse { cleared: true }

export interface RefreshInvestmentPositionsRequest {
  positionIds?: string[];
  assets?: Array<{
    assetType: "stock" | "crypto";
    ticker: string;
  }>;
  force?: boolean;
}

export type InvestmentRefreshStatus = "refreshed" | "skipped_fresh" | "stale_fallback" | "cooldown" | "no_snapshot";

export interface RefreshInvestmentPositionResult {
  positionId: string | null;
  assetType: "stock" | "crypto";
  ticker: string;
  currentPrice: string | null;
  lastUpdatedTimestamp: string | null;
  status: InvestmentRefreshStatus;
  staleWarning: string | null;
  refreshError: string | null;
  errorCode: MarketQuoteErrorCode | null;
  latestSnapshot: MarketQuoteSnapshotResponse | null;
  refs: InvestmentAssetRefsResponse | null;
  snapshots: MarketQuoteSnapshotResponse[];
}

export interface RefreshInvestmentPositionsResponse {
  refreshedAt: string;
  results: RefreshInvestmentPositionResult[];
}

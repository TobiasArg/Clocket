import type { AddInvestmentEntryResult, InvestmentAssetRefsRecord, InvestmentEntryRecord, InvestmentPositionRecord, MarketQuoteSnapshotRecord } from "./investmentsRepository";

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

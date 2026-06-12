import type { AddInvestmentEntryInput, AddInvestmentEntryResult, AddSnapshotInput, CreateInvestmentInput, InvestmentEntryItem, InvestmentPositionItem, InvestmentSnapshotItem, InvestmentsRepository, RefreshInvestmentPositionsRequest, RefreshInvestmentPositionsResult, UpdateInvestmentPatch } from "@/domain/investments/repository";
import type { AssetKey, AssetRefs, AssetType } from "@/domain/investments/portfolioTypes";
import { coreFinanceHttpClient, isNotFoundError, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import { ensureFeatureBackendCleanStartCutover } from "./featureDomainCleanStart";

interface PositionResponse { id: string; assetType: AssetType; ticker: string; usd_gastado: string; buy_price: string; amount: string; createdAt: string }
interface EntryResponse { id: string; positionId: string; assetType: AssetType; ticker: string; entryType: "ingreso" | "egreso"; usd_gastado: string; buy_price: string; amount: string; createdAt: string }
interface SnapshotResponse { id: string; ticker: string; assetType: AssetType; timestamp: string; price: string; source: InvestmentSnapshotItem["source"]; bid: string | null; ask: string | null }
interface RefsResponse { dailyRefPrice: string; dailyRefTimestamp: string; monthRefPrice: string; monthRefTimestamp: string }
interface PositionsResponse { positions: PositionResponse[] }
interface EntriesResponse { entries: EntryResponse[] }
interface SnapshotsResponse { snapshots: SnapshotResponse[] }
interface RefsMapResponse { refs: Record<AssetKey, RefsResponse> }
interface EntryResultResponse { position: PositionResponse | null; entry: EntryResponse }
interface DeleteResponse { deleted: true }
interface RefreshPositionResultResponse {
  positionId: string | null;
  assetType: AssetType;
  ticker: string;
  currentPrice: string | null;
  lastUpdatedTimestamp: string | null;
  status: RefreshInvestmentPositionsResult["results"][number]["status"];
  staleWarning: string | null;
  refreshError: string | null;
  errorCode: string | null;
  latestSnapshot: SnapshotResponse | null;
  refs: RefsResponse | null;
  snapshots: SnapshotResponse[];
}
interface RefreshPositionsResponse { refreshedAt: string; results: RefreshPositionResultResponse[] }

const toPosition = (position: PositionResponse): InvestmentPositionItem => ({
  id: position.id,
  assetType: position.assetType,
  ticker: position.ticker,
  usd_gastado: Number(position.usd_gastado),
  buy_price: Number(position.buy_price),
  amount: Number(position.amount),
  createdAt: position.createdAt,
});

const toEntry = (entry: EntryResponse): InvestmentEntryItem => ({
  id: entry.id,
  positionId: entry.positionId,
  assetType: entry.assetType,
  ticker: entry.ticker,
  entryType: entry.entryType,
  usd_gastado: Number(entry.usd_gastado),
  buy_price: Number(entry.buy_price),
  amount: Number(entry.amount),
  createdAt: entry.createdAt,
});

const toSnapshot = (snapshot: SnapshotResponse): InvestmentSnapshotItem => ({
  id: snapshot.id,
  ticker: snapshot.ticker,
  assetType: snapshot.assetType,
  timestamp: snapshot.timestamp,
  price: Number(snapshot.price),
  source: snapshot.source,
  ...(snapshot.bid !== null ? { bid: Number(snapshot.bid) } : {}),
  ...(snapshot.ask !== null ? { ask: Number(snapshot.ask) } : {}),
});

const toRefs = (refs: RefsResponse): AssetRefs => ({
  dailyRefPrice: Number(refs.dailyRefPrice),
  dailyRefTimestamp: refs.dailyRefTimestamp,
  monthRefPrice: Number(refs.monthRefPrice),
  monthRefTimestamp: refs.monthRefTimestamp,
});

const toRefreshResult = (result: RefreshPositionResultResponse): RefreshInvestmentPositionsResult["results"][number] => ({
  positionId: result.positionId,
  assetType: result.assetType,
  ticker: result.ticker,
  currentPrice: result.currentPrice === null ? null : Number(result.currentPrice),
  lastUpdatedTimestamp: result.lastUpdatedTimestamp,
  status: result.status,
  staleWarning: result.staleWarning,
  refreshError: result.refreshError,
  errorCode: result.errorCode,
  latestSnapshot: result.latestSnapshot ? toSnapshot(result.latestSnapshot) : null,
  refs: result.refs ? toRefs(result.refs) : null,
  snapshots: result.snapshots.map(toSnapshot),
});

export class HttpInvestmentsRepository implements InvestmentsRepository {
  public constructor() { ensureFeatureBackendCleanStartCutover(); }

  public async listPositions(): Promise<InvestmentPositionItem[]> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<PositionsResponse>("/api/investments/positions")).data.positions.map(toPosition));
  }

  public async getPositionById(id: string): Promise<InvestmentPositionItem | null> {
    try { return await withCoreFinanceErrors(async () => toPosition((await coreFinanceHttpClient.get<PositionResponse>(`/api/investments/positions/${id}`)).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async listEntriesByPosition(positionId: string): Promise<InvestmentEntryItem[]> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<EntriesResponse>(`/api/investments/positions/${positionId}/entries`)).data.entries.map(toEntry));
  }

  public async listEntriesByAsset(assetType: AssetType, ticker: string): Promise<InvestmentEntryItem[]> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<EntriesResponse>("/api/investments/entries", { params: { assetType, ticker } })).data.entries.map(toEntry));
  }

  public async addEntry(input: AddInvestmentEntryInput): Promise<AddInvestmentEntryResult> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.post<EntryResultResponse>("/api/investments/entries", input);
      return { position: response.data.position ? toPosition(response.data.position) : null, entry: toEntry(response.data.entry) };
    });
  }

  public async deleteEntry(entryId: string): Promise<boolean> {
    try { return await withCoreFinanceErrors(async () => (await coreFinanceHttpClient.delete<DeleteResponse>(`/api/investments/entries/${entryId}`)).data.deleted === true); }
    catch (error) { if (isNotFoundError(error)) return false; throw error; }
  }

  public async addPosition(input: CreateInvestmentInput): Promise<InvestmentPositionItem> {
    return withCoreFinanceErrors(async () => toPosition((await coreFinanceHttpClient.post<PositionResponse>("/api/investments/positions", input)).data));
  }

  public async editPosition(id: string, patch: UpdateInvestmentPatch): Promise<InvestmentPositionItem | null> {
    try { return await withCoreFinanceErrors(async () => toPosition((await coreFinanceHttpClient.patch<PositionResponse>(`/api/investments/positions/${id}`, patch)).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async deletePosition(id: string): Promise<boolean> {
    try { return await withCoreFinanceErrors(async () => (await coreFinanceHttpClient.delete<DeleteResponse>(`/api/investments/positions/${id}`)).data.deleted === true); }
    catch (error) { if (isNotFoundError(error)) return false; throw error; }
  }

  public async addSnapshot(input: AddSnapshotInput): Promise<InvestmentSnapshotItem> {
    return withCoreFinanceErrors(async () => toSnapshot((await coreFinanceHttpClient.post<SnapshotResponse>("/api/investments/snapshots", input)).data));
  }

  public async listSnapshotsByAsset(assetType: AssetType, ticker: string): Promise<InvestmentSnapshotItem[]> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<SnapshotsResponse>("/api/investments/snapshots", { params: { assetType, ticker } })).data.snapshots.map(toSnapshot));
  }

  public async getLatestSnapshotByAsset(assetType: AssetType, ticker: string): Promise<InvestmentSnapshotItem | null> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.get<SnapshotResponse | null>("/api/investments/snapshots/latest", { params: { assetType, ticker } });
      return response.data ? toSnapshot(response.data) : null;
    });
  }

  public async getOrInitRefs(assetType: AssetType, ticker: string): Promise<AssetRefs> {
    return withCoreFinanceErrors(async () => toRefs((await coreFinanceHttpClient.get<RefsResponse>("/api/investments/refs", { params: { assetType, ticker } })).data));
  }

  public async updateDailyRefIfNeeded(assetType: AssetType, ticker: string, currentPrice: number, timestamp?: string): Promise<AssetRefs> {
    return withCoreFinanceErrors(async () => toRefs((await coreFinanceHttpClient.patch<RefsResponse>("/api/investments/refs/daily", { assetType, ticker, currentPrice, timestamp })).data));
  }

  public async updateMonthRefIfNeeded(assetType: AssetType, ticker: string, currentPrice: number, timestamp?: string): Promise<AssetRefs> {
    return withCoreFinanceErrors(async () => toRefs((await coreFinanceHttpClient.patch<RefsResponse>("/api/investments/refs/monthly", { assetType, ticker, currentPrice, timestamp })).data));
  }

  public async getRefsMap(): Promise<Record<AssetKey, AssetRefs>> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.get<RefsMapResponse>("/api/investments/refs");
      return Object.fromEntries(Object.entries(response.data.refs).map(([key, refs]) => [key, toRefs(refs)])) as Record<AssetKey, AssetRefs>;
    });
  }

  public async refreshPositions(input: RefreshInvestmentPositionsRequest): Promise<RefreshInvestmentPositionsResult> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.post<RefreshPositionsResponse>("/api/investments/positions/refresh", input);
      return {
        refreshedAt: response.data.refreshedAt,
        results: response.data.results.map(toRefreshResult),
      };
    });
  }

  public async clearAll(): Promise<void> {
    await withCoreFinanceErrors(async () => { await coreFinanceHttpClient.delete("/api/investments/positions"); });
  }
}

export const httpInvestmentsRepository: InvestmentsRepository = new HttpInvestmentsRepository();

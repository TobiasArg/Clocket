import { readSingleQueryParam } from "../../api/http";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { parseJsonObjectBody, readDecimalInput, readOptionalNullableString, readRequiredString } from "../core-finance/coreFinanceRequest";
import { isValidTicker as isValidMarketTicker } from "../market/marketQuoteContracts";
import type { AddInvestmentEntryResponse, ClearInvestmentsResponse, DeleteInvestmentResponse, InvestmentAssetRefsResponse, InvestmentEntryListResponse, InvestmentPositionListResponse, InvestmentPositionResponse, InvestmentRefsMapResponse, MarketQuoteSnapshotListResponse, MarketQuoteSnapshotResponse } from "./investmentsContracts";
import { InvestmentsRepositoryError, type AddInvestmentEntryInput, type AddMarketQuoteSnapshotInput, type InvestmentAssetRecordType, type InvestmentEntryRecordType, type InvestmentsRepository, type UpsertInvestmentPositionInput } from "./investmentsRepository";

export interface InvestmentsService {
  listPositions: () => Promise<InvestmentPositionListResponse>;
  getPosition: (id: string) => Promise<InvestmentPositionResponse>;
  addPosition: (body: unknown) => Promise<InvestmentPositionResponse>;
  editPosition: (id: string, body: unknown) => Promise<InvestmentPositionResponse>;
  deletePosition: (id: string) => Promise<DeleteInvestmentResponse>;
  listEntriesByPosition: (positionId: string) => Promise<InvestmentEntryListResponse>;
  listEntriesByAsset: (query: Record<string, string | string[] | undefined>) => Promise<InvestmentEntryListResponse>;
  addEntry: (body: unknown) => Promise<AddInvestmentEntryResponse>;
  deleteEntry: (id: string) => Promise<DeleteInvestmentResponse>;
  addSnapshot: (body: unknown) => Promise<MarketQuoteSnapshotResponse>;
  listSnapshotsByAsset: (query: Record<string, string | string[] | undefined>) => Promise<MarketQuoteSnapshotListResponse>;
  getLatestSnapshotByAsset: (query: Record<string, string | string[] | undefined>) => Promise<MarketQuoteSnapshotResponse | null>;
  getRefs: (query?: Record<string, string | string[] | undefined>) => Promise<InvestmentAssetRefsResponse | InvestmentRefsMapResponse>;
  updateDailyRef: (body: unknown) => Promise<InvestmentAssetRefsResponse>;
  updateMonthRef: (body: unknown) => Promise<InvestmentAssetRefsResponse>;
  clearAll: () => Promise<ClearInvestmentsResponse>;
}

const isAssetType = (value: unknown): value is InvestmentAssetRecordType => value === "stock" || value === "crypto";
const isEntryType = (value: unknown): value is InvestmentEntryRecordType => value === "ingreso" || value === "egreso";
const isSnapshotSource = (value: unknown): value is "GLOBAL_QUOTE" | "CURRENCY_EXCHANGE_RATE" => value === "GLOBAL_QUOTE" || value === "CURRENCY_EXCHANGE_RATE";
const MONEY_DECIMAL = { precision: 18, scale: 2, positive: true } as const;
const PRECISE_DECIMAL = { precision: 28, scale: 10, positive: true } as const;

const readAssetType = (value: unknown): InvestmentAssetRecordType => {
  if (!isAssetType(value)) throw new CoreFinanceApiError("Asset type must be 'stock' or 'crypto'.", { code: "INVALID_ASSET_TYPE", status: 400 });
  return value;
};

const readTicker = (value: unknown): string => {
  const ticker = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!isValidMarketTicker(ticker)) {
    throw new CoreFinanceApiError("Ticker must start with a letter and contain only letters, numbers, dots, or hyphens.", { code: "INVALID_TICKER", status: 400 });
  }
  return ticker;
};

const readDateTime = (body: Record<string, unknown>, key: string): string | undefined => {
  if (!(key in body)) return undefined;
  if (typeof body[key] !== "string" || Number.isNaN(new Date(body[key]).getTime())) throw new CoreFinanceApiError(`Field '${key}' must be a valid ISO date-time string.`, { code: "INVALID_REQUEST", status: 400 });
  return body[key];
};

const readOptionalDecimal = (body: Record<string, unknown>, key: string): string | number | undefined => {
  const value = readDecimalInput(body, key, false, PRECISE_DECIMAL);
  if (!value.ok) throw new CoreFinanceApiError(value.response.error, value.response);
  return value.value;
};

const readRequiredDecimal = (
  body: Record<string, unknown>,
  key: string,
  decimalOptions: Parameters<typeof readDecimalInput>[3] = PRECISE_DECIMAL,
): string | number => {
  const value = readDecimalInput(body, key, true, decimalOptions);
  if (!value.ok || value.value === undefined) throw new CoreFinanceApiError(value.ok ? `Field '${key}' is required.` : value.response.error, value.ok ? { code: "INVALID_REQUEST", status: 400 } : value.response);
  return value.value;
};

const readAssetQuery = (query: Record<string, string | string[] | undefined>) => ({
  assetType: readAssetType(readSingleQueryParam(query.assetType)),
  ticker: readTicker(readSingleQueryParam(query.ticker)),
});

export const createInvestmentsService = ({ repository }: { repository: InvestmentsRepository }): InvestmentsService => {
  const requireFound = <T>(record: T | null, label: string, id: string): T => {
    if (!record) throw new CoreFinanceApiError(`${label} '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
    return record;
  };

  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try { return await operation(); }
    catch (error) {
      if (error instanceof InvestmentsRepositoryError) throw new CoreFinanceApiError(error.message, { code: error.code, status: error.code === "TRANSACTION_ALREADY_LINKED" ? 409 : 400 });
      throw error;
    }
  };

  const parseEntry = (body: unknown): AddInvestmentEntryInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    return {
      assetType: readAssetType(parsedBody.value.assetType),
      ticker: readTicker(parsedBody.value.ticker),
      displayName: readOptionalNullableString(parsedBody.value, "displayName"),
      entryType: isEntryType(parsedBody.value.entryType) ? parsedBody.value.entryType : (() => { throw new CoreFinanceApiError("Entry type must be 'ingreso' or 'egreso'.", { code: "INVALID_ENTRY_TYPE", status: 400 }); })(),
      usd_gastado: readRequiredDecimal(parsedBody.value, "usd_gastado", MONEY_DECIMAL),
      buy_price: readRequiredDecimal(parsedBody.value, "buy_price"),
      createdAt: readDateTime(parsedBody.value, "createdAt"),
      transactionId: readOptionalNullableString(parsedBody.value, "transactionId"),
    };
  };

  const parsePosition = (body: unknown, partial = false): UpsertInvestmentPositionInput | Partial<UpsertInvestmentPositionInput> => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: Partial<UpsertInvestmentPositionInput> = {};
    if (!partial || "assetType" in parsedBody.value) patch.assetType = readAssetType(parsedBody.value.assetType);
    if (!partial || "ticker" in parsedBody.value) patch.ticker = readTicker(parsedBody.value.ticker);
    if ("displayName" in parsedBody.value) patch.displayName = readOptionalNullableString(parsedBody.value, "displayName");
    if ("entryType" in parsedBody.value) {
      if (!isEntryType(parsedBody.value.entryType)) throw new CoreFinanceApiError("Entry type must be 'ingreso' or 'egreso'.", { code: "INVALID_ENTRY_TYPE", status: 400 });
      patch.entryType = parsedBody.value.entryType;
    }
    if (!partial || "usd_gastado" in parsedBody.value) patch.usd_gastado = readRequiredDecimal(parsedBody.value, "usd_gastado", MONEY_DECIMAL);
    if (!partial || "buy_price" in parsedBody.value) patch.buy_price = readRequiredDecimal(parsedBody.value, "buy_price");
    patch.createdAt = readDateTime(parsedBody.value, "createdAt");
    return patch as UpsertInvestmentPositionInput;
  };

  const parseSnapshot = (body: unknown): AddMarketQuoteSnapshotInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    if (!isSnapshotSource(parsedBody.value.source)) throw new CoreFinanceApiError("Invalid snapshot source.", { code: "INVALID_REQUEST", status: 400 });
    return {
      assetType: readAssetType(parsedBody.value.assetType),
      ticker: readTicker(parsedBody.value.ticker),
      displayName: readOptionalNullableString(parsedBody.value, "displayName"),
      price: readRequiredDecimal(parsedBody.value, "price"),
      source: parsedBody.value.source,
      timestamp: readDateTime(parsedBody.value, "timestamp"),
      fetchedAt: readDateTime(parsedBody.value, "fetchedAt"),
      bid: readOptionalDecimal(parsedBody.value, "bid") ?? null,
      ask: readOptionalDecimal(parsedBody.value, "ask") ?? null,
    };
  };

  const parseRefUpdate = (body: unknown) => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    return {
      assetType: readAssetType(parsedBody.value.assetType),
      ticker: readTicker(parsedBody.value.ticker),
      currentPrice: readRequiredDecimal(parsedBody.value, "currentPrice"),
      timestamp: readDateTime(parsedBody.value, "timestamp"),
    };
  };

  return {
    async listPositions() { return { positions: await repository.listPositions() }; },
    async getPosition(id) { return requireFound(await repository.getPositionById(id), "Investment position", id); },
    async addPosition(body) { return run(() => repository.addPosition(parsePosition(body) as UpsertInvestmentPositionInput)); },
    async editPosition(id, body) { return requireFound(await run(() => repository.editPosition(id, parsePosition(body, true))), "Investment position", id); },
    async deletePosition(id) { if (!await repository.deletePosition(id)) throw new CoreFinanceApiError(`Investment position '${id}' was not found.`, { code: "NOT_FOUND", status: 404 }); return { deleted: true }; },
    async listEntriesByPosition(positionId) { return { entries: await repository.listEntriesByPosition(positionId) }; },
    async listEntriesByAsset(query) { const asset = readAssetQuery(query); return { entries: await repository.listEntriesByAsset(asset.assetType, asset.ticker) }; },
    async addEntry(body) { return run(() => repository.addEntry(parseEntry(body))); },
    async deleteEntry(id) { if (!await repository.deleteEntry(id)) throw new CoreFinanceApiError(`Investment entry '${id}' was not found.`, { code: "NOT_FOUND", status: 404 }); return { deleted: true }; },
    async addSnapshot(body) { return run(() => repository.addSnapshot(parseSnapshot(body))); },
    async listSnapshotsByAsset(query) { const asset = readAssetQuery(query); return { snapshots: await repository.listSnapshotsByAsset(asset.assetType, asset.ticker) }; },
    async getLatestSnapshotByAsset(query) { const asset = readAssetQuery(query); return repository.getLatestSnapshotByAsset(asset.assetType, asset.ticker); },
    async getRefs(query = {}) { const hasAsset = Boolean(readSingleQueryParam(query.assetType).trim() || readSingleQueryParam(query.ticker).trim()); if (!hasAsset) return { refs: await repository.getRefsMap() }; const asset = readAssetQuery(query); const refs = await repository.getRefsByAsset(asset.assetType, asset.ticker); if (!refs) throw new CoreFinanceApiError(`Investment refs for '${asset.ticker}' were not found.`, { code: "NOT_FOUND", status: 404 }); return refs; },
    async updateDailyRef(body) { const input = parseRefUpdate(body); return run(() => repository.updateDailyRefIfNeeded(input.assetType, input.ticker, input.currentPrice, input.timestamp)); },
    async updateMonthRef(body) { const input = parseRefUpdate(body); return run(() => repository.updateMonthRefIfNeeded(input.assetType, input.ticker, input.currentPrice, input.timestamp)); },
    async clearAll() { await repository.clearAll(); return { cleared: true }; },
  };
};

export type AssetType = "stock" | "crypto";

export type SnapshotSource = "GLOBAL_QUOTE" | "CURRENCY_EXCHANGE_RATE";

export type AssetKey = `${AssetType}:${string}`;
export type EntryType = "ingreso" | "egreso";

export interface Position {
  id: string;
  assetType: AssetType;
  ticker: string;
  usd_gastado: number;
  buy_price: number;
  amount: number;
  createdAt: string;
}

export interface PositionEntry {
  id: string;
  positionId: string;
  assetType: AssetType;
  ticker: string;
  entryType: EntryType;
  usd_gastado: number;
  buy_price: number;
  amount: number;
  createdAt: string;
}

export interface Snapshot {
  id: string;
  ticker: string;
  assetType: AssetType;
  timestamp: string;
  price: number;
  source: SnapshotSource;
  bid?: number;
  ask?: number;
}

export interface AssetRefs {
  dailyRefPrice: number;
  dailyRefTimestamp: string;
  monthRefPrice: number;
  monthRefTimestamp: string;
}

export interface HistoricalPoint {
  timestamp: string;
  equity: number;
  pnlVsInvested: number;
}

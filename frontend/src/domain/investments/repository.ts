import type {
  AssetKey,
  AssetRefs,
  AssetType,
  Position,
  Snapshot,
  SnapshotSource,
} from "./portfolioTypes";

export type InvestmentPositionItem = Position;
export type InvestmentSnapshotItem = Snapshot;

export interface CreateInvestmentInput {
  assetType: AssetType;
  ticker: string;
  usd_gastado: number;
  buy_price: number;
  createdAt?: string;
}

export interface UpdateInvestmentPatch {
  assetType?: AssetType;
  ticker?: string;
  usd_gastado?: number;
  buy_price?: number;
  createdAt?: string;
}

export interface AddSnapshotInput {
  ticker: string;
  assetType: AssetType;
  price: number;
  source: SnapshotSource;
  timestamp?: string;
  bid?: number;
  ask?: number;
}

export interface InvestmentsRepository {
  listPositions: () => Promise<InvestmentPositionItem[]>;
  getPositionById: (id: string) => Promise<InvestmentPositionItem | null>;
  addPosition: (input: CreateInvestmentInput) => Promise<InvestmentPositionItem>;
  editPosition: (
    id: string,
    patch: UpdateInvestmentPatch,
  ) => Promise<InvestmentPositionItem | null>;
  deletePosition: (id: string) => Promise<boolean>;
  addSnapshot: (input: AddSnapshotInput) => Promise<InvestmentSnapshotItem>;
  listSnapshotsByAsset: (
    assetType: AssetType,
    ticker: string,
  ) => Promise<InvestmentSnapshotItem[]>;
  getLatestSnapshotByAsset: (
    assetType: AssetType,
    ticker: string,
  ) => Promise<InvestmentSnapshotItem | null>;
  getOrInitRefs: (assetType: AssetType, ticker: string) => Promise<AssetRefs>;
  updateDailyRefIfNeeded: (
    assetType: AssetType,
    ticker: string,
    currentPrice: number,
    timestamp?: string,
  ) => Promise<AssetRefs>;
  updateMonthRefIfNeeded: (
    assetType: AssetType,
    ticker: string,
    currentPrice: number,
    timestamp?: string,
  ) => Promise<AssetRefs>;
  getRefsMap: () => Promise<Record<AssetKey, AssetRefs>>;
  clearAll: () => Promise<void>;
}

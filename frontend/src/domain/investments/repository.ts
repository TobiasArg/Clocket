import type {
  AssetKey,
  AssetRefs,
  AssetType,
  EntryType,
  Position,
  PositionEntry,
  Snapshot,
  SnapshotSource,
} from "./portfolioTypes";

export type InvestmentPositionItem = Position;
export type InvestmentSnapshotItem = Snapshot;
export type InvestmentEntryItem = PositionEntry;

export interface CreateInvestmentInput {
  assetType: AssetType;
  ticker: string;
  entryType?: EntryType;
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

export interface AddInvestmentEntryInput {
  assetType: AssetType;
  ticker: string;
  entryType: EntryType;
  usd_gastado: number;
  buy_price: number;
  createdAt?: string;
}

export interface AddInvestmentEntryResult {
  position: InvestmentPositionItem | null;
  entry: InvestmentEntryItem;
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

export interface RefreshInvestmentAssetInput {
  assetType: AssetType;
  ticker: string;
}

export interface RefreshInvestmentPositionsRequest {
  positionIds?: string[];
  assets?: RefreshInvestmentAssetInput[];
  force?: boolean;
}

export type InvestmentRefreshStatus = "refreshed" | "skipped_fresh" | "stale_fallback" | "cooldown" | "no_snapshot";

export interface RefreshInvestmentPositionResult {
  positionId: string | null;
  assetType: AssetType;
  ticker: string;
  currentPrice: number | null;
  lastUpdatedTimestamp: string | null;
  status: InvestmentRefreshStatus;
  staleWarning: string | null;
  refreshError: string | null;
  errorCode: string | null;
  latestSnapshot: InvestmentSnapshotItem | null;
  refs: AssetRefs | null;
  snapshots: InvestmentSnapshotItem[];
}

export interface RefreshInvestmentPositionsResult {
  refreshedAt: string;
  results: RefreshInvestmentPositionResult[];
}

export interface InvestmentsRepository {
  listPositions: () => Promise<InvestmentPositionItem[]>;
  getPositionById: (id: string) => Promise<InvestmentPositionItem | null>;
  listEntriesByPosition: (positionId: string) => Promise<InvestmentEntryItem[]>;
  listEntriesByAsset: (
    assetType: AssetType,
    ticker: string,
  ) => Promise<InvestmentEntryItem[]>;
  addEntry: (input: AddInvestmentEntryInput) => Promise<AddInvestmentEntryResult>;
  deleteEntry: (entryId: string) => Promise<boolean>;
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
  refreshPositions: (input: RefreshInvestmentPositionsRequest) => Promise<RefreshInvestmentPositionsResult>;
  clearAll: () => Promise<void>;
}

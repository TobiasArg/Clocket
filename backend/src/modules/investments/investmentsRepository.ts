import {
  Prisma,
  type AssetType as PrismaAssetType,
  type InvestmentEntryType as PrismaInvestmentEntryType,
  type PrismaClient,
  type SnapshotSource,
} from "../../generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type InvestmentAssetRecordType = "stock" | "crypto";
export type InvestmentEntryRecordType = "ingreso" | "egreso";

export type InvestmentsRepositoryErrorCode =
  | "INVALID_ASSET_TYPE"
  | "INVALID_TICKER"
  | "INVALID_ENTRY_TYPE"
  | "INVALID_AMOUNT"
  | "INVALID_PRICE"
  | "MISSING_TRANSACTION"
  | "TRANSACTION_ALREADY_LINKED"
  | "OVERSOLD_POSITION";

export class InvestmentsRepositoryError extends Error {
  public readonly code: InvestmentsRepositoryErrorCode;

  public constructor(code: InvestmentsRepositoryErrorCode, message: string) {
    super(message);
    this.name = "InvestmentsRepositoryError";
    this.code = code;
  }
}

export interface InvestmentPositionRecord {
  id: string;
  assetId: string;
  assetType: InvestmentAssetRecordType;
  ticker: string;
  displayName: string | null;
  usd_gastado: string;
  buy_price: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvestmentEntryRecord {
  id: string;
  positionId: string;
  assetId: string;
  assetType: InvestmentAssetRecordType;
  ticker: string;
  entryType: InvestmentEntryRecordType;
  usd_gastado: string;
  buy_price: string;
  amount: string;
  transactionId: string | null;
  createdAt: string;
}

export interface MarketQuoteSnapshotRecord {
  id: string;
  assetId: string;
  assetType: InvestmentAssetRecordType;
  ticker: string;
  timestamp: string;
  price: string;
  source: SnapshotSource;
  bid: string | null;
  ask: string | null;
  providerAsOf: string | null;
  fetchedAt: string;
}

export interface InvestmentAssetRefsRecord {
  assetId: string;
  assetType: InvestmentAssetRecordType;
  ticker: string;
  dailyRefPrice: string;
  dailyRefTimestamp: string;
  monthRefPrice: string;
  monthRefTimestamp: string;
  updatedAt: string;
}

export interface AddInvestmentEntryInput {
  assetType: InvestmentAssetRecordType;
  ticker: string;
  displayName?: string | null;
  entryType: InvestmentEntryRecordType;
  usd_gastado: DecimalInput;
  buy_price: DecimalInput;
  createdAt?: string | Date;
  transactionId?: string | null;
}

export interface UpsertInvestmentPositionInput {
  assetType: InvestmentAssetRecordType;
  ticker: string;
  displayName?: string | null;
  entryType?: InvestmentEntryRecordType;
  usd_gastado: DecimalInput;
  buy_price: DecimalInput;
  createdAt?: string | Date;
}

export interface AddInvestmentEntryResult {
  position: InvestmentPositionRecord | null;
  entry: InvestmentEntryRecord;
}

export interface AddMarketQuoteSnapshotInput {
  assetType: InvestmentAssetRecordType;
  ticker: string;
  displayName?: string | null;
  price: DecimalInput;
  source: SnapshotSource;
  timestamp?: string | Date;
  fetchedAt?: string | Date;
  bid?: DecimalInput | null;
  ask?: DecimalInput | null;
}

export interface InvestmentsRepository {
  listPositions: () => Promise<InvestmentPositionRecord[]>;
  getPositionById: (id: string) => Promise<InvestmentPositionRecord | null>;
  addPosition: (input: UpsertInvestmentPositionInput) => Promise<InvestmentPositionRecord>;
  editPosition: (id: string, input: Partial<UpsertInvestmentPositionInput>) => Promise<InvestmentPositionRecord | null>;
  deletePosition: (id: string) => Promise<boolean>;
  listEntriesByPosition: (positionId: string) => Promise<InvestmentEntryRecord[]>;
  listEntriesByAsset: (
    assetType: InvestmentAssetRecordType,
    ticker: string,
  ) => Promise<InvestmentEntryRecord[]>;
  addEntry: (input: AddInvestmentEntryInput) => Promise<AddInvestmentEntryResult>;
  deleteEntry: (entryId: string) => Promise<boolean>;
  addSnapshot: (input: AddMarketQuoteSnapshotInput) => Promise<MarketQuoteSnapshotRecord>;
  listSnapshotsByAsset: (
    assetType: InvestmentAssetRecordType,
    ticker: string,
  ) => Promise<MarketQuoteSnapshotRecord[]>;
  getLatestSnapshotByAsset: (
    assetType: InvestmentAssetRecordType,
    ticker: string,
  ) => Promise<MarketQuoteSnapshotRecord | null>;
  getOrInitRefs: (
    assetType: InvestmentAssetRecordType,
    ticker: string,
  ) => Promise<InvestmentAssetRefsRecord>;
  updateDailyRefIfNeeded: (
    assetType: InvestmentAssetRecordType,
    ticker: string,
    currentPrice: DecimalInput,
    timestamp?: string | Date,
  ) => Promise<InvestmentAssetRefsRecord>;
  updateMonthRefIfNeeded: (
    assetType: InvestmentAssetRecordType,
    ticker: string,
    currentPrice: DecimalInput,
    timestamp?: string | Date,
  ) => Promise<InvestmentAssetRefsRecord>;
  getRefsMap: () => Promise<Record<string, InvestmentAssetRefsRecord>>;
  clearAll: () => Promise<void>;
}

const EPSILON = new Prisma.Decimal("0.00000001");

const assetWithRefs = { refs: true } satisfies Prisma.InvestmentAssetInclude;
const positionWithAsset = { asset: true } satisfies Prisma.InvestmentPositionInclude;
const entryWithAsset = { asset: true } satisfies Prisma.InvestmentEntryInclude;
const snapshotWithAsset = { asset: true } satisfies Prisma.MarketQuoteSnapshotInclude;
const refsWithAsset = { asset: true } satisfies Prisma.InvestmentAssetRefInclude;

type AssetModel = Prisma.InvestmentAssetGetPayload<{ include: typeof assetWithRefs }>;
type PositionModel = Prisma.InvestmentPositionGetPayload<{ include: typeof positionWithAsset }>;
type EntryModel = Prisma.InvestmentEntryGetPayload<{ include: typeof entryWithAsset }>;
type SnapshotModel = Prisma.MarketQuoteSnapshotGetPayload<{ include: typeof snapshotWithAsset }>;
type RefsModel = Prisma.InvestmentAssetRefGetPayload<{ include: typeof refsWithAsset }>;

type InvestmentsTransactionClient = Pick<
  PrismaClient,
  "investmentAsset" | "investmentPosition" | "investmentEntry" | "investmentAssetRef" | "marketQuoteSnapshot" | "transaction"
>;

const ASSET_TO_PRISMA: Record<InvestmentAssetRecordType, PrismaAssetType> = {
  stock: "STOCK",
  crypto: "CRYPTO",
};

const ASSET_FROM_PRISMA: Record<PrismaAssetType, InvestmentAssetRecordType> = {
  STOCK: "stock",
  CRYPTO: "crypto",
};

const ENTRY_TO_PRISMA: Record<InvestmentEntryRecordType, PrismaInvestmentEntryType> = {
  ingreso: "INCOME",
  egreso: "EXPENSE",
};

const ENTRY_FROM_PRISMA: Record<PrismaInvestmentEntryType, InvestmentEntryRecordType> = {
  INCOME: "ingreso",
  EXPENSE: "egreso",
};

interface PositionSummary {
  netUnits: Prisma.Decimal;
  netCost: Prisma.Decimal;
  fallbackBuyPrice: Prisma.Decimal;
}

const toIso = (value: Date): string => value.toISOString();
const toDecimal = (value: DecimalInput): Prisma.Decimal => new Prisma.Decimal(value);
const toMoney = (value: Prisma.Decimal): string => value.toFixed(2);
const toPrecise = (value: Prisma.Decimal): string => value.toFixed(10);

const toDate = (value: string | Date | undefined): Date | undefined => {
  if (value === undefined) return undefined;
  return value instanceof Date ? value : new Date(value);
};

const trimNullable = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeAssetType = (value: InvestmentAssetRecordType): InvestmentAssetRecordType => {
  if (value !== "stock" && value !== "crypto") {
    throw new InvestmentsRepositoryError("INVALID_ASSET_TYPE", "Asset type must be stock or crypto.");
  }
  return value;
};

const normalizeTicker = (value: string): string => {
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    throw new InvestmentsRepositoryError("INVALID_TICKER", "Ticker is required.");
  }
  return normalized;
};

const normalizeEntryType = (value: InvestmentEntryRecordType): InvestmentEntryRecordType => {
  if (value !== "ingreso" && value !== "egreso") {
    throw new InvestmentsRepositoryError("INVALID_ENTRY_TYPE", "Entry type must be ingreso or egreso.");
  }
  return value;
};

const parsePositiveDecimal = (
  value: DecimalInput,
  code: InvestmentsRepositoryErrorCode,
  label: string,
): Prisma.Decimal => {
  const decimal = toDecimal(value);
  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new InvestmentsRepositoryError(code, `${label} must be greater than zero.`);
  }
  return decimal;
};

const toInvestmentPositionRecord = (position: PositionModel): InvestmentPositionRecord => ({
  id: position.id,
  assetId: position.assetId,
  assetType: ASSET_FROM_PRISMA[position.asset.assetType],
  ticker: position.asset.ticker,
  displayName: position.asset.displayName,
  usd_gastado: toMoney(position.totalInvested),
  buy_price: toPrecise(position.averageBuyPrice),
  amount: toPrecise(position.amount),
  createdAt: toIso(position.createdAt),
  updatedAt: toIso(position.updatedAt),
  deletedAt: position.deletedAt ? toIso(position.deletedAt) : null,
});

const toInvestmentEntryRecord = (entry: EntryModel): InvestmentEntryRecord => ({
  id: entry.id,
  positionId: entry.positionId,
  assetId: entry.assetId,
  assetType: ASSET_FROM_PRISMA[entry.asset.assetType],
  ticker: entry.asset.ticker,
  entryType: ENTRY_FROM_PRISMA[entry.entryType],
  usd_gastado: toMoney(entry.amountUsd),
  buy_price: toPrecise(entry.buyPrice),
  amount: toPrecise(entry.units),
  transactionId: entry.transactionId,
  createdAt: toIso(entry.createdAt),
});

const toSnapshotRecord = (snapshot: SnapshotModel): MarketQuoteSnapshotRecord => ({
  id: snapshot.id,
  assetId: snapshot.assetId,
  assetType: ASSET_FROM_PRISMA[snapshot.asset.assetType],
  ticker: snapshot.asset.ticker,
  timestamp: toIso(snapshot.providerAsOf ?? snapshot.fetchedAt),
  price: toPrecise(snapshot.price),
  source: snapshot.source,
  bid: snapshot.bid ? toPrecise(snapshot.bid) : null,
  ask: snapshot.ask ? toPrecise(snapshot.ask) : null,
  providerAsOf: snapshot.providerAsOf ? toIso(snapshot.providerAsOf) : null,
  fetchedAt: toIso(snapshot.fetchedAt),
});

const toRefsRecord = (refs: RefsModel): InvestmentAssetRefsRecord => ({
  assetId: refs.assetId,
  assetType: ASSET_FROM_PRISMA[refs.asset.assetType],
  ticker: refs.asset.ticker,
  dailyRefPrice: toPrecise(refs.dailyRefPrice),
  dailyRefTimestamp: toIso(refs.dailyRefTimestamp),
  monthRefPrice: toPrecise(refs.monthRefPrice),
  monthRefTimestamp: toIso(refs.monthRefTimestamp),
  updatedAt: toIso(refs.updatedAt),
});

const byEntryCreatedAtAsc = (left: EntryModel, right: EntryModel): number => {
  const createdDiff = left.createdAt.getTime() - right.createdAt.getTime();
  if (createdDiff !== 0) return createdDiff;
  if (left.entryType !== right.entryType) return left.entryType === "INCOME" ? -1 : 1;
  return left.id.localeCompare(right.id);
};

const summarizeEntries = (entries: EntryModel[]): PositionSummary => {
  let netUnits = new Prisma.Decimal(0);
  let netCost = new Prisma.Decimal(0);
  let fallbackBuyPrice = new Prisma.Decimal(0);

  for (const entry of entries.slice().sort(byEntryCreatedAtAsc)) {
    fallbackBuyPrice = entry.buyPrice;
    if (entry.entryType === "INCOME") {
      netUnits = netUnits.plus(entry.units);
      netCost = netCost.plus(entry.amountUsd);
      continue;
    }

    if (netUnits.lte(EPSILON)) {
      netUnits = new Prisma.Decimal(0);
      netCost = new Prisma.Decimal(0);
      continue;
    }

    const sellUnits = Prisma.Decimal.min(entry.units, netUnits);
    const averageCost = netUnits.gt(EPSILON) ? netCost.div(netUnits) : new Prisma.Decimal(0);
    netUnits = netUnits.minus(sellUnits);
    netCost = netCost.minus(averageCost.mul(sellUnits));

    if (netUnits.lte(EPSILON)) {
      netUnits = new Prisma.Decimal(0);
      netCost = new Prisma.Decimal(0);
    }
  }

  return { netUnits, netCost, fallbackBuyPrice };
};

const toUtcDayKey = (value: Date): string => value.toISOString().slice(0, 10);
const toUtcMonthKey = (value: Date): string => value.toISOString().slice(0, 7);

const getOrCreateAsset = async (
  tx: InvestmentsTransactionClient,
  input: {
    assetType: InvestmentAssetRecordType;
    ticker: string;
    displayName?: string | null;
  },
): Promise<AssetModel> => {
  const assetType = ASSET_TO_PRISMA[normalizeAssetType(input.assetType)];
  const ticker = normalizeTicker(input.ticker);
  const displayName = trimNullable(input.displayName);

  return tx.investmentAsset.upsert({
    where: { assetType_ticker: { assetType, ticker } },
    update: {
      ...(input.displayName !== undefined ? { displayName: displayName ?? null } : {}),
    },
    create: {
      assetType,
      ticker,
      displayName: displayName ?? null,
    },
    include: assetWithRefs,
  });
};

const ensurePositionForAsset = async (
  tx: InvestmentsTransactionClient,
  assetId: string,
): Promise<PositionModel> => {
  const existing = await tx.investmentPosition.findUnique({
    where: { assetId },
    include: positionWithAsset,
  });
  if (existing) return existing;

  return tx.investmentPosition.create({
    data: {
      assetId,
      totalInvested: new Prisma.Decimal(0),
      averageBuyPrice: new Prisma.Decimal(0),
      amount: new Prisma.Decimal(0),
    },
    include: positionWithAsset,
  });
};

const rebuildPositionForAsset = async (
  tx: InvestmentsTransactionClient,
  assetId: string,
): Promise<PositionModel | null> => {
  const position = await ensurePositionForAsset(tx, assetId);
  const entries = await tx.investmentEntry.findMany({
    where: { assetId },
    include: entryWithAsset,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const summary = summarizeEntries(entries);

  if (summary.netUnits.lte(EPSILON)) {
    await tx.investmentPosition.update({
      where: { id: position.id },
      data: {
        totalInvested: new Prisma.Decimal(0),
        averageBuyPrice: summary.fallbackBuyPrice,
        amount: new Prisma.Decimal(0),
        deletedAt: new Date(),
      },
      include: positionWithAsset,
    });
    return null;
  }

  return tx.investmentPosition.update({
    where: { id: position.id },
    data: {
      totalInvested: summary.netCost.toDecimalPlaces(2),
      averageBuyPrice: summary.netCost.div(summary.netUnits).toDecimalPlaces(10),
      amount: summary.netUnits.toDecimalPlaces(10),
      deletedAt: null,
    },
    include: positionWithAsset,
  });
};

const assertTransactionLinkAvailable = async (
  tx: InvestmentsTransactionClient,
  transactionId: string | null | undefined,
): Promise<string | null> => {
  const normalized = trimNullable(transactionId) ?? null;
  if (!normalized) return null;

  const transaction = await tx.transaction.findFirst({
    where: { id: normalized, deletedAt: null },
    select: { id: true },
  });
  if (!transaction) {
    throw new InvestmentsRepositoryError("MISSING_TRANSACTION", `Active transaction '${normalized}' was not found.`);
  }

  const linkedEntry = await tx.investmentEntry.findFirst({
    where: { transactionId: normalized },
    select: { id: true },
  });
  if (linkedEntry) {
    throw new InvestmentsRepositoryError(
      "TRANSACTION_ALREADY_LINKED",
      `Transaction '${normalized}' is already linked to an investment entry.`,
    );
  }

  return normalized;
};

const getLatestSnapshotForAssetId = async (
  client: InvestmentsTransactionClient,
  assetId: string,
): Promise<SnapshotModel | null> => client.marketQuoteSnapshot.findFirst({
  where: { assetId },
  include: snapshotWithAsset,
  orderBy: [{ fetchedAt: "desc" }, { id: "desc" }],
});

const getOrInitRefsForAsset = async (
  tx: InvestmentsTransactionClient,
  asset: AssetModel,
): Promise<RefsModel> => {
  const existing = await tx.investmentAssetRef.findUnique({
    where: { assetId: asset.id },
    include: refsWithAsset,
  });
  if (existing) return existing;

  const latestSnapshot = await getLatestSnapshotForAssetId(tx, asset.id);
  const initialPrice = latestSnapshot?.price ?? new Prisma.Decimal(0);
  const initialTimestamp = latestSnapshot?.providerAsOf ?? latestSnapshot?.fetchedAt ?? new Date();

  return tx.investmentAssetRef.create({
    data: {
      assetId: asset.id,
      dailyRefPrice: initialPrice,
      dailyRefTimestamp: initialTimestamp,
      monthRefPrice: initialPrice,
      monthRefTimestamp: initialTimestamp,
    },
    include: refsWithAsset,
  });
};

const addInvestmentEntryInTransaction = async (
  tx: InvestmentsTransactionClient,
  input: AddInvestmentEntryInput,
): Promise<AddInvestmentEntryResult> => {
  const asset = await getOrCreateAsset(tx, input);
  const position = await ensurePositionForAsset(tx, asset.id);
  const entryType = normalizeEntryType(input.entryType);
  const amountUsd = parsePositiveDecimal(input.usd_gastado, "INVALID_AMOUNT", "Investment amount");
  const buyPrice = parsePositiveDecimal(input.buy_price, "INVALID_PRICE", "Investment buy price");
  const units = amountUsd.div(buyPrice).toDecimalPlaces(10);
  const transactionId = await assertTransactionLinkAvailable(tx, input.transactionId);

  if (entryType === "egreso") {
    const currentEntries = await tx.investmentEntry.findMany({
      where: { assetId: asset.id },
      include: entryWithAsset,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const summary = summarizeEntries(currentEntries);
    if (summary.netUnits.lte(EPSILON) || units.gt(summary.netUnits.plus(EPSILON))) {
      throw new InvestmentsRepositoryError(
        "OVERSOLD_POSITION",
        "Cannot create an investment expense greater than the available position amount.",
      );
    }
  }

  const entry = await tx.investmentEntry.create({
    data: {
      positionId: position.id,
      assetId: asset.id,
      entryType: ENTRY_TO_PRISMA[entryType],
      amountUsd,
      buyPrice,
      units,
      transactionId,
      ...(input.createdAt !== undefined ? { createdAt: toDate(input.createdAt) } : {}),
    },
    include: entryWithAsset,
  });
  const rebuiltPosition = await rebuildPositionForAsset(tx, asset.id);

  return {
    position: rebuiltPosition ? toInvestmentPositionRecord(rebuiltPosition) : null,
    entry: toInvestmentEntryRecord(entry),
  };
};

export const createInvestmentsRepository = (prisma: PrismaClient): InvestmentsRepository => ({
  async listPositions() {
    const positions = await prisma.investmentPosition.findMany({
      where: { deletedAt: null },
      include: positionWithAsset,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return positions.map(toInvestmentPositionRecord);
  },

  async getPositionById(id) {
    const position = await prisma.investmentPosition.findFirst({
      where: { id, deletedAt: null },
      include: positionWithAsset,
    });
    return position ? toInvestmentPositionRecord(position) : null;
  },

  async addPosition(input) {
    const result = await this.addEntry({
      assetType: input.assetType,
      ticker: input.ticker,
      displayName: input.displayName,
      entryType: input.entryType ?? "ingreso",
      usd_gastado: input.usd_gastado,
      buy_price: input.buy_price,
      createdAt: input.createdAt,
    });
    if (!result.position) {
      throw new InvestmentsRepositoryError("INVALID_AMOUNT", "Investment position cannot be initialized at zero units.");
    }
    return result.position;
  },

  async editPosition(id, input) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.investmentPosition.findFirst({
        where: { id, deletedAt: null },
        include: positionWithAsset,
      });
      if (!existing) return null;

      await tx.investmentEntry.deleteMany({ where: { positionId: id } });
      await rebuildPositionForAsset(tx, existing.assetId);

      const result = await addInvestmentEntryInTransaction(tx, {
        assetType: input.assetType ?? ASSET_FROM_PRISMA[existing.asset.assetType],
        ticker: input.ticker ?? existing.asset.ticker,
        displayName: input.displayName ?? existing.asset.displayName,
        entryType: input.entryType ?? "ingreso",
        usd_gastado: input.usd_gastado ?? existing.totalInvested,
        buy_price: input.buy_price ?? existing.averageBuyPrice,
        createdAt: input.createdAt,
      });
      return result.position;
    });
  },

  async deletePosition(id) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.investmentPosition.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, assetId: true },
      });
      if (!existing) return false;
      await tx.investmentEntry.deleteMany({ where: { positionId: id } });
      await rebuildPositionForAsset(tx, existing.assetId);
      return true;
    });
  },

  async listEntriesByPosition(positionId) {
    const entries = await prisma.investmentEntry.findMany({
      where: { positionId },
      include: entryWithAsset,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return entries.map(toInvestmentEntryRecord);
  },

  async listEntriesByAsset(assetType, ticker) {
    const entries = await prisma.investmentEntry.findMany({
      where: {
        asset: {
          assetType: ASSET_TO_PRISMA[normalizeAssetType(assetType)],
          ticker: normalizeTicker(ticker),
        },
      },
      include: entryWithAsset,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return entries.map(toInvestmentEntryRecord);
  },

  async addEntry(input) {
    return prisma.$transaction((tx) => addInvestmentEntryInTransaction(tx, input));
  },

  async deleteEntry(entryId) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.investmentEntry.findFirst({
        where: { id: entryId },
        include: entryWithAsset,
      });
      if (!existing) return false;

      await tx.investmentEntry.delete({ where: { id: entryId } });
      await rebuildPositionForAsset(tx, existing.assetId);
      return true;
    });
  },

  async addSnapshot(input) {
    return prisma.$transaction(async (tx) => {
      const asset = await getOrCreateAsset(tx, input);
      const snapshot = await tx.marketQuoteSnapshot.create({
        data: {
          assetId: asset.id,
          price: parsePositiveDecimal(input.price, "INVALID_PRICE", "Snapshot price"),
          source: input.source,
          providerAsOf: toDate(input.timestamp) ?? null,
          ...(input.fetchedAt !== undefined ? { fetchedAt: toDate(input.fetchedAt) } : {}),
          bid: input.bid === undefined || input.bid === null ? null : toDecimal(input.bid),
          ask: input.ask === undefined || input.ask === null ? null : toDecimal(input.ask),
        },
        include: snapshotWithAsset,
      });
      return toSnapshotRecord(snapshot);
    });
  },

  async listSnapshotsByAsset(assetType, ticker) {
    const snapshots = await prisma.marketQuoteSnapshot.findMany({
      where: {
        asset: {
          assetType: ASSET_TO_PRISMA[normalizeAssetType(assetType)],
          ticker: normalizeTicker(ticker),
        },
      },
      include: snapshotWithAsset,
      orderBy: [{ fetchedAt: "asc" }, { id: "asc" }],
    });
    return snapshots.map(toSnapshotRecord);
  },

  async getLatestSnapshotByAsset(assetType, ticker) {
    const asset = await prisma.investmentAsset.findUnique({
      where: {
        assetType_ticker: {
          assetType: ASSET_TO_PRISMA[normalizeAssetType(assetType)],
          ticker: normalizeTicker(ticker),
        },
      },
      include: assetWithRefs,
    });
    if (!asset) return null;

    const snapshot = await getLatestSnapshotForAssetId(prisma, asset.id);
    return snapshot ? toSnapshotRecord(snapshot) : null;
  },

  async getOrInitRefs(assetType, ticker) {
    return prisma.$transaction(async (tx) => {
      const asset = await getOrCreateAsset(tx, { assetType, ticker });
      return toRefsRecord(await getOrInitRefsForAsset(tx, asset));
    });
  },

  async updateDailyRefIfNeeded(assetType, ticker, currentPrice, timestamp) {
    return prisma.$transaction(async (tx) => {
      const asset = await getOrCreateAsset(tx, { assetType, ticker });
      const refs = await getOrInitRefsForAsset(tx, asset);
      const effectiveTimestamp = toDate(timestamp) ?? new Date();
      const price = parsePositiveDecimal(currentPrice, "INVALID_PRICE", "Daily reference price");
      const shouldUpdate = refs.dailyRefPrice.lte(0) ||
        toUtcDayKey(refs.dailyRefTimestamp) !== toUtcDayKey(effectiveTimestamp);

      if (!shouldUpdate) return toRefsRecord(refs);

      return toRefsRecord(await tx.investmentAssetRef.update({
        where: { assetId: asset.id },
        data: {
          dailyRefPrice: price,
          dailyRefTimestamp: effectiveTimestamp,
        },
        include: refsWithAsset,
      }));
    });
  },

  async updateMonthRefIfNeeded(assetType, ticker, currentPrice, timestamp) {
    return prisma.$transaction(async (tx) => {
      const asset = await getOrCreateAsset(tx, { assetType, ticker });
      const refs = await getOrInitRefsForAsset(tx, asset);
      const effectiveTimestamp = toDate(timestamp) ?? new Date();
      const price = parsePositiveDecimal(currentPrice, "INVALID_PRICE", "Monthly reference price");
      const shouldUpdate = refs.monthRefPrice.lte(0) ||
        toUtcMonthKey(refs.monthRefTimestamp) !== toUtcMonthKey(effectiveTimestamp);

      if (!shouldUpdate) return toRefsRecord(refs);

      return toRefsRecord(await tx.investmentAssetRef.update({
        where: { assetId: asset.id },
        data: {
          monthRefPrice: price,
          monthRefTimestamp: effectiveTimestamp,
        },
        include: refsWithAsset,
      }));
    });
  },

  async getRefsMap() {
    const refs = await prisma.investmentAssetRef.findMany({ include: refsWithAsset });
    return Object.fromEntries(refs.map((item) => [
      `${ASSET_FROM_PRISMA[item.asset.assetType]}:${item.asset.ticker}`,
      toRefsRecord(item),
    ]));
  },

  async clearAll() {
    await prisma.$transaction(async (tx) => {
      await tx.investmentEntry.deleteMany({});
      await tx.marketQuoteSnapshot.deleteMany({});
      await tx.investmentAssetRef.deleteMany({});
      await tx.investmentPosition.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date(), totalInvested: new Prisma.Decimal(0), averageBuyPrice: new Prisma.Decimal(0), amount: new Prisma.Decimal(0) },
      });
    });
  },
});

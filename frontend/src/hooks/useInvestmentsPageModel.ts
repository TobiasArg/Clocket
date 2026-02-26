import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject, TouchEvent as ReactTouchEvent } from "react";
import type { InvestmentEntryItem, InvestmentPositionItem } from "@/domain/investments/repository";
import type { CategoryItem } from "@/domain/categories/repository";
import type { AssetType, EntryType, HistoricalPoint } from "@/domain/investments/portfolioTypes";
import { TRANSACTION_EXPENSE_TEXT_CLASS } from "@/constants";
import { categoriesRepository } from "@/data/localStorage/categoriesRepository";
import { transactionsRepository } from "@/data/localStorage/transactionsRepository";
import { refreshPositions, type RefreshedPositionViewModel } from "@/domain/investments/refreshPositions";
import { toArsTransactionAmount } from "@/utils";
import { useAccounts } from "./useAccounts";
import { usePullToRefresh, type PullToRefreshState } from "./usePullToRefresh";
import { useInvestments } from "./useInvestments";

const VISIBLE_POSITIONS_BATCH = 8;
const SPARKLINE_MAX_POINTS = 18;
const POSITION_AMOUNT_EPSILON = 0.00000001;
const PULL_TO_REFRESH_THRESHOLD = 96;
const PULL_TO_REFRESH_MAX_DISTANCE = 156;
const INVESTMENTS_PARENT_CATEGORY_NAME = "Inversiones";
const INVESTMENTS_PARENT_CATEGORY_ICON = "trend-up";
const INVESTMENTS_PARENT_CATEGORY_ICON_BG = "bg-[#2563EB]";
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getQuantityPrecisionByAsset = (assetType: AssetType): number => {
  return assetType === "crypto" ? 10 : 2;
};

const roundWithPrecision = (value: number, precision: number): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const exceedsPrecision = (value: string, precision: number): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const normalized = trimmed.startsWith("+") || trimmed.startsWith("-")
    ? trimmed.slice(1)
    : trimmed;
  const decimalPart = normalized.split(".")[1] ?? "";
  return decimalPart.length > precision;
};

const clampDecimalInput = (value: string, precision: number): string => {
  const normalized = value.replaceAll(",", ".").replace(/[^0-9.]/g, "");
  if (!normalized) {
    return "";
  }

  const firstDotIndex = normalized.indexOf(".");
  if (firstDotIndex === -1) {
    return normalized;
  }

  const integerPart = normalized.slice(0, firstDotIndex) || "0";
  const decimalRaw = normalized.slice(firstDotIndex + 1).replaceAll(".", "");
  const decimalPart = decimalRaw.slice(0, precision);

  return `${integerPart}.${decimalPart}`;
};

const normalizeLookupKey = (value: string): string => {
  return value.trim().toLocaleLowerCase("es-ES");
};

const formatSignedAmount = (value: number, sign: "+" | "-"): string => {
  return `${sign}$${value.toFixed(2)}`;
};

const resolveTransactionDate = (createdAtInput: string, createdAtIso?: string): string => {
  const fromInput = createdAtInput.trim().slice(0, 10);
  if (ISO_DATE_PATTERN.test(fromInput)) {
    return fromInput;
  }

  if (createdAtIso) {
    const parsedCreatedAt = new Date(createdAtIso);
    if (!Number.isNaN(parsedCreatedAt.getTime())) {
      return parsedCreatedAt.toISOString().slice(0, 10);
    }
  }

  return new Date().toISOString().slice(0, 10);
};

const formatPctText = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const formatEntryTypeLabel = (entryType: EntryType): string => {
  return entryType === "ingreso" ? "Compra" : "Venta";
};

const toLocalInputDateTime = (value?: string): string => {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const timezoneOffset = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const buildAssetKey = (assetType: AssetType, ticker: string): string => {
  return `${assetType}:${ticker.trim().toUpperCase()}`;
};

export const formatLastUpdatedLabel = (timestamp: string | null): string => {
  if (!timestamp) {
    return "Sin actualización";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin actualización";
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatEntryDateLabel = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Fecha inválida";
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const toSparklineLabel = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

const ensureInvestmentsCategory = async (): Promise<CategoryItem> => {
  const categories = await categoriesRepository.list();
  const existing = categories.find((category) => {
    return normalizeLookupKey(category.name) === normalizeLookupKey(INVESTMENTS_PARENT_CATEGORY_NAME);
  });

  if (existing) {
    return existing;
  }

  return categoriesRepository.create({
    name: INVESTMENTS_PARENT_CATEGORY_NAME,
    icon: INVESTMENTS_PARENT_CATEGORY_ICON,
    iconBg: INVESTMENTS_PARENT_CATEGORY_ICON_BG,
  });
};

const ensureInvestmentTickerSubcategory = async (
  ticker: string,
): Promise<CategoryItem> => {
  const parentCategory = await ensureInvestmentsCategory();
  const normalizedTicker = ticker.trim().toUpperCase();
  const currentSubcategories = Array.isArray(parentCategory.subcategories)
    ? parentCategory.subcategories
    : [];
  const alreadyExists = currentSubcategories.some((subcategory) => {
    return normalizeLookupKey(subcategory) === normalizeLookupKey(normalizedTicker);
  });

  if (alreadyExists) {
    return parentCategory;
  }

  const nextSubcategories = [...currentSubcategories, normalizedTicker];
  const updated = await categoriesRepository.update(parentCategory.id, {
    subcategories: nextSubcategories,
    subcategoryCount: nextSubcategories.length,
  });

  return updated ?? parentCategory;
};

export interface SparklinePoint {
  label: string;
  value: number;
}

export interface PositionEntryRow {
  id: string;
  entryType: EntryType;
  entryTypeLabel: string;
  usdSpent: number;
  buyPrice: number;
  amount: number;
  createdAt: string;
  createdAtLabel: string;
}

export const buildSparklinePoints = (historicalPoints: HistoricalPoint[]): SparklinePoint[] => {
  if (historicalPoints.length === 0) {
    return [];
  }

  const byUtcDay = new Map<string, { timestamp: string; value: number }>();
  historicalPoints.forEach((point) => {
    const parsed = new Date(point.timestamp);
    const dayKey = Number.isNaN(parsed.getTime())
      ? point.timestamp
      : parsed.toISOString().slice(0, 10);

    const existing = byUtcDay.get(dayKey);
    if (existing && existing.timestamp > point.timestamp) {
      return;
    }

    byUtcDay.set(dayKey, {
      timestamp: point.timestamp,
      value: point.equity,
    });
  });

  return Array.from(byUtcDay.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, value]) => ({
      label: toSparklineLabel(value.timestamp),
      value: value.value,
    }))
    .slice(-SPARKLINE_MAX_POINTS);
};

const toRowMap = (rows: RefreshedPositionViewModel[]): Map<string, RefreshedPositionViewModel> => {
  const map = new Map<string, RefreshedPositionViewModel>();
  rows.forEach((row) => {
    map.set(row.id, row);
  });
  return map;
};

const mergeRows = (
  currentRows: RefreshedPositionViewModel[],
  incomingRows: RefreshedPositionViewModel[],
  allPositions: InvestmentPositionItem[],
): RefreshedPositionViewModel[] => {
  const orderMap = new Map<string, number>();
  allPositions.forEach((item, index) => {
    orderMap.set(item.id, index);
  });

  const map = toRowMap(currentRows);
  incomingRows.forEach((item) => {
    map.set(item.id, item);
  });

  const validRows = Array.from(map.values()).filter((row) => orderMap.has(row.id));
  validRows.sort((left, right) => {
    return (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0);
  });

  return validRows;
};

const resolveLatestTimestamp = (rows: RefreshedPositionViewModel[]): string | null => {
  let latest: string | null = null;

  rows.forEach((row) => {
    if (!row.lastUpdatedTimestamp) {
      return;
    }

    if (!latest) {
      latest = row.lastUpdatedTimestamp;
      return;
    }

    const latestDate = new Date(latest);
    const rowDate = new Date(row.lastUpdatedTimestamp);
    if (!Number.isNaN(rowDate.getTime()) && rowDate.getTime() > latestDate.getTime()) {
      latest = row.lastUpdatedTimestamp;
    }
  });

  return latest;
};

export interface InvestmentsSummary {
  investedUSD: number;
  currentValueUSD: number;
  pnlTotalUSD: number;
  pnlTotalPct: number;
  pnlDailyUSD: number;
  pnlMonthUSD: number;
  totalPositions: number;
  stocksCount: number;
  cryptoCount: number;
  lastUpdatedTimestamp: string | null;
  lastUpdatedLabel: string;
}

export interface InvestmentsUiMessage {
  kind: "success" | "error";
  text: string;
}

export type SaleInputMode = "usd" | "shares";

export interface InvestmentTableRow extends RefreshedPositionViewModel {
  displayName: string;
  lastUpdatedLabel: string;
  sparklinePoints: SparklinePoint[];
  hasHistoricalData: boolean;
  isRefreshing: boolean;
  pnlDailyText: string;
  pnlMonthText: string;
  pnlTotalText: string;
}

export interface UseInvestmentsPageModelOptions {}

export interface UseInvestmentsPageModelResult {
  rows: InvestmentTableRow[];
  selectedRow: InvestmentTableRow | null;
  selectedEntries: PositionEntryRow[];
  summary: InvestmentsSummary;
  error: string | null;
  isLoading: boolean;
  hasPositions: boolean;
  isEditorOpen: boolean;
  editingPositionId: string | null;
  selectedPositionId: string | null;
  isDetailOpen: boolean;
  isEntriesLoading: boolean;
  deletingEntryId: string | null;
  isDeleteConfirmOpen: boolean;
  pendingDeletePositionId: string | null;
  isDeleteSubmitting: boolean;
  uiMessage: InvestmentsUiMessage | null;
  isPullRefreshing: boolean;
  pullProgress: number;
  pullState: PullToRefreshState;
  pullContainerRef: RefObject<HTMLDivElement>;
  handlePullTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => void;
  handlePullTouchMove: (event: ReactTouchEvent<HTMLDivElement>) => void;
  handlePullTouchEnd: () => void;
  handlePullTouchCancel: () => void;
  assetTypeInput: AssetType;
  entryTypeInput: EntryType;
  saleInputMode: SaleInputMode;
  saleSharesInput: string;
  selectedAccountId: string;
  sortedAccounts: Array<{ id: string; name: string }>;
  tickerInput: string;
  usdSpentInput: string;
  buyPriceInput: string;
  createdAtInput: string;
  availableAmountLabel: string;
  isFormValid: boolean;
  showValidation: boolean;
  derivedAmountLabel: string;
  formValidationLabel: string | null;
  handlePullRefresh: () => Promise<void>;
  handleHeaderAction: () => void;
  handleOpenCreate: () => void;
  handleOpenEdit: (id: string) => void;
  handleOpenDetail: (id: string) => void;
  handleCloseDetail: () => void;
  handleCloseEditor: () => void;
  handleDeleteEntry: (entryId: string) => Promise<void>;
  handleRequestDelete: (id: string) => void;
  handleCancelDelete: () => void;
  handleConfirmDelete: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  dismissUiMessage: () => void;
  setAssetTypeInput: (value: AssetType) => void;
  setEntryTypeInput: (value: EntryType) => void;
  setSaleInputMode: (value: SaleInputMode) => void;
  setSaleSharesInput: (value: string) => void;
  setSelectedAccountId: (value: string) => void;
  setTickerInput: (value: string) => void;
  setUsdSpentInput: (value: string) => void;
  setBuyPriceInput: (value: string) => void;
  setCreatedAtInput: (value: string) => void;
}

const buildSummary = (rows: RefreshedPositionViewModel[]): InvestmentsSummary => {
  const investedUSD = rows.reduce((acc, row) => acc + row.investedUSD, 0);
  const currentValueUSD = rows.reduce((acc, row) => acc + row.currentValueUSD, 0);
  const pnlTotalUSD = rows.reduce((acc, row) => acc + row.pnlTotalUSD, 0);
  const pnlDailyUSD = rows.reduce((acc, row) => acc + row.pnlDailyUSD, 0);
  const pnlMonthUSD = rows.reduce((acc, row) => acc + row.pnlMonthUSD, 0);
  const pnlTotalPct = investedUSD > 0 ? (pnlTotalUSD / investedUSD) * 100 : 0;
  const totalPositions = rows.length;
  const stocksCount = rows.filter((row) => row.assetType === "stock").length;
  const cryptoCount = rows.filter((row) => row.assetType === "crypto").length;
  const lastUpdatedTimestamp = resolveLatestTimestamp(rows);

  return {
    investedUSD,
    currentValueUSD,
    pnlTotalUSD,
    pnlTotalPct,
    pnlDailyUSD,
    pnlMonthUSD,
    totalPositions,
    stocksCount,
    cryptoCount,
    lastUpdatedTimestamp,
    lastUpdatedLabel: formatLastUpdatedLabel(lastUpdatedTimestamp),
  };
};

const toEntryRows = (entries: InvestmentEntryItem[]): PositionEntryRow[] => {
  return entries.map((entry) => ({
    id: entry.id,
    entryType: entry.entryType,
    entryTypeLabel: formatEntryTypeLabel(entry.entryType),
    usdSpent: entry.usd_gastado,
    buyPrice: entry.buy_price,
    amount: entry.amount,
    createdAt: entry.createdAt,
    createdAtLabel: formatEntryDateLabel(entry.createdAt),
  }));
};

export const useInvestmentsPageModel = (
  _options: UseInvestmentsPageModelOptions = {},
): UseInvestmentsPageModelResult => {
  const {
    positions,
    isLoading,
    error,
    addEntry,
    listEntriesByPosition,
    deleteEntry,
    deletePosition,
  } = useInvestments();
  const { items: accounts } = useAccounts();

  const [rows, setRows] = useState<RefreshedPositionViewModel[]>([]);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(() => new Set<string>());
  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [assetTypeInput, setAssetTypeInput] = useState<AssetType>("stock");
  const [entryTypeInput, setEntryTypeInput] = useState<EntryType>("ingreso");
  const [saleInputMode, setSaleInputMode] = useState<SaleInputMode>("usd");
  const [saleSharesInput, setSaleSharesInput] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [tickerInput, setTickerInput] = useState<string>("");
  const [usdSpentInput, setUsdSpentInput] = useState<string>("");
  const [buyPriceInput, setBuyPriceInput] = useState<string>("");
  const [createdAtInput, setCreatedAtInput] = useState<string>(() => toLocalInputDateTime());
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedEntries, setSelectedEntries] = useState<PositionEntryRow[]>([]);
  const [isEntriesLoading, setIsEntriesLoading] = useState<boolean>(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [pendingDeletePositionId, setPendingDeletePositionId] = useState<string | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState<boolean>(false);
  const [uiMessage, setUiMessage] = useState<InvestmentsUiMessage | null>(null);

  const runRefresh = useCallback(
    async (
      targetPositions: InvestmentPositionItem[],
      force: boolean,
      allPositions: InvestmentPositionItem[] = positions,
    ): Promise<void> => {
      if (targetPositions.length === 0) {
        return;
      }

      setRefreshingIds((current) => {
        const next = new Set(current);
        targetPositions.forEach((item) => next.add(item.id));
        return next;
      });

      try {
        const refreshed = await refreshPositions(targetPositions, { force });
        setRows((current) => mergeRows(current, refreshed, allPositions));
      } finally {
        setRefreshingIds((current) => {
          const next = new Set(current);
          targetPositions.forEach((item) => next.delete(item.id));
          return next;
        });
      }
    },
    [positions],
  );

  useEffect(() => {
    let cancelled = false;
    const positionIds = new Set(positions.map((item) => item.id));
    setRows((current) => current.filter((row) => positionIds.has(row.id)));

    if (positions.length === 0) {
      return () => { cancelled = true; };
    }

    const visiblePositions = positions.slice(0, VISIBLE_POSITIONS_BATCH);
    const backgroundPositions = positions.slice(VISIBLE_POSITIONS_BATCH);

    void (async () => {
      await runRefresh(visiblePositions, false, positions);
      if (!cancelled && backgroundPositions.length > 0) {
        await runRefresh(backgroundPositions, false, positions);
      }
    })();

    return () => { cancelled = true; };
  }, [positions, runRefresh]);

  useEffect(() => {
    if (!selectedPositionId) {
      return;
    }

    const stillExists = positions.some((position) => position.id === selectedPositionId);
    if (!stillExists) {
      setSelectedEntries([]);
      setIsDetailOpen(false);
      setSelectedPositionId(null);
    }
  }, [positions, selectedPositionId]);

  const summary = useMemo<InvestmentsSummary>(() => buildSummary(rows), [rows]);
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((left, right) => left.name.localeCompare(right.name));
  }, [accounts]);
  const defaultAccountId = sortedAccounts[0]?.id ?? "";

  const loadEntriesForPosition = useCallback(async (positionId: string): Promise<void> => {
    setIsEntriesLoading(true);
    try {
      const loadedEntries = await listEntriesByPosition(positionId);
      setSelectedEntries(toEntryRows(loadedEntries));
    } finally {
      setIsEntriesLoading(false);
    }
  }, [listEntriesByPosition]);

  useEffect(() => {
    if (!isDetailOpen || !selectedPositionId) {
      setSelectedEntries([]);
      return;
    }

    let cancelled = false;
    setIsEntriesLoading(true);

    listEntriesByPosition(selectedPositionId)
      .then((loadedEntries) => {
        if (!cancelled) {
          setSelectedEntries(toEntryRows(loadedEntries));
        }
      })
      .catch(() => {
        // silent — matches existing behavior
      })
      .finally(() => {
        if (!cancelled) {
          setIsEntriesLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [isDetailOpen, selectedPositionId, listEntriesByPosition]);

  useEffect(() => {
    if (!selectedAccountId && defaultAccountId) {
      setSelectedAccountId(defaultAccountId);
      return;
    }

    if (selectedAccountId) {
      const accountExists = sortedAccounts.some((account) => account.id === selectedAccountId);
      if (!accountExists) {
        setSelectedAccountId(defaultAccountId);
      }
    }
  }, [defaultAccountId, selectedAccountId, sortedAccounts]);

  useEffect(() => {
    if (!saleSharesInput) {
      return;
    }

    const precision = getQuantityPrecisionByAsset(assetTypeInput);
    const clamped = clampDecimalInput(saleSharesInput, precision);
    if (clamped !== saleSharesInput) {
      setSaleSharesInput(clamped);
    }
  }, [assetTypeInput, saleSharesInput]);

  const usdSpent = parsePositiveNumber(usdSpentInput);
  const buyPrice = parsePositiveNumber(buyPriceInput);
  const saleShares = parsePositiveNumber(saleSharesInput);
  const normalizedTicker = tickerInput.trim().toUpperCase();
  const isPurchase = entryTypeInput === "ingreso";
  const quantityPrecision = getQuantityPrecisionByAsset(assetTypeInput);
  const isSaleByUsd = !isPurchase && saleInputMode === "usd";
  const saleSharesPrecisionExceeded = !isPurchase && saleInputMode === "shares" &&
    exceedsPrecision(saleSharesInput, quantityPrecision);
  const saleQuantityValue = isSaleByUsd ? usdSpent : saleShares;
  const derivedAmountRaw = isPurchase
    ? (usdSpent > 0 && buyPrice > 0 ? usdSpent / buyPrice : 0)
    : (isSaleByUsd
      ? (saleQuantityValue > 0 && buyPrice > 0 ? saleQuantityValue / buyPrice : 0)
      : saleQuantityValue);
  const derivedAmount = roundWithPrecision(derivedAmountRaw, quantityPrecision);
  const resolvedUsdAmount = (derivedAmount > 0 && buyPrice > 0)
    ? derivedAmount * buyPrice
    : 0;

  const targetPosition = normalizedTicker.length > 0
    ? positions.find((position) => buildAssetKey(position.assetType, position.ticker) === buildAssetKey(assetTypeInput, normalizedTicker))
    : null;
  const availableAmount = targetPosition?.amount ?? 0;
  const isAccountValid = !isPurchase || selectedAccountId.trim().length > 0;
  const isSaleQuantityValid = isPurchase
    ? derivedAmount > 0
    : (saleQuantityValue > 0 && !saleSharesPrecisionExceeded && derivedAmount > 0);

  const egresoExceedsAvailable = entryTypeInput === "egreso" && (
    availableAmount <= POSITION_AMOUNT_EPSILON ||
    derivedAmount > availableAmount + POSITION_AMOUNT_EPSILON
  );

  const isFormValid =
    normalizedTicker.length > 0 &&
    resolvedUsdAmount > 0 &&
    buyPrice > 0 &&
    isSaleQuantityValid &&
    isAccountValid &&
    !egresoExceedsAvailable;

  const formValidationLabel = showValidation && !isFormValid
    ? (entryTypeInput === "egreso" && egresoExceedsAvailable
      ? `No podés vender más de ${availableAmount.toFixed(quantityPrecision)} unidades disponibles.`
      : (!isSaleQuantityValid
        ? (saleSharesPrecisionExceeded
          ? `Para ${assetTypeInput === "stock" ? "acciones" : "cripto"} el máximo es ${quantityPrecision} decimales.`
          : (isSaleByUsd
          ? "Ingresá una cantidad de USD mayor a 0 para la venta."
          : "Ingresá una cantidad de acciones mayor a 0 para la venta."))
        : (!isAccountValid
        ? "Seleccioná una cuenta para registrar la compra."
        : "Completá ticker, precio y cantidad con valores mayores a 0."))
      )
    : null;

  const resetEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingPositionId(null);
    setAssetTypeInput("stock");
    setEntryTypeInput("ingreso");
    setSaleInputMode("usd");
    setSaleSharesInput("");
    setSelectedAccountId(defaultAccountId);
    setTickerInput("");
    setUsdSpentInput("");
    setBuyPriceInput("");
    setCreatedAtInput(toLocalInputDateTime());
    setShowValidation(false);
  }, [defaultAccountId]);

  const dismissUiMessage = useCallback(() => {
    setUiMessage(null);
  }, []);

  useEffect(() => {
    if (!uiMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setUiMessage(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [uiMessage]);

  const handleOpenCreate = () => {
    setIsDetailOpen(false);
    setSelectedPositionId(null);
    resetEditor();
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    const target = positions.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setIsDetailOpen(false);
    setSelectedPositionId(id);
    setIsEditorOpen(true);
    setEditingPositionId(id);
    setAssetTypeInput(target.assetType);
    setEntryTypeInput("ingreso");
    setSaleInputMode("usd");
    setSaleSharesInput("");
    setSelectedAccountId(defaultAccountId);
    setTickerInput(target.ticker);
    setUsdSpentInput("");
    setBuyPriceInput("");
    setCreatedAtInput(toLocalInputDateTime());
    setShowValidation(false);
  };

  const handleCloseEditor = () => {
    resetEditor();
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      handleCloseEditor();
      return;
    }

    handleOpenCreate();
  };

  const handleOpenDetail = (id: string) => {
    setSelectedPositionId(id);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedPositionId(null);
    setSelectedEntries([]);
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const parsedCreatedAt = createdAtInput ? new Date(createdAtInput) : null;
    const createdAt = parsedCreatedAt && !Number.isNaN(parsedCreatedAt.getTime())
      ? parsedCreatedAt.toISOString()
      : undefined;

    const payload = {
      assetType: assetTypeInput,
      ticker: normalizedTicker,
      entryType: entryTypeInput,
      usd_gastado: resolvedUsdAmount,
      buy_price: buyPrice,
      createdAt,
    } as const;
    const transactionDate = resolveTransactionDate(createdAtInput, createdAt);

    const created = await addEntry(payload);
    if (!created) {
      return;
    }

    let purchaseSyncError: string | null = null;

    if (isPurchase) {
      try {
        const investmentsCategory = await ensureInvestmentTickerSubcategory(payload.ticker);
        const amountInArs = toArsTransactionAmount(resolvedUsdAmount, "USD");

        await transactionsRepository.create({
          icon: investmentsCategory.icon,
          iconBg: investmentsCategory.iconBg,
          name: `Compra ${payload.ticker}`,
          category: investmentsCategory.name,
          categoryId: investmentsCategory.id,
          subcategoryName: payload.ticker,
          accountId: selectedAccountId,
          date: transactionDate,
          createdAt: createdAt ?? new Date().toISOString(),
          amount: formatSignedAmount(amountInArs, "-"),
          amountColor: TRANSACTION_EXPENSE_TEXT_CLASS,
          meta: `${transactionDate} • Compra inversión`,
          transactionType: "regular",
        });
      } catch {
        purchaseSyncError = "La compra se registró, pero no se pudo crear la transacción asociada.";
      }
    }

    if (created.position) {
      const positionMap = new Map<string, InvestmentPositionItem>();
      positions.forEach((position) => {
        positionMap.set(position.id, position);
      });
      positionMap.set(created.position.id, created.position);

      const nextPositions = Array.from(positionMap.values());
      await runRefresh([created.position], true, nextPositions);
    } else {
      const keyToRemove = buildAssetKey(payload.assetType, payload.ticker);
      setRows((current) => current.filter((row) => buildAssetKey(row.assetType, row.ticker) !== keyToRemove));
    }

    if (selectedPositionId) {
      await loadEntriesForPosition(selectedPositionId);
    }

    setUiMessage({
      kind: purchaseSyncError ? "error" : "success",
      text: purchaseSyncError
        ? purchaseSyncError
        : (entryTypeInput === "ingreso"
          ? `${payload.ticker} registró una compra correctamente.`
          : `${payload.ticker} registró una venta correctamente.`),
    });

    resetEditor();
  };

  const handleDeleteEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!selectedPositionId || deletingEntryId) {
      return;
    }

    const confirmed = window.confirm("¿Eliminar esta entrada? Esta acción recalculará la posición.");
    if (!confirmed) {
      return;
    }

    setDeletingEntryId(entryId);
    try {
      const removed = await deleteEntry(entryId);
      if (!removed) {
        setUiMessage({
          kind: "error",
          text: "No se pudo eliminar la entrada seleccionada.",
        });
        return;
      }

      await loadEntriesForPosition(selectedPositionId);
      setUiMessage({
        kind: "success",
        text: "La entrada fue eliminada y la posición se recalculó.",
      });
    } finally {
      setDeletingEntryId(null);
    }
  }, [deleteEntry, deletingEntryId, loadEntriesForPosition, selectedPositionId]);

  const handleRequestDelete = (id: string) => {
    setPendingDeletePositionId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    if (isDeleteSubmitting) {
      return;
    }

    setIsDeleteConfirmOpen(false);
    setPendingDeletePositionId(null);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!pendingDeletePositionId || isDeleteSubmitting) {
      return;
    }

    const targetId = pendingDeletePositionId;
    const targetTicker = positions.find((item) => item.id === targetId)?.ticker ?? "La posición";

    setIsDeleteSubmitting(true);
    try {
      const removed = await deletePosition(targetId);
      if (!removed) {
        setUiMessage({
          kind: "error",
          text: "No se pudo eliminar la posición seleccionada.",
        });
        return;
      }

      setRows((current) => current.filter((row) => row.id !== targetId));
      if (selectedPositionId === targetId) {
        handleCloseDetail();
      }

      setUiMessage({
        kind: "success",
        text: `${targetTicker} fue eliminada del portfolio.`,
      });
    } finally {
      setIsDeleteSubmitting(false);
      setIsDeleteConfirmOpen(false);
      setPendingDeletePositionId(null);
    }
  };

  const handlePullRefresh = useCallback(async (): Promise<void> => {
    if (positions.length === 0 || isPullRefreshing) {
      return;
    }

    setIsPullRefreshing(true);
    try {
      await runRefresh(positions, true, positions);
    } catch {
      setUiMessage({
        kind: "error",
        text: "No se pudo actualizar el portfolio en este momento.",
      });
    } finally {
      setIsPullRefreshing(false);
    }
  }, [isPullRefreshing, positions, runRefresh]);

  const pullToRefresh = usePullToRefresh({
    enabled: positions.length > 0,
    isRefreshing: isPullRefreshing,
    threshold: PULL_TO_REFRESH_THRESHOLD,
    maxDistance: PULL_TO_REFRESH_MAX_DISTANCE,
    onRefresh: handlePullRefresh,
  });

  const handleEntryTypeChange = (value: EntryType): void => {
    setEntryTypeInput(value);
    if (value === "ingreso") {
      setSaleInputMode("usd");
      setSaleSharesInput("");
    }
  };

  const handleSaleInputModeChange = (value: SaleInputMode): void => {
    setSaleInputMode(value);
    if (value === "usd") {
      setSaleSharesInput("");
      return;
    }

    setUsdSpentInput("");
  };

  const handleSaleSharesInputChange = (value: string): void => {
    const precision = getQuantityPrecisionByAsset(assetTypeInput);
    setSaleSharesInput(clampDecimalInput(value, precision));
  };

  const rowsWithUiState = useMemo<InvestmentTableRow[]>(() => {
    return rows.map((row) => {
      const sparklinePoints = buildSparklinePoints(row.historicalPoints);

      return {
        ...row,
        displayName: row.ticker,
        lastUpdatedLabel: formatLastUpdatedLabel(row.lastUpdatedTimestamp),
        sparklinePoints,
        hasHistoricalData: sparklinePoints.length >= 2,
        isRefreshing: refreshingIds.has(row.id),
        pnlDailyText: formatPctText(row.pnlDailyPct),
        pnlMonthText: formatPctText(row.pnlMonthPct),
        pnlTotalText: formatPctText(row.pnlTotalPct),
      };
    });
  }, [refreshingIds, rows]);

  const selectedRow = useMemo(() => {
    if (!selectedPositionId) {
      return null;
    }

    return rowsWithUiState.find((row) => row.id === selectedPositionId) ?? null;
  }, [rowsWithUiState, selectedPositionId]);

  return {
    rows: rowsWithUiState,
    selectedRow,
    selectedEntries,
    summary,
    error,
    isLoading,
    hasPositions: positions.length > 0,
    isEditorOpen,
    editingPositionId,
    selectedPositionId,
    isDetailOpen,
    isEntriesLoading,
    deletingEntryId,
    isDeleteConfirmOpen,
    pendingDeletePositionId,
    isDeleteSubmitting,
    uiMessage,
    isPullRefreshing,
    pullProgress: pullToRefresh.pullProgress,
    pullState: pullToRefresh.state,
    pullContainerRef: pullToRefresh.containerRef,
    handlePullTouchStart: pullToRefresh.onTouchStart,
    handlePullTouchMove: pullToRefresh.onTouchMove,
    handlePullTouchEnd: pullToRefresh.onTouchEnd,
    handlePullTouchCancel: pullToRefresh.onTouchCancel,
    assetTypeInput,
    entryTypeInput,
    saleInputMode,
    saleSharesInput,
    selectedAccountId,
    sortedAccounts: sortedAccounts.map((account) => ({ id: account.id, name: account.name })),
    tickerInput,
    usdSpentInput,
    buyPriceInput,
    createdAtInput,
    availableAmountLabel: availableAmount.toFixed(quantityPrecision),
    isFormValid,
    showValidation,
    derivedAmountLabel: derivedAmount > 0 ? `${derivedAmount.toFixed(quantityPrecision)}` : "0",
    formValidationLabel,
    handlePullRefresh,
    handleHeaderAction,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleCloseDetail,
    handleCloseEditor,
    handleDeleteEntry,
    handleRequestDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleSubmit,
    dismissUiMessage,
    setAssetTypeInput,
    setEntryTypeInput: handleEntryTypeChange,
    setSaleInputMode: handleSaleInputModeChange,
    setSaleSharesInput: handleSaleSharesInputChange,
    setSelectedAccountId,
    setTickerInput,
    setUsdSpentInput,
    setBuyPriceInput,
    setCreatedAtInput,
  };
};

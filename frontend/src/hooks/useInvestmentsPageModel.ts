import { useCallback, useEffect, useMemo, useState } from "react";
import type { InvestmentPositionItem } from "@/domain/investments/repository";
import { refreshPositions, type RefreshedPositionViewModel } from "@/domain/investments/refreshPositions";
import { useInvestments } from "./useInvestments";

const VISIBLE_POSITIONS_BATCH = 8;

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatPctText = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const toRowMap = (rows: RefreshedPositionViewModel[]): Map<string, RefreshedPositionViewModel> => {
  const map = new Map<string, RefreshedPositionViewModel>();
  rows.forEach((row) => {
    map.set(row.id, row);
  });
  return map;
};

export interface InvestmentsSummary {
  investedUSD: number;
  currentValueUSD: number;
  pnlTotalUSD: number;
  pnlTotalPct: number;
  pnlDailyUSD: number;
  pnlMonthUSD: number;
}

export interface InvestmentTableRow extends RefreshedPositionViewModel {
  isRefreshing: boolean;
  pnlDailyText: string;
  pnlMonthText: string;
  pnlTotalText: string;
}

export interface UseInvestmentsPageModelOptions {}

export interface UseInvestmentsPageModelResult {
  rows: InvestmentTableRow[];
  summary: InvestmentsSummary;
  error: string | null;
  isLoading: boolean;
  isRefreshingAll: boolean;
  hasPositions: boolean;
  isEditorOpen: boolean;
  editingPositionId: string | null;
  expandedRowId: string | null;
  assetTypeInput: "stock" | "crypto";
  tickerInput: string;
  usdSpentInput: string;
  buyPriceInput: string;
  isFormValid: boolean;
  showValidation: boolean;
  derivedAmountLabel: string;
  handleOpenCreate: () => void;
  handleOpenEdit: (id: string) => void;
  handleCloseEditor: () => void;
  handleToggleRowExpand: (id: string) => void;
  handleRefreshAll: () => Promise<void>;
  handleRefreshRow: (id: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleSubmit: () => Promise<void>;
  setAssetTypeInput: (value: "stock" | "crypto") => void;
  setTickerInput: (value: string) => void;
  setUsdSpentInput: (value: string) => void;
  setBuyPriceInput: (value: string) => void;
}

const buildSummary = (rows: RefreshedPositionViewModel[]): InvestmentsSummary => {
  const investedUSD = rows.reduce((acc, row) => acc + row.investedUSD, 0);
  const currentValueUSD = rows.reduce((acc, row) => acc + row.currentValueUSD, 0);
  const pnlTotalUSD = rows.reduce((acc, row) => acc + row.pnlTotalUSD, 0);
  const pnlDailyUSD = rows.reduce((acc, row) => acc + row.pnlDailyUSD, 0);
  const pnlMonthUSD = rows.reduce((acc, row) => acc + row.pnlMonthUSD, 0);
  const pnlTotalPct = investedUSD > 0 ? (pnlTotalUSD / investedUSD) * 100 : 0;

  return {
    investedUSD,
    currentValueUSD,
    pnlTotalUSD,
    pnlTotalPct,
    pnlDailyUSD,
    pnlMonthUSD,
  };
};

export const useInvestmentsPageModel = (
  _options: UseInvestmentsPageModelOptions = {},
): UseInvestmentsPageModelResult => {
  const {
    positions,
    isLoading,
    error,
    addPosition,
    editPosition,
    deletePosition,
  } = useInvestments();

  const [rows, setRows] = useState<RefreshedPositionViewModel[]>([]);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(() => new Set<string>());
  const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [assetTypeInput, setAssetTypeInput] = useState<"stock" | "crypto">("stock");
  const [tickerInput, setTickerInput] = useState<string>("");
  const [usdSpentInput, setUsdSpentInput] = useState<string>("");
  const [buyPriceInput, setBuyPriceInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const mergeRows = useCallback(
    (
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
    },
    [],
  );

  const runRefresh = useCallback(
    async (targetPositions: InvestmentPositionItem[], force: boolean): Promise<void> => {
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
        setRows((current) => mergeRows(current, refreshed, positions));
      } finally {
        setRefreshingIds((current) => {
          const next = new Set(current);
          targetPositions.forEach((item) => next.delete(item.id));
          return next;
        });
      }
    },
    [mergeRows, positions],
  );

  useEffect(() => {
    const positionIds = new Set(positions.map((item) => item.id));
    setRows((current) => current.filter((row) => positionIds.has(row.id)));

    if (positions.length === 0) {
      return;
    }

    const visiblePositions = positions.slice(0, VISIBLE_POSITIONS_BATCH);
    const backgroundPositions = positions.slice(VISIBLE_POSITIONS_BATCH);

    void (async () => {
      await runRefresh(visiblePositions, false);
      if (backgroundPositions.length > 0) {
        await runRefresh(backgroundPositions, false);
      }
    })();
  }, [positions, runRefresh]);

  const summary = useMemo<InvestmentsSummary>(() => buildSummary(rows), [rows]);

  const currentEditingPosition = useMemo(() => {
    if (!editingPositionId) {
      return null;
    }

    return positions.find((item) => item.id === editingPositionId) ?? null;
  }, [editingPositionId, positions]);

  const usdSpent = parsePositiveNumber(usdSpentInput);
  const buyPrice = parsePositiveNumber(buyPriceInput);
  const derivedAmount = usdSpent > 0 && buyPrice > 0 ? usdSpent / buyPrice : 0;

  const isFormValid =
    tickerInput.trim().length > 0 &&
    usdSpent > 0 &&
    buyPrice > 0;

  const resetEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingPositionId(null);
    setAssetTypeInput("stock");
    setTickerInput("");
    setUsdSpentInput("");
    setBuyPriceInput("");
    setShowValidation(false);
  }, []);

  const handleOpenCreate = () => {
    resetEditor();
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    const target = positions.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setIsEditorOpen(true);
    setEditingPositionId(target.id);
    setAssetTypeInput(target.assetType);
    setTickerInput(target.ticker);
    setUsdSpentInput(target.usd_gastado.toString());
    setBuyPriceInput(target.buy_price.toString());
    setShowValidation(false);
  };

  const handleCloseEditor = () => {
    resetEditor();
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const payload = {
      assetType: assetTypeInput,
      ticker: tickerInput,
      usd_gastado: usdSpent,
      buy_price: buyPrice,
    } as const;

    if (currentEditingPosition) {
      const updated = await editPosition(currentEditingPosition.id, payload);
      if (updated) {
        await runRefresh([updated], true);
        resetEditor();
      }
      return;
    }

    const created = await addPosition(payload);
    if (created) {
      await runRefresh([created], true);
      resetEditor();
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    const removed = await deletePosition(id);
    if (!removed) {
      return;
    }

    setRows((current) => current.filter((row) => row.id !== id));
    setExpandedRowId((current) => (current === id ? null : current));

    if (editingPositionId === id) {
      resetEditor();
    }
  };

  const handleRefreshRow = async (id: string): Promise<void> => {
    const target = positions.find((item) => item.id === id);
    if (!target) {
      return;
    }

    await runRefresh([target], true);
  };

  const handleRefreshAll = async (): Promise<void> => {
    if (positions.length === 0) {
      return;
    }

    setIsRefreshingAll(true);
    try {
      await runRefresh(positions, true);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleToggleRowExpand = (id: string) => {
    setExpandedRowId((current) => (current === id ? null : id));
  };

  const rowsWithUiState = useMemo<InvestmentTableRow[]>(() => {
    return rows.map((row) => ({
      ...row,
      isRefreshing: refreshingIds.has(row.id),
      pnlDailyText: formatPctText(row.pnlDailyPct),
      pnlMonthText: formatPctText(row.pnlMonthPct),
      pnlTotalText: formatPctText(row.pnlTotalPct),
    }));
  }, [refreshingIds, rows]);

  return {
    rows: rowsWithUiState,
    summary,
    error,
    isLoading,
    isRefreshingAll,
    hasPositions: positions.length > 0,
    isEditorOpen,
    editingPositionId,
    expandedRowId,
    assetTypeInput,
    tickerInput,
    usdSpentInput,
    buyPriceInput,
    isFormValid,
    showValidation,
    derivedAmountLabel: derivedAmount > 0
      ? `${derivedAmount.toFixed(8)}`
      : "0",
    handleOpenCreate,
    handleOpenEdit,
    handleCloseEditor,
    handleToggleRowExpand,
    handleRefreshAll,
    handleRefreshRow,
    handleDelete,
    handleSubmit,
    setAssetTypeInput,
    setTickerInput,
    setUsdSpentInput,
    setBuyPriceInput,
  };
};

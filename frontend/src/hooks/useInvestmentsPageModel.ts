import { useMemo, useState } from "react";
import type { StockCard as StockCardType } from "@/types";
import {
  formatCurrency,
  getUsdRate,
  type InvestmentPositionItem,
} from "@/utils";
import { useInvestments } from "./useInvestments";

export interface InvestmentChangePresentation {
  bg: string;
  color: string;
  text: string;
}

export interface InvestmentStockCardItem {
  id: string;
  priceSource: "stored" | "manual";
  priceSourceLabel: string;
  stock: StockCardType;
}

export interface InvestmentsSummary {
  current: number;
  currentArs: number;
  dayGainAmount: number;
  dayGainPercent: number;
  gainAmount: number;
  gainPercent: number;
  invested: number;
}

export interface UseInvestmentsPageModelOptions {
  onAddClick?: () => void;
}

export interface UseInvestmentsPageModelResult {
  cardItems: InvestmentStockCardItem[];
  costBasisInput: string;
  currentPriceInput: string;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  handleRemove: (id: string) => Promise<void>;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isManualPriceEnabled: boolean;
  nameInput: string;
  setCostBasisInput: (value: string) => void;
  setCurrentPriceInput: (value: string) => void;
  setIsManualPriceEnabled: (value: boolean) => void;
  setNameInput: (value: string) => void;
  setSharesInput: (value: string) => void;
  setTickerInput: (value: string) => void;
  sharesInput: string;
  showValidation: boolean;
  summary: InvestmentsSummary;
  summaryChange: InvestmentChangePresentation;
  tickerInput: string;
}

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeTicker = (value: string): string => value.trim().toUpperCase();

const getChangePresentation = (value: number): InvestmentChangePresentation => {
  if (value >= 0) {
    return {
      text: `+${value.toFixed(2)}%`,
      color: "text-[#10B981]",
      bg: "bg-[#D1FAE5]",
    };
  }

  return {
    text: `${value.toFixed(2)}%`,
    color: "text-[#DC2626]",
    bg: "bg-[#FEE2E2]",
  };
};

export const resolvePositionPrice = (
  position: InvestmentPositionItem,
): number => {
  if (position.priceSource === "manual" && position.manualPrice && position.manualPrice > 0) {
    return position.manualPrice;
  }

  return position.currentPrice;
};

export const calculatePortfolioSummary = (
  items: InvestmentPositionItem[],
  usdRate: number = getUsdRate(),
): InvestmentsSummary => {
  let invested = 0;
  let current = 0;

  items.forEach((item) => {
    const effectivePrice = resolvePositionPrice(item);
    const positionInvested = item.shares * item.costBasis;
    const positionCurrent = item.shares * effectivePrice;

    invested += positionInvested;
    current += positionCurrent;
  });

  const gainAmount = current - invested;
  const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;
  const dayGainAmount = 0;
  const dayGainPercent = 0;

  return {
    invested,
    current,
    currentArs: current * usdRate,
    gainAmount,
    gainPercent,
    dayGainAmount,
    dayGainPercent,
  };
};

export const useInvestmentsPageModel = (
  options: UseInvestmentsPageModelOptions = {},
): UseInvestmentsPageModelResult => {
  const { onAddClick } = options;
  const { items, isLoading, error, create, remove } = useInvestments();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [tickerInput, setTickerInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [sharesInput, setSharesInput] = useState<string>("");
  const [costBasisInput, setCostBasisInput] = useState<string>("");
  const [currentPriceInput, setCurrentPriceInput] = useState<string>("");
  const [isManualPriceEnabled, setIsManualPriceEnabled] = useState<boolean>(false);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const normalizedTickerInput = normalizeTicker(tickerInput);

  const shares = parsePositiveNumber(sharesInput);
  const costBasis = parsePositiveNumber(costBasisInput);
  const currentPrice = parsePositiveNumber(currentPriceInput);
  const isTickerValid = normalizedTickerInput.length > 0;
  const isNameValid = nameInput.trim().length > 0;
  const requiresManualPrice = isManualPriceEnabled;
  const isFormValid = (
    isTickerValid &&
    isNameValid &&
    shares > 0 &&
    costBasis > 0 &&
    (!requiresManualPrice || currentPrice > 0)
  );

  const summary = useMemo<InvestmentsSummary>(
    () => calculatePortfolioSummary(items, getUsdRate()),
    [items],
  );

  const cardItems = useMemo<InvestmentStockCardItem[]>(() => {
    return items.map((item) => {
      const isManual = item.priceSource === "manual" && Boolean(item.manualPrice);
      const effectivePrice = resolvePositionPrice(item);
      const invested = item.shares * item.costBasis;
      const current = item.shares * effectivePrice;
      const gainAmount = current - invested;
      const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;
      const change = getChangePresentation(gainPercent);

      return {
        id: item.id,
        priceSource: isManual ? "manual" : "stored",
        priceSourceLabel: isManual ? "Manual" : "Registrado",
        stock: {
          ticker: item.ticker,
          name: item.name,
          exchange: item.exchange,
          changeText: change.text,
          changeColor: change.color,
          changeBg: change.bg,
          row1: [
            { label: "Precio Actual", value: formatCurrency(effectivePrice, { currency: "USD", locale: "en-US" }) },
            { label: "Cantidad", value: `${item.shares.toFixed(2)} acc.` },
            { label: "Valor Total", value: formatCurrency(current, { currency: "USD", locale: "en-US" }) },
          ],
          row2: [
            { label: "Costo Promedio", value: formatCurrency(item.costBasis, { currency: "USD", locale: "en-US" }) },
            { label: "Invertido", value: formatCurrency(invested, { currency: "USD", locale: "en-US" }) },
            {
              label: gainAmount >= 0 ? "Ganancia" : "Pérdida",
              value: `${gainAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(gainAmount), { currency: "USD", locale: "en-US" })}`,
              valueColor: gainAmount >= 0 ? "text-[#10B981]" : "text-[#DC2626]",
            },
          ],
        },
      };
    });
  }, [items]);

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      setTickerInput("");
      setNameInput("");
      setSharesInput("");
      setCostBasisInput("");
      setCurrentPriceInput("");
      setIsManualPriceEnabled(false);
      setShowValidation(false);
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
      setIsManualPriceEnabled(false);
    }

    onAddClick?.();
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const usesManualPrice = requiresManualPrice;
    const fallbackCurrentPrice = usesManualPrice
      ? currentPrice
      : costBasis;

    const created = await create({
      ticker: normalizedTickerInput,
      name: nameInput,
      shares,
      costBasis,
      currentPrice: fallbackCurrentPrice,
      priceSource: usesManualPrice ? "manual" : "market",
      manualPrice: usesManualPrice ? currentPrice : undefined,
    });

    if (!created) {
      return;
    }

    setIsEditorOpen(false);
    setTickerInput("");
    setNameInput("");
    setSharesInput("");
    setCostBasisInput("");
    setCurrentPriceInput("");
    setIsManualPriceEnabled(false);
    setShowValidation(false);
  };

  const handleRemove = async (id: string): Promise<void> => {
    await remove(id);
  };

  return {
    cardItems,
    currentPriceInput,
    costBasisInput,
    error,
    handleCreate,
    handleHeaderAction,
    handleRemove,
    isEditorOpen,
    isFormValid,
    isLoading,
    isManualPriceEnabled,
    nameInput,
    setCostBasisInput,
    setCurrentPriceInput,
    setIsManualPriceEnabled,
    setNameInput,
    setSharesInput,
    setTickerInput,
    sharesInput,
    showValidation,
    summary,
    summaryChange: getChangePresentation(summary.gainPercent),
    tickerInput,
  };
};

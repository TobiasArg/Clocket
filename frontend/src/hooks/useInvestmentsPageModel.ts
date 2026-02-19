import { useEffect, useMemo, useState } from "react";
import type { StockCard as StockCardType } from "@/types";
import { getUsdRate } from "@/domain/currency/transactionCurrency";
import type { InvestmentPositionItem } from "@/domain/investments/repository";
import type { MarketQuote } from "@/domain/market/quotesRepository";
import { formatCurrency } from "@/utils/formatCurrency";
import { useInvestments } from "./useInvestments";
import { useMarketQuotes } from "./useMarketQuotes";

export interface InvestmentChangePresentation {
  bg: string;
  color: string;
  text: string;
}

export interface InvestmentStockCardItem {
  id: string;
  isUnavailable: boolean;
  priceSource: "market" | "manual";
  priceSourceLabel: string;
  quoteStatusLabel: string;
  quoteUpdatedAtLabel: string | null;
  unavailableReason: string | null;
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
  handleRefreshQuotes: () => Promise<void>;
  handleRemove: (id: string) => Promise<void>;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isManualPriceEnabled: boolean;
  isMarketRefreshing: boolean;
  isTickerUnavailable: boolean;
  marketLastUpdatedLabel: string;
  marketStatusColor: string;
  marketStatusLabel: string;
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
  tickerAvailabilityMessage: string | null;
  tickerInput: string;
}

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeTicker = (value: string): string => value.trim().toUpperCase();

const formatDateTimeLabel = (valueIso: string): string => {
  const date = new Date(valueIso);
  if (Number.isNaN(date.getTime())) {
    return "Sin actualización";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

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
  quote?: MarketQuote,
): number => {
  if (position.priceSource === "manual" && position.manualPrice && position.manualPrice > 0) {
    return position.manualPrice;
  }

  if (quote && quote.price > 0) {
    return quote.price;
  }

  return position.currentPrice;
};

export const calculatePortfolioSummary = (
  items: InvestmentPositionItem[],
  quoteBySymbol: Map<string, MarketQuote>,
  usdRate: number = getUsdRate(),
): InvestmentsSummary => {
  let invested = 0;
  let current = 0;
  let previousCloseTotal = 0;
  let dayGainAmount = 0;

  items.forEach((item) => {
    const quote = quoteBySymbol.get(item.ticker.toUpperCase());
    const effectivePrice = resolvePositionPrice(item, quote);
    const positionInvested = item.shares * item.costBasis;
    const positionCurrent = item.shares * effectivePrice;

    invested += positionInvested;
    current += positionCurrent;

    if (quote?.previousClose && quote.previousClose > 0) {
      previousCloseTotal += item.shares * quote.previousClose;
      dayGainAmount += item.shares * (effectivePrice - quote.previousClose);
    }
  });

  const gainAmount = current - invested;
  const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;
  const dayGainPercent = previousCloseTotal > 0
    ? (dayGainAmount / previousCloseTotal) * 100
    : 0;

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

  const trackedSymbols = useMemo(() => {
    const symbolSet = new Set<string>();
    items.forEach((item) => symbolSet.add(item.ticker.toUpperCase()));
    if (isEditorOpen && normalizedTickerInput) {
      symbolSet.add(normalizedTickerInput);
    }
    return Array.from(symbolSet);
  }, [isEditorOpen, items, normalizedTickerInput]);

  const {
    asOf,
    error: marketError,
    isLoading: isMarketLoading,
    isRefreshing: isMarketRefreshing,
    lastUpdatedAt,
    quoteBySymbol,
    refresh,
    unavailableBySymbol,
  } = useMarketQuotes({
    symbols: trackedSymbols,
  });

  const shares = parsePositiveNumber(sharesInput);
  const costBasis = parsePositiveNumber(costBasisInput);
  const currentPrice = parsePositiveNumber(currentPriceInput);
  const isTickerValid = normalizedTickerInput.length > 0;
  const isNameValid = nameInput.trim().length > 0;
  const requiresManualPrice = isManualPriceEnabled || (
    normalizedTickerInput.length > 0 &&
    unavailableBySymbol.has(normalizedTickerInput) &&
    !quoteBySymbol.has(normalizedTickerInput)
  );
  const isFormValid = (
    isTickerValid &&
    isNameValid &&
    shares > 0 &&
    costBasis > 0 &&
    (!requiresManualPrice || currentPrice > 0)
  );

  useEffect(() => {
    if (
      normalizedTickerInput.length > 0 &&
      unavailableBySymbol.has(normalizedTickerInput) &&
      !quoteBySymbol.has(normalizedTickerInput)
    ) {
      setIsManualPriceEnabled(true);
    }
  }, [normalizedTickerInput, quoteBySymbol, unavailableBySymbol]);

  const summary = useMemo<InvestmentsSummary>(
    () => calculatePortfolioSummary(items, quoteBySymbol, getUsdRate()),
    [items, quoteBySymbol],
  );

  const quoteUpdatedAtLabel = asOf ? formatDateTimeLabel(asOf) : null;

  const cardItems = useMemo<InvestmentStockCardItem[]>(() => {
    return items.map((item) => {
      const quote = quoteBySymbol.get(item.ticker.toUpperCase());
      const unavailableReason = unavailableBySymbol.get(item.ticker.toUpperCase()) ?? null;
      const isManual = item.priceSource === "manual" && Boolean(item.manualPrice);
      const isUnavailable = !isManual && !quote;
      const effectivePrice = resolvePositionPrice(item, quote);
      const invested = item.shares * item.costBasis;
      const current = item.shares * effectivePrice;
      const gainAmount = current - invested;
      const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;
      const change = getChangePresentation(gainPercent);

      return {
        id: item.id,
        priceSource: isManual ? "manual" : "market",
        priceSourceLabel: isManual ? "Manual" : "Mercado",
        quoteStatusLabel: isManual
          ? "Precio manual"
          : (quote ? "En vivo" : "Sin cotización"),
        quoteUpdatedAtLabel: !isManual && quote ? quoteUpdatedAtLabel : null,
        unavailableReason,
        isUnavailable,
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
  }, [items, quoteBySymbol, quoteUpdatedAtLabel, unavailableBySymbol]);

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

    const editorQuote = quoteBySymbol.get(normalizedTickerInput);
    const usesManualPrice = requiresManualPrice;
    const fallbackCurrentPrice = usesManualPrice
      ? currentPrice
      : (editorQuote?.price ?? costBasis);

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

  const marketStatus = useMemo(() => {
    if (isMarketLoading || isMarketRefreshing) {
      return {
        label: "Actualizando...",
        color: "text-[#2563EB]",
      };
    }

    if (marketError && quoteBySymbol.size === 0) {
      return {
        label: "Desactualizado",
        color: "text-[#DC2626]",
      };
    }

    if (quoteBySymbol.size > 0) {
      return {
        label: "En vivo",
        color: "text-[#10B981]",
      };
    }

    if (items.length === 0) {
      return {
        label: "Sin posiciones",
        color: "text-[#71717A]",
      };
    }

    return {
      label: "Sin cotización",
      color: "text-[#D97706]",
    };
  }, [isMarketLoading, isMarketRefreshing, items.length, marketError, quoteBySymbol.size]);

  const tickerAvailabilityMessage = useMemo(() => {
    if (!isEditorOpen || normalizedTickerInput.length === 0) {
      return null;
    }

    if (quoteBySymbol.has(normalizedTickerInput)) {
      return `Cotización en vivo disponible para ${normalizedTickerInput}.`;
    }

    const unavailableReason = unavailableBySymbol.get(normalizedTickerInput);
    if (unavailableReason) {
      return "Ticker no disponible actualmente. Puedes ingresar precio manual.";
    }

    if (marketError) {
      return "No pudimos validar este ticker en este momento.";
    }

    return "Validando ticker...";
  }, [
    isEditorOpen,
    marketError,
    normalizedTickerInput,
    quoteBySymbol,
    unavailableBySymbol,
  ]);

  return {
    cardItems,
    currentPriceInput,
    costBasisInput,
    error: error ?? marketError,
    handleCreate,
    handleHeaderAction,
    handleRefreshQuotes: refresh,
    handleRemove,
    isEditorOpen,
    isFormValid,
    isLoading: isLoading || isMarketLoading,
    isManualPriceEnabled,
    isMarketRefreshing,
    isTickerUnavailable: (
      normalizedTickerInput.length > 0 &&
      unavailableBySymbol.has(normalizedTickerInput) &&
      !quoteBySymbol.has(normalizedTickerInput)
    ),
    marketLastUpdatedLabel: lastUpdatedAt ? formatDateTimeLabel(lastUpdatedAt) : "Sin actualización",
    marketStatusColor: marketStatus.color,
    marketStatusLabel: marketStatus.label,
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
    tickerAvailabilityMessage,
    tickerInput,
  };
};

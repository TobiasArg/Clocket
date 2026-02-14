import { useMemo, useState } from "react";
import type { StockCard as StockCardType } from "@/types";
import { formatCurrency } from "@/utils";
import { useInvestments } from "./useInvestments";

export interface InvestmentChangePresentation {
  bg: string;
  color: string;
  text: string;
}

export interface InvestmentStockCardItem {
  id: string;
  stock: StockCardType;
}

export interface InvestmentsSummary {
  current: number;
  gainAmount: number;
  gainPercent: number;
  invested: number;
}

export interface UseInvestmentsPageModelOptions {
  onAddClick?: () => void;
}

export interface UseInvestmentsPageModelResult {
  cardItems: InvestmentStockCardItem[];
  currentPriceInput: string;
  error: string | null;
  handleCreate: () => Promise<void>;
  handleHeaderAction: () => void;
  handleRemove: (id: string) => Promise<void>;
  isEditorOpen: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  nameInput: string;
  setCostBasisInput: (value: string) => void;
  setCurrentPriceInput: (value: string) => void;
  setNameInput: (value: string) => void;
  setSharesInput: (value: string) => void;
  setTickerInput: (value: string) => void;
  sharesInput: string;
  showValidation: boolean;
  summary: InvestmentsSummary;
  summaryChange: InvestmentChangePresentation;
  tickerInput: string;
  costBasisInput: string;
}

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const shares = parsePositiveNumber(sharesInput);
  const costBasis = parsePositiveNumber(costBasisInput);
  const currentPrice = parsePositiveNumber(currentPriceInput);
  const isTickerValid = tickerInput.trim().length > 0;
  const isNameValid = nameInput.trim().length > 0;
  const isFormValid = isTickerValid && isNameValid && shares > 0 && costBasis > 0 && currentPrice > 0;

  const summary = useMemo<InvestmentsSummary>(() => {
    const invested = items.reduce((sum, item) => sum + item.shares * item.costBasis, 0);
    const current = items.reduce((sum, item) => sum + item.shares * item.currentPrice, 0);
    const gainAmount = current - invested;
    const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;

    return {
      invested,
      current,
      gainAmount,
      gainPercent,
    };
  }, [items]);

  const cardItems = useMemo<InvestmentStockCardItem[]>(() => {
    return items.map((item) => {
      const invested = item.shares * item.costBasis;
      const current = item.shares * item.currentPrice;
      const gainAmount = current - invested;
      const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;
      const change = getChangePresentation(gainPercent);

      return {
        id: item.id,
        stock: {
          ticker: item.ticker,
          name: item.name,
          exchange: item.exchange,
          changeText: change.text,
          changeColor: change.color,
          changeBg: change.bg,
          row1: [
            { label: "Precio Actual", value: formatCurrency(item.currentPrice) },
            { label: "Cantidad", value: `${item.shares.toFixed(2)} acc.` },
            { label: "Valor Total", value: formatCurrency(current) },
          ],
          row2: [
            { label: "Costo Promedio", value: formatCurrency(item.costBasis) },
            { label: "Invertido", value: formatCurrency(invested) },
            {
              label: gainAmount >= 0 ? "Ganancia" : "Pérdida",
              value: `${gainAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(gainAmount))}`,
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
      setShowValidation(false);
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
    }

    onAddClick?.();
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const created = await create({
      ticker: tickerInput,
      name: nameInput,
      shares,
      costBasis,
      currentPrice,
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
    setShowValidation(false);
  };

  const handleRemove = async (id: string): Promise<void> => {
    await remove(id);
  };

  return {
    cardItems,
    currentPriceInput,
    error,
    handleCreate,
    handleHeaderAction,
    handleRemove,
    isEditorOpen,
    isFormValid,
    isLoading,
    nameInput,
    setCostBasisInput,
    setCurrentPriceInput,
    setNameInput,
    setSharesInput,
    setTickerInput,
    sharesInput,
    showValidation,
    summary,
    summaryChange: getChangePresentation(summary.gainPercent),
    tickerInput,
    costBasisInput,
  };
};

import { useMemo, useState } from "react";
import type { NavItem, StockCard as StockCardType } from "@/types";
import {
  ActionButton,
  Avatar,
  BottomNavigation,
  CardSection,
  IconBadge,
  StatDisplay,
  StockCard,
  SummaryPanel,
  TextBadge,
} from "@/components";
import { useInvestments } from "@/hooks";
import { formatCurrency } from "@/utils";

export interface InvestmentsProps {
  avatarInitials?: string;
  avatarBg?: string;
  headerTitle?: string;
  addButtonBg?: string;
  summaryTitle?: string;
  totalLabel?: string;
  gainLabel?: string;
  listTitle?: string;
  quickAddTitle?: string;
  quickAddTickerLabel?: string;
  quickAddNameLabel?: string;
  quickAddSharesLabel?: string;
  quickAddCostBasisLabel?: string;
  quickAddCurrentPriceLabel?: string;
  quickAddSubmitLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  deleteActionLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onStockClick?: (index: number) => void;
  onNavItemClick?: (index: number) => void;
}

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getChangePresentation = (value: number) => {
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

export function Investments({
  avatarInitials = "JS",
  avatarBg = "bg-[#10B981]",
  headerTitle = "Inversiones",
  addButtonBg = "bg-[#10B981]",
  summaryTitle = "Resumen del Portfolio",
  totalLabel = "Valor Total",
  gainLabel = "Ganancia/Pérdida",
  listTitle = "Mis Acciones",
  quickAddTitle = "Nueva inversión",
  quickAddTickerLabel = "Ticker",
  quickAddNameLabel = "Nombre",
  quickAddSharesLabel = "Cantidad",
  quickAddCostBasisLabel = "Costo promedio",
  quickAddCurrentPriceLabel = "Precio actual",
  quickAddSubmitLabel = "Guardar inversión",
  loadingLabel = "Cargando inversiones...",
  emptyTitle = "No hay inversiones",
  emptyHint = "Agrega tu primera posición para seguir tu portfolio.",
  errorLabel = "No pudimos cargar inversiones. Intenta nuevamente.",
  deleteActionLabel = "Delete",
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-pie-slice", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", active: true, to: "/investments" },
    { icon: "dots-three-outline", label: "Más", to: "/more" },
  ],
  onAddClick,
  onStockClick,
  onNavItemClick,
}: InvestmentsProps) {
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

  const summary = useMemo(() => {
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

  const stockCards = useMemo<StockCardType[]>(() => {
    return items.map((item) => {
      const invested = item.shares * item.costBasis;
      const current = item.shares * item.currentPrice;
      const gainAmount = current - invested;
      const gainPercent = invested > 0 ? (gainAmount / invested) * 100 : 0;
      const change = getChangePresentation(gainPercent);

      return {
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

  const summaryChange = getChangePresentation(summary.gainPercent);

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F5F5]">
      <div className="flex items-center justify-between px-5 py-4 bg-white">
        <div className="flex items-center gap-3">
          <Avatar
            initials={avatarInitials}
            bg={avatarBg}
            size="w-[40px] h-[40px]"
            textSize="text-sm"
            className="rounded-[20px]"
          />
          <span className="text-xl font-semibold text-[#18181B] font-['Outfit']">{headerTitle}</span>
        </div>
        <button type="button" onClick={handleHeaderAction} aria-label="Agregar inversión">
          <IconBadge
            icon={isEditorOpen ? "x" : "plus"}
            bg={addButtonBg}
            size="w-[40px] h-[40px]"
            rounded="rounded-[20px]"
          />
        </button>
      </div>

      {isEditorOpen && (
        <div className="px-5 py-3 bg-white">
          <div className="flex flex-col gap-3 rounded-2xl bg-[#F4F4F5] p-4">
            <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
              {quickAddTitle}
            </span>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">{quickAddTickerLabel}</span>
              <input
                type="text"
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value)}
                placeholder="AAPL"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
              <input
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Apple Inc."
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddSharesLabel}</span>
                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={sharesInput}
                  onChange={(event) => setSharesInput(event.target.value)}
                  placeholder="1"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddCurrentPriceLabel}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={currentPriceInput}
                  onChange={(event) => setCurrentPriceInput(event.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">{quickAddCostBasisLabel}</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={costBasisInput}
                onChange={(event) => setCostBasisInput(event.target.value)}
                placeholder="0.00"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              />
            </label>

            {showValidation && !isFormValid && (
              <span className="text-[11px] font-medium text-[#71717A]">
                Complete los campos requeridos con valores mayores a 0.
              </span>
            )}

            <ActionButton
              icon="plus"
              label={quickAddSubmitLabel}
              iconColor="text-white"
              labelColor="text-white"
              bg={isFormValid && !isLoading ? "bg-black" : "bg-[#A1A1AA]"}
              padding="px-4 py-3"
              className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
              onClick={() => {
                void handleCreate();
              }}
            />
          </div>
        </div>
      )}

      <SummaryPanel
        title={summaryTitle}
        titleClassName="text-sm font-medium text-[#71717A] font-['Outfit']"
        bg="bg-white"
        padding="px-5 py-4"
        gap="gap-4"
      >
        <div className="flex justify-between w-full">
          <StatDisplay
            label={totalLabel}
            value={formatCurrency(summary.current)}
            labelClassName="text-xs font-normal text-[#71717A]"
            valueClassName="text-2xl font-bold text-[#18181B] font-['Outfit']"
          />
          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs font-normal text-[#71717A]">{gainLabel}</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold font-['Outfit'] ${summaryChange.color}`}>
                {`${summary.gainAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(summary.gainAmount))}`}
              </span>
              <TextBadge
                text={summaryChange.text}
                bg={summaryChange.bg}
                textColor={summaryChange.color}
                rounded="rounded-lg"
                padding="px-2 py-1"
                fontSize="text-xs"
                fontWeight="font-medium"
              />
            </div>
          </div>
        </div>
      </SummaryPanel>

      <div className="flex-1 overflow-auto px-5 py-4">
        <CardSection
          title={listTitle}
          titleClassName="text-base font-semibold text-[#18181B] font-['Outfit']"
          gap="gap-3"
        >
          {isLoading && items.length === 0 && (
            <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
          )}

          {!isLoading && error && (
            <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="block text-sm font-semibold text-black font-['Outfit']">{emptyTitle}</span>
              <span className="block text-xs font-medium text-[#71717A] mt-1">{emptyHint}</span>
            </div>
          )}

          {stockCards.map((stock, index) => (
            <div key={items[index].id} className="flex flex-col gap-2">
              <StockCard
                ticker={stock.ticker}
                name={stock.name}
                exchange={stock.exchange}
                changeText={stock.changeText}
                changeColor={stock.changeColor}
                changeBg={stock.changeBg}
                row1={stock.row1}
                row2={stock.row2}
                onClick={() => onStockClick?.(index)}
              />
              <button
                type="button"
                onClick={() => {
                  void remove(items[index].id);
                }}
                className="w-fit text-xs font-medium text-[#71717A]"
              >
                {deleteActionLabel}
              </button>
            </div>
          ))}
        </CardSection>
      </div>

      <BottomNavigation
        items={navItems}
        activeColor="text-[#10B981]"
        onItemClick={onNavItemClick}
      />
    </div>
  );
}

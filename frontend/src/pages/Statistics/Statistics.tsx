import type {
  CategoryBreakdown,
  LegendItem,
  NavItem,
  StatisticsScope,
} from "@/modules/statistics";
import {
  BottomNavigation,
  PageHeader,
  PhosphorIcon,
  StatisticsBalanceWidget,
  StatisticsCategoryWidget,
  StatisticsSavingsWidget,
  useStatisticsPageModel,
} from "@/modules/statistics";
import { useEffect, useMemo, useRef, useState } from "react";

export interface StatisticsProps {
  avatarInitials?: string;
  headerTitle?: string;
  periodLabel?: string;
  balanceTitle?: string;
  balanceLegend?: LegendItem[];
  totalIncomeLabel?: string;
  totalIncomeValue?: string;
  totalIncomeColor?: string;
  totalExpenseLabel?: string;
  totalExpenseValue?: string;
  totalExpenseColor?: string;
  categoryTitle?: string;
  categoryTotal?: string;
  categoryTotalLabel?: string;
  categories?: CategoryBreakdown[];
  savingsTitle?: string;
  savingsBadge?: string;
  savingsLabel?: string;
  savingsValue?: string;
  savingsGoalLabel?: string;
  savingsGoalValue?: string;
  savingsBg?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
  navItems?: NavItem[];
  onPeriodClick?: () => void;
  onNavItemClick?: (index: number) => void;
}

export function Statistics({
  avatarInitials = "JS",
  headerTitle = "Statistics",
  periodLabel,
  balanceTitle = "Flujo",
  balanceLegend = [
    { color: "bg-[#16A34A]", label: "Ingresos" },
    { color: "bg-[#DC2626]", label: "Gastos" },
  ],
  totalIncomeLabel = "Ingresos",
  totalIncomeValue,
  totalIncomeColor = "text-[#16A34A]",
  totalExpenseLabel = "Egresos",
  totalExpenseValue,
  totalExpenseColor = "text-[#DC2626]",
  categoryTitle = "Categorías",
  categoryTotal,
  categoryTotalLabel = "",
  categories,
  savingsTitle = "Tendencia",
  savingsBadge,
  savingsLabel = "Ahorro",
  savingsValue,
  savingsGoalLabel = "Meta",
  savingsGoalValue,
  savingsBg = "bg-[#059669]",
  loadingLabel = "Cargando estadísticas...",
  emptyLabel = "No hay movimientos este mes.",
  errorLabel = "No pudimos cargar estadísticas. Intenta nuevamente.",
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-bar", label: "Statistics", active: true, to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "dots-three", label: "Más", to: "/more" },
  ],
  onPeriodClick,
  onNavItemClick,
}: StatisticsProps) {
  const {
    dailyFlow,
    donutSegments,
    hasError,
    isLoading,
    monthlyTransactionsCount,
    scope,
    scopeLabel,
    setScope,
    resolvedCategoryTotal,
    resolvedSavingsBadge,
    resolvedSavingsGoalValue,
    resolvedSavingsValue,
    trendPoints,
  } = useStatisticsPageModel({
    categories,
    categoryTotal,
    savingsBadge,
    savingsGoalValue,
    savingsValue,
    totalExpenseValue,
    totalIncomeValue,
  });

  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const scopeMenuContainerRef = useRef<HTMLDivElement | null>(null);
  const resolvedPeriodLabel = periodLabel ?? scopeLabel;
  const chartAnimationKey = useMemo(
    () => `${scope}-${monthlyTransactionsCount}`,
    [monthlyTransactionsCount, scope],
  );
  const scopeOptions: Array<{ label: string; value: StatisticsScope }> = [
    { label: "Histórico", value: "historical" },
    { label: "Este mes", value: "month" },
    { label: "Este año", value: "year" },
  ];

  useEffect(() => {
    if (!isScopeMenuOpen || typeof window === "undefined") {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (scopeMenuContainerRef.current?.contains(target)) {
        return;
      }

      setIsScopeMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isScopeMenuOpen]);

  const handlePeriodButtonClick = () => {
    onPeriodClick?.();
    setIsScopeMenuOpen((current) => !current);
  };

  const handleScopeChange = (nextScope: StatisticsScope) => {
    setScope(nextScope);
    setIsScopeMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="relative pr-[120px]" ref={scopeMenuContainerRef}>
        <PageHeader title={headerTitle} avatarInitials={avatarInitials} />
        <button
          type="button"
          onClick={handlePeriodButtonClick}
          className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#F4F4F5] rounded-xl px-3 py-2"
          aria-label="Seleccionar periodo"
          aria-expanded={isScopeMenuOpen}
          aria-haspopup="menu"
        >
          <span className="block max-w-[84px] truncate text-[13px] font-semibold text-black">{resolvedPeriodLabel}</span>
          <PhosphorIcon name="caret-down" className="text-black" size="text-[16px]" />
        </button>
        {isScopeMenuOpen && (
          <div className="absolute right-5 top-[calc(50%+28px)] z-30 min-w-[132px] rounded-xl border border-[#E4E4E7] bg-white p-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
            {scopeOptions.map((option) => {
              const isActive = option.value === scope;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleScopeChange(option.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition ${
                    isActive ? "bg-[#F4F4F5] text-black" : "text-[#3F3F46] hover:bg-[#F4F4F5]"
                  }`}
                  role="menuitemradio"
                  aria-checked={isActive}
                >
                  <span>{option.label}</span>
                  {isActive && (
                    <PhosphorIcon name="check" className="text-black" size="text-[14px]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-5 py-2 pb-5">
        <div className="flex flex-col gap-5">
          {isLoading && monthlyTransactionsCount === 0 && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && hasError && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            </div>
          )}

          <StatisticsCategoryWidget
            categoryTitle={categoryTitle}
            categoryTotal={resolvedCategoryTotal}
            categoryTotalLabel={categoryTotalLabel}
            donutSegments={donutSegments}
            emptyLabel={emptyLabel}
            chartAnimationKey={chartAnimationKey}
          />

          <StatisticsBalanceWidget
            balanceTitle={balanceTitle}
            flowDays={dailyFlow}
            popupIncomeLabel={totalIncomeLabel}
            popupExpenseLabel={totalExpenseLabel}
            emptyLabel={emptyLabel}
            chartAnimationKey={chartAnimationKey}
          />

          <StatisticsSavingsWidget
            savingsTitle={savingsTitle}
            savingsBadge={resolvedSavingsBadge}
            savingsLabel={savingsLabel}
            savingsValue={resolvedSavingsValue}
            savingsGoalLabel={savingsGoalLabel}
            savingsGoalValue={resolvedSavingsGoalValue}
            savingsBg={savingsBg}
            trendPoints={trendPoints}
            trendAnimationKey={chartAnimationKey}
          />
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}

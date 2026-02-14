import type {
  CategoryBreakdown,
  LegendItem,
  NavItem,
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
  periodLabel = "Este mes",
  balanceTitle = "Balance Mensual",
  balanceLegend = [
    { color: "bg-[#16A34A]", label: "Ingresos" },
    { color: "bg-[#DC2626]", label: "Gastos" },
  ],
  totalIncomeLabel = "Total Ingresos",
  totalIncomeValue,
  totalIncomeColor = "text-[#16A34A]",
  totalExpenseLabel = "Total Gastos",
  totalExpenseValue,
  totalExpenseColor = "text-[#DC2626]",
  categoryTitle = "Gastos por Categoría",
  categoryTotal,
  categoryTotalLabel = "Total",
  categories,
  savingsTitle = "Tendencia de Ahorro",
  savingsBadge,
  savingsLabel = "Ahorrado este mes",
  savingsValue,
  savingsGoalLabel = "Meta mensual",
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
    donutSegments,
    hasError,
    isLoading,
    monthlyTransactionsCount,
    resolvedCategoryTotal,
    resolvedSavingsBadge,
    resolvedSavingsGoalValue,
    resolvedSavingsValue,
    resolvedTotalExpenseValue,
    resolvedTotalIncomeValue,
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

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="relative pr-[120px]">
        <PageHeader title={headerTitle} avatarInitials={avatarInitials} />
        <button
          type="button"
          onClick={onPeriodClick}
          className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#F4F4F5] rounded-xl px-3 py-2"
          aria-label="Seleccionar periodo"
        >
          <span className="block max-w-[84px] truncate text-[13px] font-semibold text-black">{periodLabel}</span>
          <PhosphorIcon name="caret-down" className="text-black" size="text-[16px]" />
        </button>
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

          <StatisticsBalanceWidget
            balanceTitle={balanceTitle}
            balanceLegend={balanceLegend}
            totalIncomeLabel={totalIncomeLabel}
            totalIncomeValue={resolvedTotalIncomeValue}
            totalIncomeColor={totalIncomeColor}
            totalExpenseLabel={totalExpenseLabel}
            totalExpenseValue={resolvedTotalExpenseValue}
            totalExpenseColor={totalExpenseColor}
          />

          <StatisticsCategoryWidget
            categoryTitle={categoryTitle}
            categoryTotal={resolvedCategoryTotal}
            categoryTotalLabel={categoryTotalLabel}
            donutSegments={donutSegments}
            emptyLabel={emptyLabel}
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
          />
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}

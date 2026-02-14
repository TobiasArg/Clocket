import { useMemo } from "react";
import type { CategoryBreakdown, LegendItem, NavItem } from "@/types";
import {
  BottomNavigation,
  CardSection,
  DonutChart,
  Dot,
  PageHeader,
  PhosphorIcon,
  StatDisplay,
  SummaryPanel,
  TextBadge,
  TrendLine,
} from "@/components";
import { useCategories, useTransactions } from "@/hooks";
import {
  formatCurrency,
  getCurrentMonthWindow,
  getMonthlyBalance,
  getTransactionDateForMonthBalance,
} from "@/utils";

const donutColors = ["#DC2626", "#2563EB", "#EA580C", "#71717A"];

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

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
  const { items: transactions, isLoading, error } = useTransactions();
  const { items: categoriesData } = useCategories();

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categoriesData.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categoriesData]);

  const monthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const monthlyTransactions = useMemo(
    () => transactions.filter((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return false;
      }

      return transactionDate >= monthWindow.start && transactionDate < monthWindow.end;
    }),
    [monthWindow.end, monthWindow.start, transactions],
  );

  const monthlyBalance = useMemo(
    () => getMonthlyBalance(transactions),
    [transactions],
  );

  const computedCategories = useMemo<CategoryBreakdown[]>(() => {
    const grouped = new Map<string, number>();

    monthlyTransactions.forEach((transaction) => {
      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return;
      }

      const categoryName = transaction.categoryId
        ? (categoryNameById.get(transaction.categoryId) ?? "Uncategorized")
        : (transaction.category || "Uncategorized");
      grouped.set(categoryName, (grouped.get(categoryName) ?? 0) + Math.abs(amount));
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, value], index) => {
        const percent = clampPercent((value / total) * 100);
        return {
          dotColor: `bg-[${donutColors[index % donutColors.length]}]`,
          name,
          value: `${formatCurrency(value)} (${percent}%)`,
        };
      });
  }, [categoryNameById, monthlyTransactions]);

  const viewCategories = categories ?? computedCategories;

  const donutSegments = viewCategories.map((category, index) => {
    const match = category.value.match(/\((\d+)%\)/);
    const percentage = match ? Number(match[1]) : 0;
    return {
      color: donutColors[index % donutColors.length],
      name: category.name,
      value: category.value,
      percentage,
    };
  });

  const net = monthlyBalance.net;
  const monthlyGoal = Math.max(0, monthlyBalance.income * 0.6);
  const savingsPercent = monthlyGoal > 0
    ? clampPercent((net / monthlyGoal) * 100)
    : 0;
  const savingsBadgeValue = savingsBadge ?? `${net >= 0 ? "+" : ""}${savingsPercent}%`;

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
          {isLoading && monthlyTransactions.length === 0 && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            </div>
          )}

          <CardSection
            title={balanceTitle}
            titleClassName="text-base font-bold text-black font-['Outfit']"
            action={
              <div className="flex items-center gap-3">
                {balanceLegend.map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <Dot color={item.color} size="w-2 h-2" />
                    <span className="text-[10px] font-medium text-[#71717A]">{item.label}</span>
                  </div>
                ))}
              </div>
            }
            className="bg-[#F4F4F5] rounded-[20px] p-5"
          >
            <div className="flex justify-between w-full">
              <StatDisplay
                label={totalIncomeLabel}
                value={totalIncomeValue ?? formatCurrency(monthlyBalance.income)}
                labelClassName="text-[11px] font-medium text-[#71717A]"
                valueClassName={`text-xl font-bold font-['Outfit'] ${totalIncomeColor}`}
                gap="gap-0.5"
              />
              <StatDisplay
                label={totalExpenseLabel}
                value={totalExpenseValue ?? formatCurrency(monthlyBalance.expense)}
                labelClassName="text-[11px] font-medium text-[#71717A]"
                valueClassName={`text-xl font-bold font-['Outfit'] ${totalExpenseColor}`}
                gap="gap-0.5"
                align="end"
              />
            </div>
          </CardSection>

          <CardSection
            title={categoryTitle}
            titleClassName="text-base font-bold text-black font-['Outfit']"
            className="bg-[#F4F4F5] rounded-[20px] p-5"
          >
            {viewCategories.length === 0 ? (
              <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
            ) : (
              <DonutChart
                segments={donutSegments}
                centerValue={categoryTotal ?? formatCurrency(monthlyBalance.expense)}
                centerLabel={categoryTotalLabel}
                bgFill="#F4F4F5"
              />
            )}
          </CardSection>

          <SummaryPanel
            bg={savingsBg}
            rounded="rounded-[20px]"
            padding="p-5"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-base font-bold text-white font-['Outfit']">{savingsTitle}</span>
              <TextBadge
                text={savingsBadgeValue}
                bg="bg-white/20"
                textColor="text-white"
                rounded="rounded-lg"
                padding="px-2.5 py-1"
                fontSize="text-xs"
                fontWeight="font-semibold"
              />
            </div>
            <TrendLine />
            <div className="flex justify-between w-full">
              <StatDisplay
                label={savingsLabel}
                value={savingsValue ?? formatCurrency(net)}
                labelClassName="text-[11px] font-medium text-white/70"
                valueClassName="text-2xl font-bold text-white font-['Outfit']"
                gap="gap-0.5"
              />
              <StatDisplay
                label={savingsGoalLabel}
                value={savingsGoalValue ?? formatCurrency(monthlyGoal)}
                labelClassName="text-[11px] font-medium text-white/70"
                valueClassName="text-lg font-semibold text-white font-['Outfit']"
                gap="gap-0.5"
                align="end"
              />
            </div>
          </SummaryPanel>
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}

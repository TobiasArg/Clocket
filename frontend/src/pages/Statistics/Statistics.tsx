import {
  DEFAULT_NAV_ITEMS,
  TRANSACTION_EXPENSE_BG_CLASS,
  TRANSACTION_EXPENSE_TEXT_CLASS,
  TRANSACTION_INCOME_BG_CLASS,
  TRANSACTION_INCOME_TEXT_CLASS,
} from "@/constants";
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
import { formatCurrency } from "@/utils";
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
  headerTitle = "Estadísticas",
  periodLabel,
  balanceTitle = "Flujo",
  balanceLegend = [
    { color: TRANSACTION_INCOME_BG_CLASS, label: "Ingresos" },
    { color: TRANSACTION_EXPENSE_BG_CLASS, label: "Gastos" },
  ],
  totalIncomeLabel = "Ingresos",
  totalIncomeValue,
  totalIncomeColor = TRANSACTION_INCOME_TEXT_CLASS,
  totalExpenseLabel = "Egresos",
  totalExpenseValue,
  totalExpenseColor = TRANSACTION_EXPENSE_TEXT_CLASS,
  categoryTitle = "Categorías",
  categoryTotal,
  categoryTotalLabel = "Total",
  categories,
  savingsTitle = "Progreso en Metas",
  savingsBadge,
  savingsLabel = "Ahorro",
  savingsValue,
  savingsGoalLabel = "Meta",
  savingsGoalValue,
  savingsBg = "bg-[var(--surface-muted)]",
  loadingLabel = "Cargando estadísticas...",
  emptyLabel = "No hay movimientos este mes.",
  errorLabel = "No pudimos cargar estadísticas. Intenta nuevamente.",
  navItems = DEFAULT_NAV_ITEMS,
  onPeriodClick,
  onNavItemClick,
}: StatisticsProps) {
  const {
    flowByView,
    donutSegments,
    hasError,
    isLoading,
    monthlyBalance,
    monthlyTransactionsCount,
    scope,
    scopeLabel,
    setScope,
    resolvedCategoryTotal,
    resolvedSavingsBadge,
    resolvedSavingsGoalValue,
    resolvedSavingsValue,
    resolvedTotalExpenseValue,
    resolvedTotalIncomeValue,
    trendPointsByView,
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
  const movementLabel = monthlyTransactionsCount === 1 ? "movimiento" : "movimientos";
  const netValueClassName = monthlyBalance.net >= 0
    ? TRANSACTION_INCOME_TEXT_CLASS
    : TRANSACTION_EXPENSE_TEXT_CLASS;
  const resolvedNetValue = useMemo(() => {
    const absoluteValue = formatCurrency(Math.abs(monthlyBalance.net));
    return `${monthlyBalance.net >= 0 ? "+" : "-"}${absoluteValue}`;
  }, [monthlyBalance.net]);
  const scopeOptions: Array<{ label: string; value: StatisticsScope }> = [
    { label: "Histórico", value: "historical" },
    { label: "Este mes", value: "month" },
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
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <div className="relative border-b border-[var(--surface-border)]/70 pb-2 pr-[124px]" ref={scopeMenuContainerRef}>
        <PageHeader title={headerTitle} avatarInitials={avatarInitials} />
        <button
          type="button"
          onClick={handlePeriodButtonClick}
          className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-2 shadow-[0_10px_18px_rgba(0,0,0,0.06)]"
          aria-label="Seleccionar periodo"
          aria-expanded={isScopeMenuOpen}
          aria-haspopup="menu"
        >
          <span className="block max-w-[84px] truncate text-[13px] font-semibold text-[var(--text-primary)]">{resolvedPeriodLabel}</span>
          <PhosphorIcon name="caret-down" className="text-[var(--text-primary)]" size="text-[16px]" />
        </button>
        {isScopeMenuOpen && (
          <div className="absolute right-5 top-[calc(50%+28px)] z-30 min-w-[132px] rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
            {scopeOptions.map((option) => {
              const isActive = option.value === scope;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleScopeChange(option.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition ${
                    isActive ? "bg-[var(--surface-muted)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  }`}
                  role="menuitemradio"
                  aria-checked={isActive}
                >
                  <span>{option.label}</span>
                  {isActive && (
                    <PhosphorIcon name="check" className="text-[var(--text-primary)]" size="text-[14px]" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-5 py-3 pb-6">
        <div className="flex flex-col gap-4">
          {isLoading && monthlyTransactionsCount === 0 && (
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && hasError && (
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
            </div>
          )}

          <section className="relative overflow-hidden rounded-[24px] border border-[var(--surface-border)] bg-[radial-gradient(120%_130%_at_10%_0%,rgba(34,197,94,0.16),rgba(255,255,255,0)_55%),radial-gradient(95%_120%_at_100%_100%,rgba(59,130,246,0.12),rgba(255,255,255,0)_60%),var(--surface-muted)] p-4">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[rgba(59,130,246,0.12)] blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[rgba(34,197,94,0.12)] blur-2xl" aria-hidden="true" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[1.2px] text-[var(--text-secondary)]">
                    Radar financiero
                  </span>
                  <span className="block mt-1 text-lg font-bold text-[var(--text-primary)] font-['Outfit']">
                    {monthlyTransactionsCount} {movementLabel}
                  </span>
                  <span className="block text-xs font-medium text-[var(--text-secondary)]">
                    {resolvedPeriodLabel}
                  </span>
                </div>
                <span className="rounded-xl bg-[var(--panel-bg)]/85 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
                  {scopeLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/90 px-3 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.9px] text-[var(--text-secondary)]">
                    {totalIncomeLabel}
                  </span>
                  <span className={`mt-1 block text-sm font-semibold ${totalIncomeColor}`}>
                    {resolvedTotalIncomeValue}
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/90 px-3 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.9px] text-[var(--text-secondary)]">
                    {totalExpenseLabel}
                  </span>
                  <span className={`mt-1 block text-sm font-semibold ${totalExpenseColor}`}>
                    {resolvedTotalExpenseValue}
                  </span>
                </div>
                <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/90 px-3 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.9px] text-[var(--text-secondary)]">
                    Neto
                  </span>
                  <span className={`mt-1 block text-sm font-semibold ${netValueClassName}`}>
                    {resolvedNetValue}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {balanceLegend.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} aria-hidden="true" />
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <StatisticsBalanceWidget
            balanceTitle={balanceTitle}
            flowByView={flowByView}
            popupIncomeLabel={totalIncomeLabel}
            popupExpenseLabel={totalExpenseLabel}
            emptyLabel={emptyLabel}
            chartAnimationKey={chartAnimationKey}
          />

          <div className="grid grid-cols-1 gap-4">
            <StatisticsCategoryWidget
              categoryTitle={categoryTitle}
              categoryTotal={resolvedCategoryTotal}
              categoryTotalLabel={categoryTotalLabel}
              donutSegments={donutSegments}
              emptyLabel={emptyLabel}
              chartAnimationKey={chartAnimationKey}
              chartType="pie"
            />

            <StatisticsSavingsWidget
              savingsTitle={savingsTitle}
              savingsBadge={resolvedSavingsBadge}
              savingsLabel={savingsLabel}
              savingsValue={resolvedSavingsValue}
              savingsGoalLabel={savingsGoalLabel}
              savingsGoalValue={resolvedSavingsGoalValue}
              savingsBg={savingsBg}
              trendPointsByView={trendPointsByView}
              trendAnimationKey={chartAnimationKey}
            />
          </div>
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}

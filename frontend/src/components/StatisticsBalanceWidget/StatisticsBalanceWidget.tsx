import type { StatisticsFlowDay } from "@/types";
import type { StatisticsChartView } from "@/hooks";
import type { ComponentType } from "react";
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils";
import { CardSection } from "../CardSection/CardSection";
import { StatisticsViewCarousel } from "../StatisticsViewCarousel/StatisticsViewCarousel";
import { StatisticsFlowDetailPopup } from "./StatisticsFlowDetailPopup";
import type { FlowChartMode, FlowChartViewProps } from "./views/FlowChartView";

const FlowDayView = lazy(async () => {
  const module = await import("./views/FlowDayView");
  return { default: module.FlowDayView };
});
const FlowWeekView = lazy(async () => {
  const module = await import("./views/FlowWeekView");
  return { default: module.FlowWeekView };
});
const FlowMonthView = lazy(async () => {
  const module = await import("./views/FlowMonthView");
  return { default: module.FlowMonthView };
});

const FLOW_VIEW_COMPONENTS: Record<StatisticsChartView, ComponentType<FlowChartViewProps>> = {
  day: FlowDayView,
  month: FlowMonthView,
  week: FlowWeekView,
};
const EMPTY_FLOW_BY_VIEW: Record<StatisticsChartView, StatisticsFlowDay[]> = {
  day: [],
  month: [],
  week: [],
};

export interface StatisticsBalanceWidgetProps {
  balanceTitle?: string;
  chartAnimationKey?: string;
  emptyLabel?: string;
  flowByView?: Record<StatisticsChartView, StatisticsFlowDay[]>;
  popupCloseLabel?: string;
  popupExpenseLabel?: string;
  popupIncomeLabel?: string;
}

export const StatisticsBalanceWidget = memo(function StatisticsBalanceWidget({
  balanceTitle = "Flujo",
  chartAnimationKey = "statistics-flow",
  emptyLabel = "No hay movimientos en los últimos 7 días.",
  flowByView = EMPTY_FLOW_BY_VIEW,
  popupCloseLabel = "Cerrar",
  popupExpenseLabel = "Egresos",
  popupIncomeLabel = "Ingresos",
}: StatisticsBalanceWidgetProps) {
  const [activeView, setActiveView] = useState<StatisticsChartView>("day");
  const [chartMode, setChartMode] = useState<FlowChartMode>("stacked");
  const [selectedDay, setSelectedDay] = useState<StatisticsFlowDay | null>(null);
  const [loadedViews, setLoadedViews] = useState<Record<StatisticsChartView, boolean>>({
    day: true,
    month: false,
    week: false,
  });

  useEffect(() => {
    setLoadedViews((current) => {
      if (current[activeView]) {
        return current;
      }

      return {
        ...current,
        [activeView]: true,
      };
    });
    setSelectedDay(null);
  }, [activeView]);

  const hasFlowData = useMemo(() => (
    Object.values(flowByView).some((rows) => rows.some((day) => day.incomeTotal > 0 || day.expenseTotal > 0))
  ), [flowByView]);
  const activeFlowRows = flowByView[activeView] ?? [];
  const activeSummary = useMemo(() => {
    return activeFlowRows.reduce((summary, day) => ({
      expense: summary.expense + day.expenseTotal,
      income: summary.income + day.incomeTotal,
      net: summary.net + (day.incomeTotal - day.expenseTotal),
    }), { expense: 0, income: 0, net: 0 });
  }, [activeFlowRows]);
  const summaryCards = [
    { key: "income", label: popupIncomeLabel, value: formatCurrency(activeSummary.income), valueClassName: "text-[#16A34A]" },
    { key: "expense", label: popupExpenseLabel, value: formatCurrency(activeSummary.expense), valueClassName: "text-[var(--text-primary)]" },
    {
      key: "net",
      label: "Neto",
      value: `${activeSummary.net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(activeSummary.net))}`,
      valueClassName: activeSummary.net >= 0 ? "text-[#16A34A]" : "text-[var(--text-primary)]",
    },
  ] as const;

  const handlePopupClose = useCallback(() => {
    setSelectedDay(null);
  }, []);

  const renderFlowSlide = useMemo(() => (
    (view: StatisticsChartView) => {
      const flowDays = flowByView[view] ?? [];
      if (!loadedViews[view]) {
        return <div className="h-[220px] w-full rounded-xl bg-[var(--surface-muted)] animate-pulse" />;
      }

      const ViewComponent = FLOW_VIEW_COMPONENTS[view];
      const viewAnimKey = `${chartAnimationKey}-${view}`;
      return (
        <Suspense fallback={<div className="h-[220px] w-full rounded-xl bg-[var(--surface-muted)] animate-pulse" />}>
          <ViewComponent
            key={viewAnimKey}
            animationKey={viewAnimKey}
            flowDays={flowDays}
            emptyLabel={emptyLabel}
            onSelectDay={setSelectedDay}
            chartMode={chartMode}
          />
        </Suspense>
      );
    }
  ), [chartAnimationKey, chartMode, emptyLabel, flowByView, loadedViews]);

  return (
    <>
      <CardSection
        title={balanceTitle}
        titleClassName="text-base font-bold text-[var(--text-primary)] font-['Outfit']"
        className="clocket-aurora-card rounded-[22px] p-5"
        action={(
          <div className="flex items-center rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-1">
            {([
              { id: "stacked", label: "Barras" },
              { id: "net", label: "Neto" },
            ] as const).map((option) => {
              const isActive = chartMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setChartMode(option.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      >
        {!hasFlowData ? (
          <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {summaryCards.map((card) => (
                <div key={card.key} className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-2.5 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
                    {card.label}
                  </span>
                  <span className={`mt-1 block text-xs font-semibold ${card.valueClassName}`}>{card.value}</span>
                </div>
              ))}
            </div>
            <StatisticsViewCarousel
              activeView={activeView}
              onViewChange={setActiveView}
              renderSlide={renderFlowSlide}
            />
          </div>
        )}
      </CardSection>

      <StatisticsFlowDetailPopup
        day={selectedDay}
        onClose={handlePopupClose}
        popupCloseLabel={popupCloseLabel}
        popupExpenseLabel={popupExpenseLabel}
        popupIncomeLabel={popupIncomeLabel}
      />
    </>
  );
});

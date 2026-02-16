import type { StatisticsFlowDay } from "@/types";
import type { StatisticsChartView } from "@/hooks";
import type { ComponentType } from "react";
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CardSection } from "../CardSection/CardSection";
import { StatisticsViewCarousel } from "../StatisticsViewCarousel/StatisticsViewCarousel";
import { StatisticsFlowDetailPopup } from "./StatisticsFlowDetailPopup";
import type { FlowChartViewProps } from "./views/FlowChartView";

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

  const handlePopupClose = useCallback(() => {
    setSelectedDay(null);
  }, []);

  const renderFlowSlide = useMemo(() => (
    (view: StatisticsChartView) => {
      const flowDays = flowByView[view] ?? [];
      if (!loadedViews[view]) {
        return <div className="h-[210px] w-full rounded-xl bg-white/70" />;
      }

      const ViewComponent = FLOW_VIEW_COMPONENTS[view];
      return (
        <Suspense fallback={<div className="h-[210px] w-full rounded-xl bg-white/70" />}>
          <ViewComponent
            animationKey={`${chartAnimationKey}-${view}`}
            flowDays={flowDays}
            emptyLabel={emptyLabel}
            onSelectDay={setSelectedDay}
          />
        </Suspense>
      );
    }
  ), [chartAnimationKey, emptyLabel, flowByView, loadedViews]);

  return (
    <>
      <CardSection
        title={balanceTitle}
        titleClassName="text-base font-bold text-black font-['Outfit']"
        className="bg-[#F4F4F5] rounded-[20px] p-5"
      >
        {!hasFlowData ? (
          <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
        ) : (
          <StatisticsViewCarousel
            activeView={activeView}
            onViewChange={setActiveView}
            renderSlide={renderFlowSlide}
          />
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

import type { StatisticsChartView } from "@/hooks";
import type { ComponentType } from "react";
import { lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { StatisticsViewCarousel } from "../StatisticsViewCarousel/StatisticsViewCarousel";
import { SummaryPanel } from "../SummaryPanel/SummaryPanel";
import { TextBadge } from "../TextBadge/TextBadge";
import type { TrendLinePoint } from "../TrendLine/TrendLine";
import type { TrendChartMode, TrendChartViewProps } from "./views/TrendChartView";

const TrendDayView = lazy(async () => {
  const module = await import("./views/TrendDayView");
  return { default: module.TrendDayView };
});
const TrendWeekView = lazy(async () => {
  const module = await import("./views/TrendWeekView");
  return { default: module.TrendWeekView };
});
const TrendMonthView = lazy(async () => {
  const module = await import("./views/TrendMonthView");
  return { default: module.TrendMonthView };
});

const TREND_VIEW_COMPONENTS: Record<StatisticsChartView, ComponentType<TrendChartViewProps>> = {
  day: TrendDayView,
  month: TrendMonthView,
  week: TrendWeekView,
};
const EMPTY_POINTS_BY_VIEW: Record<StatisticsChartView, TrendLinePoint[]> = {
  day: [],
  month: [],
  week: [],
};

export interface StatisticsSavingsWidgetProps {
  savingsBadge?: string;
  savingsBg?: string;
  savingsGoalLabel?: string;
  savingsGoalValue?: string;
  savingsLabel?: string;
  savingsTitle?: string;
  savingsValue?: string;
  trendAnimationKey?: string;
  trendPointsByView?: Record<StatisticsChartView, TrendLinePoint[]>;
}

export const StatisticsSavingsWidget = memo(function StatisticsSavingsWidget({
  savingsBadge = "+0%",
  savingsBg = "bg-[var(--surface-muted)]",
  savingsGoalLabel = "Meta mensual",
  savingsGoalValue = "$0.00",
  savingsLabel = "Ahorrado este mes",
  savingsTitle = "Tendencia de Ahorro",
  savingsValue = "$0.00",
  trendAnimationKey = "statistics-trend",
  trendPointsByView = EMPTY_POINTS_BY_VIEW,
}: StatisticsSavingsWidgetProps) {
  const [activeView, setActiveView] = useState<StatisticsChartView>("day");
  const [trendMode, setTrendMode] = useState<TrendChartMode>("line");
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
  }, [activeView]);

  const renderTrendSlide = useMemo(() => (
    (view: StatisticsChartView) => {
      const points = trendPointsByView[view] ?? [];
      if (!loadedViews[view]) {
        return <div className="h-[124px] w-full rounded-xl bg-[var(--panel-bg)]/70" />;
      }

      const ViewComponent = TREND_VIEW_COMPONENTS[view];
      return (
        <Suspense fallback={<div className="h-[124px] w-full rounded-xl bg-[var(--panel-bg)]/70" />}>
          <ViewComponent
            animationKey={`${trendAnimationKey}-${view}`}
            mode={trendMode}
            points={points}
          />
        </Suspense>
      );
    }
  ), [loadedViews, trendAnimationKey, trendMode, trendPointsByView]);

  const metrics = [
    { label: savingsLabel, value: savingsValue, valueClassName: "font-bold" },
    { label: savingsGoalLabel, value: savingsGoalValue, valueClassName: "font-semibold" },
  ] as const;

  return (
    <SummaryPanel
      bg={`${savingsBg} border border-[var(--surface-border)]`}
      rounded="rounded-[22px]"
      padding="p-5"
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">{savingsTitle}</span>
          <span className="block text-[11px] font-medium text-[var(--text-secondary)]">Progreso acumulado por período</span>
        </div>
        <TextBadge
          text={savingsBadge}
          bg="bg-[var(--panel-bg)]"
          textColor="text-[var(--text-primary)]"
          rounded="rounded-lg"
          padding="px-2.5 py-1"
          fontSize="text-xs"
          fontWeight="font-semibold"
        />
      </div>
      <div className="flex items-center justify-end">
        <div className="flex items-center rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-1">
          {([
            { id: "line", label: "Línea" },
            { id: "bars", label: "Barras" },
          ] as const).map((option) => {
            const isActive = trendMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTrendMode(option.id)}
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
      </div>
      <StatisticsViewCarousel
        activeView={activeView}
        onViewChange={setActiveView}
        renderSlide={renderTrendSlide}
      />
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">{metric.label}</span>
            <span className={`block text-base text-[var(--text-primary)] font-['Outfit'] ${metric.valueClassName}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </SummaryPanel>
  );
});

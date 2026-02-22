import type { StatisticsChartView } from "@/hooks";
import type { StatisticsTrendPoint } from "@/hooks/useStatisticsPageModel";
import type { ComponentType } from "react";
import { lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils";
import { StatisticsViewCarousel } from "../StatisticsViewCarousel/StatisticsViewCarousel";
import { SummaryPanel } from "../SummaryPanel/SummaryPanel";
import { TextBadge } from "../TextBadge/TextBadge";
import { StatisticsSavingsDetailPopup } from "./StatisticsSavingsDetailPopup";
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
const EMPTY_POINTS_BY_VIEW: Record<StatisticsChartView, StatisticsTrendPoint[]> = {
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
  trendPointsByView?: Record<StatisticsChartView, StatisticsTrendPoint[]>;
}

export const StatisticsSavingsWidget = memo(function StatisticsSavingsWidget({
  savingsBadge = "+0%",
  savingsBg = "bg-[var(--surface-muted)]",
  savingsGoalLabel = "Meta mensual",
  savingsGoalValue = "$0.00",
  savingsLabel = "Ahorrado este mes",
  savingsTitle = "Progreso en Metas",
  savingsValue = "$0.00",
  trendAnimationKey = "statistics-trend",
  trendPointsByView = EMPTY_POINTS_BY_VIEW,
}: StatisticsSavingsWidgetProps) {
  const [activeView, setActiveView] = useState<StatisticsChartView>("day");
  const [trendMode, setTrendMode] = useState<TrendChartMode>("line");
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [detailPointIndex, setDetailPointIndex] = useState<number | null>(null);
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
  const activePoints = trendPointsByView[activeView] ?? [];
  useEffect(() => {
    if (activePoints.length === 0) {
      setSelectedPointIndex(null);
      return;
    }

    setSelectedPointIndex((current) => {
      if (current !== null && current >= 0 && current < activePoints.length) {
        return current;
      }
      return activePoints.length - 1;
    });
  }, [activePoints]);

  const selectedPoint = (
    selectedPointIndex !== null &&
    selectedPointIndex >= 0 &&
    selectedPointIndex < activePoints.length
  )
    ? activePoints[selectedPointIndex]
    : (activePoints[activePoints.length - 1] ?? null);
  const detailPoint = (
    detailPointIndex !== null &&
    detailPointIndex >= 0 &&
    detailPointIndex < activePoints.length
  )
    ? activePoints[detailPointIndex]
    : null;
  const topGoalLegend = useMemo(() => {
    const totalsByGoal = new Map<string, { amount: number; color: string; label: string }>();
    activePoints.forEach((point) => {
      point.goalSegments.forEach((segment) => {
        const key = segment.goalId ?? segment.label;
        const current = totalsByGoal.get(key);
        totalsByGoal.set(key, {
          amount: (current?.amount ?? 0) + segment.amount,
          color: current?.color ?? segment.color,
          label: current?.label ?? segment.label,
        });
      });
    });

    return Array.from(totalsByGoal.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 4);
  }, [activePoints]);

  const renderTrendSlide = useMemo(() => (
    (view: StatisticsChartView) => {
      const points = trendPointsByView[view] ?? [];
      if (!loadedViews[view]) {
        return <div className="h-[172px] w-full rounded-xl bg-[var(--panel-bg)]/70" />;
      }

      const ViewComponent = TREND_VIEW_COMPONENTS[view];
      return (
        <Suspense fallback={<div className="h-[172px] w-full rounded-xl bg-[var(--panel-bg)]/70" />}>
          <ViewComponent
            animationKey={`${trendAnimationKey}-${view}`}
            mode={trendMode}
            onSelectPoint={(_, index) => {
              setSelectedPointIndex(index);
              setDetailPointIndex(index);
              if (view !== activeView) {
                setActiveView(view);
              }
            }}
            points={points}
            selectedPointIndex={view === activeView ? selectedPointIndex : null}
          />
        </Suspense>
      );
    }
  ), [activeView, loadedViews, selectedPointIndex, trendAnimationKey, trendMode, trendPointsByView]);

  const metrics = [
    { label: savingsLabel, value: savingsValue, valueClassName: "font-bold" },
    { label: savingsGoalLabel, value: savingsGoalValue, valueClassName: "font-semibold" },
  ] as const;

  return (
    <>
      <SummaryPanel
        bg={`${savingsBg} border border-[var(--surface-border)]`}
        rounded="rounded-[22px]"
        padding="p-5"
      >
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="min-w-0">
            <span className="block text-base font-bold text-[var(--text-primary)] font-['Outfit']">{savingsTitle}</span>
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[var(--panel-bg)] px-2.5 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">Punto seleccionado</span>
            <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
              {selectedPoint ? `${selectedPoint.label} · ${selectedPoint.value.toFixed(1)}%` : "Sin datos"}
            </span>
          </div>
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

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-2 py-2">
            <StatisticsViewCarousel
              activeView={activeView}
              onViewChange={setActiveView}
              renderSlide={renderTrendSlide}
            />
          </div>

          <div className="flex flex-col gap-2">
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
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
                Metas con mayor aporte
              </span>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {topGoalLegend.length === 0 ? (
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">Sin aportes en el período</span>
                ) : (
                  topGoalLegend.map((item) => (
                    <div key={`${item.label}-${item.color}`} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true">
                          <circle cx="5" cy="5" r="5" fill={item.color} />
                        </svg>
                        <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">{item.label}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-primary)]">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </SummaryPanel>

      <StatisticsSavingsDetailPopup
        point={detailPoint}
        onClose={() => {
          setDetailPointIndex(null);
        }}
      />
    </>
  );
});

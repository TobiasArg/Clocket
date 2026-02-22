import type { DonutSegment } from "@/types";
import { lazy, memo, Suspense, useMemo } from "react";
import { CardSection } from "../CardSection/CardSection";

const DonutChart = lazy(async () => {
  const module = await import("../DonutChart/DonutChart");
  return { default: module.DonutChart };
});

export interface StatisticsCategoryWidgetProps {
  categoryTitle?: string;
  categoryTotal?: string;
  categoryTotalLabel?: string;
  chartAnimationKey?: string;
  chartSize?: string;
  chartType?: "donut" | "pie";
  donutSegments?: DonutSegment[];
  emptyLabel?: string;
  showCenterValue?: boolean;
  showMetaText?: boolean;
  showLegend?: boolean;
}

export const StatisticsCategoryWidget = memo(function StatisticsCategoryWidget({
  categoryTitle = "Gastos por Categoría",
  categoryTotal = "$0.00",
  categoryTotalLabel = "Total del período",
  chartAnimationKey = "statistics-category",
  chartSize = "w-[176px] h-[176px]",
  chartType = "pie",
  donutSegments = [],
  emptyLabel = "No hay movimientos este mes.",
  showCenterValue = false,
  showMetaText = false,
  showLegend = false,
}: StatisticsCategoryWidgetProps) {
  const resolvedCategoryTotalLabel = categoryTotalLabel.trim().length > 0
    ? categoryTotalLabel
    : "Total del período";
  const normalizedSegments = useMemo(() => {
    const withPositivePercentages = donutSegments.filter((segment) => segment.percentage > 0);
    if (withPositivePercentages.length > 0) {
      return withPositivePercentages;
    }

    if (donutSegments.length === 0) {
      return [];
    }

    const fallbackPercent = Math.round(100 / donutSegments.length);
    return donutSegments.map((segment) => ({
      ...segment,
      percentage: fallbackPercent,
    }));
  }, [donutSegments]);

  const hasSegments = normalizedSegments.length > 0;

  return (
    <CardSection
      title={categoryTitle}
      titleClassName="text-base font-bold text-[var(--text-primary)] font-['Outfit']"
      className="relative overflow-hidden rounded-[22px] border border-[var(--surface-border)] bg-[linear-gradient(170deg,var(--surface-muted),rgba(244,244,245,0.45))] p-5"
    >
      {!hasSegments ? (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
      ) : (
        <div className="flex flex-col gap-4">
          {showMetaText && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {resolvedCategoryTotalLabel}: <span className="font-semibold text-[var(--text-primary)]">{categoryTotal}</span>
            </span>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
                {resolvedCategoryTotalLabel}
              </span>
              <span className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">{categoryTotal}</span>
              <Suspense fallback={<div className={`${chartSize} rounded-full bg-[var(--surface-muted)] animate-pulse`} />}>
                <DonutChart
                  animationKey={chartAnimationKey}
                  segments={normalizedSegments}
                  centerValue={showCenterValue ? categoryTotal : undefined}
                  centerLabel={resolvedCategoryTotalLabel}
                  chartType={chartType}
                  showLegend={showLegend}
                  legendPosition={chartType === "pie" ? "bottom" : "right"}
                  size={chartSize}
                  legendValueClassName="text-[11px] font-semibold text-[var(--text-secondary)]"
                />
              </Suspense>
            </div>

            <div className="flex flex-col gap-2">
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5">
                <div className="flex flex-col gap-2">
                  {normalizedSegments.map((segment) => (
                    <div key={segment.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-[var(--text-primary)]">{segment.name}</span>
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                          {segment.value} · {segment.percentage}%
                        </span>
                      </div>
                      <div className="h-[6px] w-full rounded-full bg-[var(--surface-border)]">
                        <div
                          className="h-full rounded-full transition-[width] duration-300"
                          style={{
                            backgroundColor: segment.color,
                            width: `${Math.max(6, Math.min(100, segment.percentage))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CardSection>
  );
});

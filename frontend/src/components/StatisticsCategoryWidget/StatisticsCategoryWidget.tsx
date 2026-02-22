import type { DonutSegment } from "@/types";
import { lazy, memo, Suspense } from "react";
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
  categoryTotalLabel = "Total",
  chartAnimationKey = "statistics-category",
  chartSize = "w-[280px] h-[280px]",
  chartType = "donut",
  donutSegments = [],
  emptyLabel = "No hay movimientos este mes.",
  showCenterValue = true,
  showMetaText = false,
  showLegend = false,
}: StatisticsCategoryWidgetProps) {
  const hasSegments = donutSegments.length > 0;

  return (
    <CardSection
      title={categoryTitle}
      titleClassName="text-base font-bold text-[var(--text-primary)] font-['Outfit']"
      className="bg-[var(--surface-muted)] rounded-[20px] p-5"
    >
      {!hasSegments ? (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
      ) : (
        <div className="flex flex-col gap-3">
          {showMetaText && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {categoryTotalLabel}: <span className="font-semibold text-[var(--text-primary)]">{categoryTotal}</span>
            </span>
          )}
          <Suspense fallback={<div className={`${chartSize} rounded-full bg-[var(--surface-muted)] animate-pulse`} />}>
            <DonutChart
              animationKey={chartAnimationKey}
              segments={donutSegments}
              centerValue={showCenterValue ? categoryTotal : undefined}
              centerLabel={categoryTotalLabel}
              chartType={chartType}
              showLegend={showLegend}
              legendPosition={chartType === "pie" ? "bottom" : "right"}
              size={chartSize}
              legendValueClassName="text-[11px] font-semibold text-[var(--text-secondary)]"
            />
          </Suspense>
        </div>
      )}
    </CardSection>
  );
});

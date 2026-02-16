import type { DonutSegment } from "@/types";
import { memo } from "react";
import { CardSection } from "../CardSection/CardSection";
import { DonutChart } from "../DonutChart/DonutChart";

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
      titleClassName="text-base font-bold text-black font-['Outfit']"
      className="bg-[#F4F4F5] rounded-[20px] p-5"
    >
      {!hasSegments ? (
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
      ) : (
        <div className="flex flex-col gap-3">
          {showMetaText && (
            <span className="text-[11px] font-medium text-[#71717A]">
              {categoryTotalLabel}: <span className="font-semibold text-[#27272A]">{categoryTotal}</span>
            </span>
          )}
          <DonutChart
            animationKey={chartAnimationKey}
            segments={donutSegments}
            centerValue={showCenterValue ? categoryTotal : undefined}
            centerLabel={categoryTotalLabel}
            bgFill="#F4F4F5"
            chartType={chartType}
            showLegend={showLegend}
            legendPosition={chartType === "pie" ? "bottom" : "right"}
            size={chartSize}
            legendValueClassName="text-[11px] font-semibold text-[#3F3F46]"
          />
        </div>
      )}
    </CardSection>
  );
});

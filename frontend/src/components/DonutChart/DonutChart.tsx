import type { DonutSegment } from "@/types";
import { memo, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutChartProps {
  segments: DonutSegment[];
  centerValue?: string;
  centerLabel?: string;
  chartType?: "donut" | "pie";
  legendPosition?: "right" | "bottom";
  showLegend?: boolean;
  size?: string;
  bgFill?: string;
  centerValueClassName?: string;
  centerLabelClassName?: string;
  legendNameClassName?: string;
  legendValueClassName?: string;
  className?: string;
}

export const DonutChart = memo(function DonutChart({
  segments,
  centerValue,
  centerLabel,
  chartType = "donut",
  legendPosition = "right",
  showLegend = true,
  size = "w-[100px] h-[100px]",
  bgFill = "#F4F4F5",
  centerValueClassName = "text-sm font-bold text-black font-['Outfit']",
  centerLabelClassName = "text-[9px] font-medium text-[#71717A]",
  legendNameClassName = "text-[13px] font-medium text-black",
  legendValueClassName = "text-xs font-medium text-[#71717A]",
  className = "",
}: DonutChartProps) {
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

  const centerBgClassName = bgFill === "#FFFFFF" ? "bg-white" : "bg-[#F4F4F5]";
  const innerRadius = chartType === "pie" ? "0%" : "58%";
  const isLegendBottom = legendPosition === "bottom";

  const normalizedSegments = useMemo(() => {
    const hasPositivePercentages = segments.some((segment) => segment.percentage > 0);
    if (hasPositivePercentages) {
      return segments.filter((segment) => segment.percentage > 0);
    }

    return segments.map((segment) => ({
      ...segment,
      percentage: segments.length > 0 ? Math.round(100 / segments.length) : 0,
    }));
  }, [segments]);
  const selectedSegment = selectedSegmentIndex !== null
    ? (normalizedSegments[selectedSegmentIndex] ?? null)
    : null;

  return (
    <div
      className={`flex w-full ${
        showLegend
          ? (isLegendBottom ? "flex-col items-center gap-3" : "items-center gap-5")
          : "items-center justify-center"
      } ${className}`}
    >
      <div className={`relative ${size} shrink-0`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalizedSegments}
              dataKey="percentage"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius="100%"
              paddingAngle={2}
              stroke={bgFill}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {normalizedSegments.map((segment, index) => (
                <Cell
                  key={segment.name}
                  fill={segment.color}
                  fillOpacity={
                    selectedSegmentIndex === null || selectedSegmentIndex === index ? 1 : 0.35
                  }
                  onClick={() => setSelectedSegmentIndex((current) => (current === index ? null : index))}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {chartType === "donut" && ((selectedSegment?.value ?? centerValue) || centerLabel) && (
          <div
            className={`pointer-events-none absolute inset-[21%] flex flex-col items-center justify-center rounded-full ${centerBgClassName}`}
          >
            {(selectedSegment?.value ?? centerValue) && (
              <span className={centerValueClassName}>{selectedSegment?.value ?? centerValue}</span>
            )}
            {centerLabel && <span className={centerLabelClassName}>{centerLabel}</span>}
            {selectedSegment?.name && (
              <span className="mt-0.5 max-w-[85%] truncate text-center text-[10px] font-semibold text-[#3F3F46]">
                {selectedSegment.name}
              </span>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className={`${isLegendBottom ? "grid w-full grid-cols-2 gap-2" : "flex flex-1 flex-col gap-2"}`}>
          {segments.map((segment) => (
            <div key={segment.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="5" fill={segment.color} />
                </svg>
                <span className={`truncate ${legendNameClassName}`}>{segment.name}</span>
              </div>
              <span className={`shrink-0 ${legendValueClassName}`}>{segment.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

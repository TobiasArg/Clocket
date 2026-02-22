import type { DonutSegment } from "@/types";
import { useAppSettings } from "@/hooks";
import { memo, useEffect, useMemo, useState } from "react";

export interface DonutChartProps {
  animationKey?: string;
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
  onSegmentSelect?: (segment: DonutSegment | null) => void;
}

export const DonutChart = memo(function DonutChart({
  animationKey = "donut",
  segments,
  centerValue,
  centerLabel,
  chartType = "donut",
  legendPosition = "right",
  showLegend = true,
  size = "w-[100px] h-[100px]",
  bgFill,
  centerValueClassName = "text-sm font-bold text-[var(--text-primary)] font-['Outfit']",
  centerLabelClassName = "text-[9px] font-medium text-[var(--text-secondary)]",
  legendNameClassName = "text-[13px] font-medium text-[var(--text-primary)]",
  legendValueClassName = "text-xs font-medium text-[var(--text-secondary)]",
  className = "",
  onSegmentSelect,
}: DonutChartProps) {
  const { settings } = useAppSettings();
  const isDark = settings?.theme === "dark";
  const resolvedBgFill = bgFill ?? (isDark ? "#27272a" : "#f4f4f5");
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

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

  const chartSegments = useMemo(() => {
    const total = normalizedSegments.reduce((accumulator, segment) => {
      return accumulator + Math.max(segment.percentage, 0);
    }, 0);
    if (total <= 0) {
      return [];
    }

    let cursor = -Math.PI / 2;
    return normalizedSegments.map((segment, index) => {
      const ratio = Math.max(segment.percentage, 0) / total;
      const sweep = ratio * Math.PI * 2;
      const startAngle = cursor;
      const endAngle = cursor + sweep;
      cursor = endAngle;
      return { endAngle, index, segment, startAngle };
    });
  }, [normalizedSegments]);

  const radius = 48;
  const innerRadiusValue = chartType === "pie" ? 0 : 28;
  const ringThickness = radius - innerRadiusValue;

  const toPolar = (angle: number, customRadius: number) => ({
    x: 50 + customRadius * Math.cos(angle),
    y: 50 + customRadius * Math.sin(angle),
  });

  const arcPath = (startAngle: number, endAngle: number) => {
    const clampedEnd = Math.min(endAngle, startAngle + Math.PI * 2 - 0.0001);
    const largeArc = clampedEnd - startAngle > Math.PI ? 1 : 0;
    const outerStart = toPolar(startAngle, radius);
    const outerEnd = toPolar(clampedEnd, radius);
    if (chartType === "pie") {
      return `M 50 50 L ${outerStart.x} ${outerStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} Z`;
    }

    const innerStart = toPolar(clampedEnd, innerRadiusValue);
    const innerEnd = toPolar(startAngle, innerRadiusValue);
    return `M ${outerStart.x} ${outerStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadiusValue} ${innerRadiusValue} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;
  };

  const selectedSegment = selectedSegmentIndex !== null
    ? (normalizedSegments[selectedSegmentIndex] ?? null)
    : null;
  const segmentIndexByName = useMemo(() => {
    return new Map(normalizedSegments.map((segment, index) => [segment.name, index]));
  }, [normalizedSegments]);

  useEffect(() => {
    onSegmentSelect?.(selectedSegment);
  }, [onSegmentSelect, selectedSegment]);

  const toggleSegment = (index: number | null) => {
    if (index === null || index < 0) {
      setSelectedSegmentIndex(null);
      return;
    }

    setSelectedSegmentIndex((current) => (current === index ? null : index));
  };

  return (
    <div
      className={`flex w-full ${
        showLegend
          ? (isLegendBottom ? "flex-col items-center gap-3" : "items-center gap-5")
          : "items-center justify-center"
      } ${className}`}
    >
      <div className={`relative ${size} shrink-0`}>
        <svg key={animationKey} viewBox="0 0 100 100" className="h-full w-full" aria-label="Donut chart">
          {chartType === "donut" && (
            <circle
              cx="50"
              cy="50"
              r={innerRadiusValue + ringThickness / 2}
              fill="none"
              stroke={resolvedBgFill}
              strokeWidth={ringThickness}
            />
          )}
          {chartSegments.map(({ segment, index, startAngle, endAngle }) => (
            <path
              key={segment.name}
              d={arcPath(startAngle, endAngle)}
              fill={segment.color}
              fillOpacity={selectedSegmentIndex === null || selectedSegmentIndex === index ? 1 : 0.35}
              stroke={resolvedBgFill}
              strokeWidth={1}
              className="cursor-pointer transition-opacity duration-200"
              onClick={() => toggleSegment(index)}
            />
          ))}
        </svg>
        {chartType === "donut" && ((selectedSegment?.value ?? centerValue) || centerLabel) && (
          <div
            className="pointer-events-none absolute inset-[21%] flex flex-col items-center justify-center rounded-full"
            style={{ backgroundColor: resolvedBgFill }}
          >
            {(selectedSegment?.value ?? centerValue) && (
              <span className={centerValueClassName}>{selectedSegment?.value ?? centerValue}</span>
            )}
            {centerLabel && <span className={centerLabelClassName}>{centerLabel}</span>}
            {selectedSegment?.name && (
              <span className="mt-0.5 max-w-[85%] truncate text-center text-[10px] font-semibold text-[var(--text-secondary)]">
                {selectedSegment.name}
              </span>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className={`${isLegendBottom ? "grid w-full grid-cols-2 gap-2" : "flex flex-1 flex-col gap-2"}`}>
          {segments.map((segment) => (
            <button
              key={segment.name}
              type="button"
              onClick={() => toggleSegment(segmentIndexByName.get(segment.name) ?? null)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left transition-colors ${
                selectedSegment?.name === segment.name ? "bg-[var(--surface-muted)]/70" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="5" fill={segment.color} />
                </svg>
                <span className={`truncate ${legendNameClassName}`}>{segment.name}</span>
              </div>
              <span className={`shrink-0 ${legendValueClassName}`}>{segment.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

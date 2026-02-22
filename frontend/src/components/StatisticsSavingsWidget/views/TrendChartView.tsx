import { useAppSettings } from "@/hooks";
import type { StatisticsTrendPoint } from "@/hooks/useStatisticsPageModel";
import { useEffect, useRef, useState } from "react";

export type TrendChartMode = "line" | "bars";

export interface TrendChartViewProps {
  animationKey: string;
  mode?: TrendChartMode;
  onSelectPoint?: (point: StatisticsTrendPoint, index: number) => void;
  points: StatisticsTrendPoint[];
  selectedPointIndex?: number | null;
}

const clampNumber = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

export function TrendChartView({
  animationKey,
  mode = "line",
  onSelectPoint,
  points,
  selectedPointIndex = null,
}: TrendChartViewProps) {
  const { settings } = useAppSettings();
  const isDark = settings?.theme === "dark";
  const lineColor = isDark ? "#4ade80" : "#16a34a";
  const barColor = isDark ? "#60a5fa" : "#2563eb";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(63,63,70,0.12)";
  const tickColor = isDark ? "#a1a1aa" : "#71717a";
  const markerFill = isDark ? "#18181b" : "#ffffff";
  const markerRing = isDark ? "rgba(74,222,128,0.35)" : "rgba(22,163,74,0.26)";
  const selectedStroke = isDark ? "rgba(244,244,245,0.65)" : "rgba(24,24,27,0.55)";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [responsiveWidth, setResponsiveWidth] = useState<number>(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const evaluateSize = () => {
      setResponsiveWidth(node.getBoundingClientRect().width);
    };

    evaluateSize();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      evaluateSize();
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (points.length === 0) {
    return (
      <div className="flex h-[172px] w-full items-center justify-center rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/75 px-3">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Sin datos para esta vista</span>
      </div>
    );
  }

  const width = Math.max(260, Math.round(responsiveWidth || 340));
  const height = 172;
  const padding = { bottom: 34, left: 24, right: 10, top: 14 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxPercent = Math.max(100, ...points.map((point) => point.value));
  const maxBucketSaved = Math.max(1, ...points.map((point) => point.bucketSaved));
  const minValue = 0;
  const valueRange = Math.max(1, maxPercent - minValue);
  const mapX = (index: number): number => {
    if (points.length <= 1) {
      return padding.left + chartWidth / 2;
    }
    return padding.left + (index / (points.length - 1)) * chartWidth;
  };
  const mapY = (value: number): number => {
    const normalized = (value - minValue) / valueRange;
    return padding.top + chartHeight * (1 - normalized);
  };

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${mapX(index)} ${mapY(point.value)}`)
    .join(" ");
  const firstX = mapX(0);
  const lastX = mapX(points.length - 1);
  const baselineY = padding.top + chartHeight;
  const areaPath = `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  const fillId = `trend-fill-${animationKey.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const handleSelect = (index: number): void => {
    const point = points[index];
    if (!point) {
      return;
    }

    onSelectPoint?.(point, index);
  };

  return (
    <div ref={containerRef} className="h-[172px] w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/75 px-2 py-2">
      <svg key={animationKey} viewBox={`0 0 ${width} ${height}`} className="h-full w-full" aria-label="Trend chart">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = padding.top + chartHeight * step;
          const tick = Math.round(maxPercent * (1 - step));
          return (
            <g key={`grid-${step}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke={gridColor}
                strokeWidth={step === 0 ? "1.2" : "1"}
                strokeDasharray={step === 0 ? "4 4" : undefined}
              />
              <text
                x={2}
                y={y + 3}
                fill={tickColor}
                fontSize="9"
                fontWeight="600"
              >
                {`${tick}%`}
              </text>
            </g>
          );
        })}

        {mode === "line" ? (
          <>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${fillId})`} />
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (
              <g
                key={`point-${point.label}-${index}`}
                className="cursor-pointer"
                onClick={() => handleSelect(index)}
              >
                <line
                  x1={mapX(index)}
                  y1={mapY(point.value)}
                  x2={mapX(index)}
                  y2={baselineY}
                  stroke={lineColor}
                  strokeOpacity="0.16"
                  strokeWidth="1.2"
                />
                {selectedPointIndex === index && (
                  <circle cx={mapX(index)} cy={mapY(point.value)} r="8.5" fill={markerRing} />
                )}
                <circle cx={mapX(index)} cy={mapY(point.value)} r="4.4" fill={lineColor} />
                <circle cx={mapX(index)} cy={mapY(point.value)} r="2" fill={markerFill} />
                {(selectedPointIndex === index || index === points.length - 1) && (
                  <text
                    x={mapX(index)}
                    y={mapY(point.value) - 8}
                    textAnchor="middle"
                    fill={lineColor}
                    fontSize="9.5"
                    fontWeight="700"
                  >
                    {`${point.value.toFixed(1)}%`}
                  </text>
                )}
              </g>
            ))}
          </>
        ) : (
          <>
            {points.map((point, index) => {
              const centerX = mapX(index);
              const barWidth = clampNumber(chartWidth / (points.length * 1.8), 10, 26);
              const barHeight = (point.bucketSaved / maxBucketSaved) * chartHeight;
              const barLeft = centerX - barWidth / 2;
              let cursorY = baselineY - barHeight;
              return (
                <g
                  key={`bar-${point.label}-${index}`}
                  className="cursor-pointer"
                  onClick={() => handleSelect(index)}
                >
                  {point.goalSegments.length === 0 ? (
                    <rect
                      x={barLeft}
                      y={baselineY - 1.5}
                      width={barWidth}
                      height="1.5"
                      rx="1"
                      fill={barColor}
                      fillOpacity="0.4"
                    />
                  ) : point.goalSegments.map((segment, segmentIndex) => {
                    const ratio = point.bucketSaved > 0 ? segment.amount / point.bucketSaved : 0;
                    const remainingHeight = Math.max(0, baselineY - cursorY);
                    const segmentHeight = segmentIndex === point.goalSegments.length - 1
                      ? remainingHeight
                      : Math.max(0, barHeight * ratio);
                    const isTop = segmentIndex === 0;
                    const shape = (
                      <rect
                        key={`${segment.label}-${segmentIndex}`}
                        x={barLeft}
                        y={cursorY}
                        width={barWidth}
                        height={segmentHeight}
                        rx={isTop ? "4" : "0"}
                        fill={segment.color}
                      />
                    );
                    cursorY += segmentHeight;
                    return shape;
                  })}
                  {selectedPointIndex === index && (
                    <circle
                      cx={centerX}
                      cy={baselineY - barHeight - 6}
                      r="4.2"
                      fill={markerFill}
                      stroke={selectedStroke}
                      strokeWidth="1.8"
                    />
                  )}
                </g>
              );
            })}
          </>
        )}

        {points.map((point, index) => (
          <text
            key={`label-${point.label}-${index}`}
            x={mapX(index)}
            y={height - 5}
            textAnchor="middle"
            fill={tickColor}
            fontSize="10"
            fontWeight="600"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

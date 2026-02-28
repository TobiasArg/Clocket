import type { StatisticsFlowDay } from "@/types";
import { useAppSettings } from "@/hooks";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/utils";

export type FlowChartMode = "stacked" | "net";

export interface FlowChartViewProps {
  animationKey: string;
  chartMode?: FlowChartMode;
  emptyLabel: string;
  flowDays: StatisticsFlowDay[];
  onSelectDay: (day: StatisticsFlowDay) => void;
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

export const FlowChartView = memo(function FlowChartView({
  animationKey,
  chartMode = "stacked",
  emptyLabel,
  flowDays,
  onSelectDay,
}: FlowChartViewProps) {
  const { settings } = useAppSettings();
  const isDark = settings?.theme === "dark";

  const tickColor = isDark ? "#a1a1aa" : "#71717a";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(63,63,70,0.14)";
  const zeroLineColor = isDark ? "#52525b" : "#d4d4d8";
  const incomeColor = isDark ? "#4ade80" : "#16a34a";
  const expenseColor = isDark ? "#a1a1aa" : "#18181b";
  const netPositiveColor = isDark ? "#4ade80" : "#22c55e";
  const netNegativeColor = isDark ? "#fca5a5" : "#dc2626";

  const chartRows = useMemo(() => {
    return flowDays.map((day) => ({
      expenseTotal: day.expenseTotal,
      incomeTotal: day.incomeTotal,
      label: day.label,
      net: day.incomeTotal - day.expenseTotal,
    }));
  }, [flowDays]);

  const hasFlowData = useMemo(() => {
    return chartRows.some((row) => row.incomeTotal > 0 || row.expenseTotal > 0);
  }, [chartRows]);

  const handlePointSelect = useCallback((index: number) => {
    const clickedDay = flowDays[index];
    if (!clickedDay) {
      return;
    }

    onSelectDay(clickedDay);
  }, [flowDays, onSelectDay]);

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

  if (!hasFlowData) {
    return <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>;
  }

  const svgWidth = Math.max(280, Math.round(responsiveWidth || 360));
  const svgHeight = 210;

  return (
    <div ref={containerRef} className="h-[220px] w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/70 px-2 py-2 animate-chart-in">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-full w-full" aria-label="Flow chart">
        {(() => {
          const padding = { bottom: 24, left: 10, right: 10, top: 8 };
          const plotWidth = svgWidth - padding.left - padding.right;
          const plotHeight = svgHeight - padding.top - padding.bottom;
          const groupWidth = chartRows.length > 0 ? plotWidth / chartRows.length : plotWidth;
          const labelY = svgHeight - 6;

          if (chartMode === "net") {
            const maxAbsNet = Math.max(1, ...chartRows.map((row) => Math.abs(row.net)));
            const axisLabelX = padding.left + 2;
            const zeroY = padding.top + plotHeight / 2;
            const verticalReach = plotHeight / 2 - 14;

            const points = chartRows.map((row, index) => {
              const x = padding.left + groupWidth * index + groupWidth / 2;
              const y = zeroY - (row.net / maxAbsNet) * verticalReach;
              return { ...row, index, x, y };
            });

            const linePath = points
              .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
              .join(" ");
            const firstPoint = points[0];
            const lastPoint = points[points.length - 1];
            const areaPath = firstPoint && lastPoint
              ? `${linePath} L ${lastPoint.x} ${zeroY} L ${firstPoint.x} ${zeroY} Z`
              : "";
            const fillId = `flow-net-fill-${animationKey.replace(/[^a-zA-Z0-9_-]/g, "")}`;

            return (
              <>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={netPositiveColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={netPositiveColor} stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map((step) => {
                  const y = padding.top + plotHeight * step;
                  return (
                    <line
                      key={`grid-${step}`}
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + plotWidth}
                      y2={y}
                      stroke={gridColor}
                      strokeWidth="1"
                    />
                  );
                })}

                <line
                  x1={padding.left}
                  y1={zeroY}
                  x2={padding.left + plotWidth}
                  y2={zeroY}
                  stroke={zeroLineColor}
                  strokeWidth="1"
                />

                <text
                  x={axisLabelX}
                  y={padding.top + 8}
                  fill={tickColor}
                  fontSize="9"
                  fontWeight="700"
                >
                  {`+${formatCurrency(maxAbsNet)}`}
                </text>
                <text
                  x={axisLabelX}
                  y={zeroY - 2}
                  fill={tickColor}
                  fontSize="9"
                  fontWeight="700"
                >
                  0
                </text>
                <text
                  x={axisLabelX}
                  y={padding.top + plotHeight - 2}
                  fill={tickColor}
                  fontSize="9"
                  fontWeight="700"
                >
                  {`-${formatCurrency(maxAbsNet)}`}
                </text>
                <text
                  x={padding.left + plotWidth}
                  y={padding.top + 8}
                  textAnchor="end"
                  fill={netPositiveColor}
                  fontSize="9"
                  fontWeight="700"
                >
                  Neto (+/-)
                </text>

                {areaPath && <path d={areaPath} fill={`url(#${fillId})`} />}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={netPositiveColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {points.map((point) => {
                  const isPositive = point.net >= 0;
                  const pointColor = isPositive ? netPositiveColor : netNegativeColor;

                  return (
                    <g
                      key={`net-point-${point.index}`}
                      className="cursor-pointer"
                      onClick={() => handlePointSelect(point.index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handlePointSelect(point.index);
                        }
                      }}
                    >
                      <line
                        x1={point.x}
                        y1={zeroY}
                        x2={point.x}
                        y2={point.y}
                        stroke={pointColor}
                        strokeOpacity="0.32"
                        strokeWidth="2"
                      />
                      <circle cx={point.x} cy={point.y} r="5" fill={pointColor} />
                      <circle cx={point.x} cy={point.y} r="2.2" fill={isDark ? "#18181b" : "#ffffff"} />
                      <text
                        x={point.x}
                        y={labelY}
                        textAnchor="middle"
                        fill={tickColor}
                        fontSize="10"
                        fontWeight="600"
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          }

          const maxFlowValue = Math.max(
            1,
            ...chartRows.map((row) => Math.max(row.incomeTotal, row.expenseTotal)),
          );
          const axisLabelX = padding.left + 2;
            const positiveHeight = plotHeight * 0.44;
            const negativeHeight = plotHeight * 0.44;
            const zeroY = padding.top + positiveHeight;
          const barWidth = clampNumber(groupWidth * 0.38, 10, 24);

          return (
            <>
              {[0.15, 0.85].map((step) => {
                const y = padding.top + plotHeight * step;
                return (
                  <line
                    key={`grid-${step}`}
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + plotWidth}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth="1"
                  />
                );
              })}

              <line
                x1={padding.left}
                y1={zeroY}
                x2={padding.left + plotWidth}
                y2={zeroY}
                stroke={zeroLineColor}
                strokeWidth="1"
              />
              <text
                x={axisLabelX}
                y={padding.top + 8}
                fill={tickColor}
                fontSize="9"
                fontWeight="700"
              >
                {`+${formatCurrency(maxFlowValue)}`}
              </text>
              <text
                x={axisLabelX}
                y={zeroY - 2}
                fill={tickColor}
                fontSize="9"
                fontWeight="700"
              >
                0
              </text>
              <text
                x={axisLabelX}
                y={padding.top + plotHeight - 2}
                fill={tickColor}
                fontSize="9"
                fontWeight="700"
              >
                {`-${formatCurrency(maxFlowValue)}`}
              </text>
              <text
                x={padding.left + plotWidth}
                y={padding.top + 8}
                textAnchor="end"
                fill={incomeColor}
                fontSize="9"
                fontWeight="700"
              >
                Ingresos
              </text>
              <text
                x={padding.left + plotWidth}
                y={padding.top + plotHeight - 2}
                textAnchor="end"
                fill={expenseColor}
                fontSize="9"
                fontWeight="700"
              >
                Egresos
              </text>

              {chartRows.map((row, index) => {
                const centerX = padding.left + groupWidth * index + groupWidth / 2;
                const left = centerX - barWidth / 2;
                const incomeHeight = (row.incomeTotal / maxFlowValue) * positiveHeight;
                const expenseHeight = (row.expenseTotal / maxFlowValue) * negativeHeight;

                return (
                  <g
                    key={`stacked-${index}`}
                    className="cursor-pointer"
                    onClick={() => handlePointSelect(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handlePointSelect(index);
                      }
                    }}
                  >
                    <rect
                      x={left}
                      y={zeroY - incomeHeight}
                      width={barWidth}
                      height={incomeHeight}
                      rx="8"
                      fill={incomeColor}
                      fillOpacity="0.95"
                    />
                    <rect
                      x={left}
                      y={zeroY}
                      width={barWidth}
                      height={expenseHeight}
                      rx="8"
                      fill={expenseColor}
                      fillOpacity="0.85"
                    />
                    <text
                      x={centerX}
                      y={labelY}
                      textAnchor="middle"
                      fill={tickColor}
                      fontSize="10"
                      fontWeight="600"
                    >
                      {row.label}
                    </text>
                  </g>
                );
              })}
            </>
          );
        })()}
      </svg>
    </div>
  );
});

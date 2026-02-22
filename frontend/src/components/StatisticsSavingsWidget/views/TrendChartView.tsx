import { useAppSettings } from "@/hooks";
import type { TrendLinePoint } from "../../TrendLine/TrendLine";

export type TrendChartMode = "line" | "bars";

export interface TrendChartViewProps {
  animationKey: string;
  mode?: TrendChartMode;
  points: TrendLinePoint[];
}

export function TrendChartView({ animationKey, mode = "line", points }: TrendChartViewProps) {
  const { settings } = useAppSettings();
  const isDark = settings?.theme === "dark";
  const lineColor = isDark ? "#4ade80" : "#16a34a";
  const barColor = isDark ? "#60a5fa" : "#2563eb";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(63,63,70,0.12)";
  const tickColor = isDark ? "#a1a1aa" : "#71717a";
  const markerFill = isDark ? "#18181b" : "#ffffff";

  if (points.length === 0) {
    return (
      <div className="flex h-[132px] w-full items-center justify-center rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/75 px-3">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Sin datos para esta vista</span>
      </div>
    );
  }

  const width = 320;
  const height = 132;
  const padding = { bottom: 24, left: 10, right: 10, top: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(100, ...points.map((point) => point.value));
  const minValue = 0;
  const valueRange = Math.max(1, maxValue - minValue);
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

  return (
    <div className="h-[132px] w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)]/75 px-2 py-2">
      <svg key={animationKey} viewBox={`0 0 ${width} ${height}`} className="h-full w-full" aria-label="Trend chart">
        {[0, 0.5, 1].map((step) => {
          const y = padding.top + chartHeight * step;
          return (
            <line
              key={`grid-${step}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke={gridColor}
              strokeWidth="1"
            />
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
              <g key={`point-${point.label}-${index}`}>
                <circle cx={mapX(index)} cy={mapY(point.value)} r="3.8" fill={lineColor} />
                <circle cx={mapX(index)} cy={mapY(point.value)} r="1.7" fill={markerFill} />
              </g>
            ))}
          </>
        ) : (
          <>
            {points.map((point, index) => {
              const centerX = mapX(index);
              const barWidth = Math.max(8, chartWidth / (points.length * 1.9));
              const barHeight = ((point.value - minValue) / valueRange) * chartHeight;
              return (
                <rect
                  key={`bar-${point.label}-${index}`}
                  x={centerX - barWidth / 2}
                  y={baselineY - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={barColor}
                  fillOpacity="0.86"
                />
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

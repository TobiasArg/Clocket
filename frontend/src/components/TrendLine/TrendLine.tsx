import { memo, useEffect, useRef, useState } from "react";

export interface TrendLinePoint {
  label: string;
  value: number;
}

export interface TrendLineProps {
  animationKey?: string;
  className?: string;
  dotColor?: string;
  gridColor?: string;
  lineColor?: string;
  points?: TrendLinePoint[];
  tickColor?: string;
  yDomain?: [number | string, number | string];
}

const DEFAULT_POINTS: TrendLinePoint[] = [
  { label: "ENE", value: 60 },
  { label: "FEB", value: 58 },
  { label: "MAR", value: 65 },
  { label: "ABR", value: 63 },
  { label: "MAY", value: 74 },
  { label: "JUN", value: 78 },
];

export const TrendLine = memo(function TrendLine({
  animationKey = "trend",
  className = "",
  dotColor = "#2563EB",
  gridColor = "rgba(63,63,70,0.12)",
  lineColor = "#2563EB",
  points = DEFAULT_POINTS,
  tickColor = "#71717A",
  yDomain = ["dataMin - 5", "dataMax + 5"],
}: TrendLineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isContainerReady, setIsContainerReady] = useState<boolean>(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const evaluateSize = () => {
      const { width, height } = node.getBoundingClientRect();
      setIsContainerReady(width > 0 && height > 0);
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

  return (
    <div ref={containerRef} className={`relative h-[88px] w-full ${className}`}>
      {isContainerReady ? (
        <svg key={animationKey} viewBox="0 0 320 88" className="h-full w-full" aria-label="Trend chart">
          {(() => {
            const padding = { bottom: 18, left: 10, right: 10, top: 8 };
            const chartWidth = 320 - padding.left - padding.right;
            const chartHeight = 88 - padding.top - padding.bottom;

            const values = points.map((point) => point.value);
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            const safeMax = maxValue === minValue ? minValue + 1 : maxValue;

            const mapX = (index: number) => {
              if (points.length <= 1) {
                return padding.left + chartWidth / 2;
              }
              return padding.left + (index / (points.length - 1)) * chartWidth;
            };
            const mapY = (value: number) => {
              const normalized = (value - minValue) / (safeMax - minValue);
              return padding.top + chartHeight * (1 - normalized);
            };

            const path = points
              .map((point, index) => `${index === 0 ? "M" : "L"} ${mapX(index)} ${mapY(point.value)}`)
              .join(" ");

            const gridY = [0, 0.5, 1].map((step) => padding.top + chartHeight * step);

            return (
              <>
                {gridY.map((y) => (
                  <line key={y} x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke={gridColor} strokeWidth="1" />
                ))}
                <path d={path} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((point, index) => (
                  <g key={`${point.label}-${index}`}>
                    <circle cx={mapX(index)} cy={mapY(point.value)} r="2.5" fill={dotColor} />
                    <text
                      x={mapX(index)}
                      y={82}
                      textAnchor="middle"
                      fill={tickColor}
                      fontSize="10"
                      fontWeight="600"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
});

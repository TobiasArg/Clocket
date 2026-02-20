import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
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
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart
            key={animationKey}
            data={points}
            margin={{ top: 6, right: 6, left: 6, bottom: 2 }}
          >
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
              dy={4}
            />
            <YAxis hide domain={yDomain} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: dotColor, r: 2.5 }}
              activeDot={{ r: 3.5, fill: dotColor }}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
});

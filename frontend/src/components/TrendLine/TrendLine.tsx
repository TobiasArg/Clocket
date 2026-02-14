import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { memo } from "react";

export interface TrendLinePoint {
  label: string;
  value: number;
}

export interface TrendLineProps {
  className?: string;
  points?: TrendLinePoint[];
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
  className = "",
  points = DEFAULT_POINTS,
}: TrendLineProps) {
  return (
    <div className={`w-full h-[88px] relative ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 6, right: 6, left: 6, bottom: 2 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.14)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.68)", fontSize: 10, fontWeight: 500 }}
            dy={4}
          />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth={2}
            dot={{ fill: "white", r: 3 }}
            activeDot={{ r: 4, fill: "white" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

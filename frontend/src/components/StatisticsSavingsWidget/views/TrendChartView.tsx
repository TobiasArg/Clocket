import { TrendLine } from "../../TrendLine/TrendLine";
import type { TrendLinePoint } from "../../TrendLine/TrendLine";

export interface TrendChartViewProps {
  animationKey: string;
  points: TrendLinePoint[];
}

export function TrendChartView({ animationKey, points }: TrendChartViewProps) {
  return (
    <TrendLine
      points={points}
      className="h-[124px]"
      animationKey={animationKey}
      yDomain={[0, 100]}
    />
  );
}

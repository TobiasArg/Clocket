import { memo } from "react";
import { TrendChartView } from "./TrendChartView";
import type { TrendChartViewProps } from "./TrendChartView";

export const TrendDayView = memo(function TrendDayView(props: TrendChartViewProps) {
  return <TrendChartView {...props} />;
});

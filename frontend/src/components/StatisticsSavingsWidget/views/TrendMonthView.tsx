import { memo } from "react";
import { TrendChartView } from "./TrendChartView";
import type { TrendChartViewProps } from "./TrendChartView";

export const TrendMonthView = memo(function TrendMonthView(props: TrendChartViewProps) {
  return <TrendChartView {...props} />;
});

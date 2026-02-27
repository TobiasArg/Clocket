import { memo } from "react";
import { TrendChartView } from "./TrendChartView";
import type { TrendChartViewProps } from "./TrendChartView";

export const TrendWeekView = memo(function TrendWeekView(props: TrendChartViewProps) {
  return <TrendChartView {...props} />;
});

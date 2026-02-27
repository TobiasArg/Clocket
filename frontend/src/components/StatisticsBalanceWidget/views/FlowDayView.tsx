import { memo } from "react";
import { FlowChartView } from "./FlowChartView";
import type { FlowChartViewProps } from "./FlowChartView";

export const FlowDayView = memo(function FlowDayView(props: FlowChartViewProps) {
  return <FlowChartView {...props} />;
});

import { memo } from "react";
import { FlowChartView } from "./FlowChartView";
import type { FlowChartViewProps } from "./FlowChartView";

export const FlowWeekView = memo(function FlowWeekView(props: FlowChartViewProps) {
  return <FlowChartView {...props} />;
});

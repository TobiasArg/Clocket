import { memo } from "react";
import { FlowChartView } from "./FlowChartView";
import type { FlowChartViewProps } from "./FlowChartView";

export const FlowMonthView = memo(function FlowMonthView(props: FlowChartViewProps) {
  return <FlowChartView {...props} />;
});

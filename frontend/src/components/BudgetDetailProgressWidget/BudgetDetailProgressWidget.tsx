import { memo } from "react";
import { ProgressSection } from "../ProgressSection/ProgressSection";

export interface BudgetDetailProgressWidgetProps {
  percent?: number;
  progressColor?: string;
  remainingLabel?: string;
  usedLabel?: string;
  usedTextColor?: string;
}

export const BudgetDetailProgressWidget = memo(function BudgetDetailProgressWidget({
  percent = 0,
  progressColor = "bg-[#DC2626]",
  remainingLabel = "$0.00 restante",
  usedLabel = "0% usado",
  usedTextColor = "text-[#DC2626]",
}: BudgetDetailProgressWidgetProps) {
  return (
    <ProgressSection
      percent={percent}
      barColor={progressColor}
      barHeight="h-2.5"
      leftLabel={usedLabel}
      rightLabel={remainingLabel}
      leftLabelClassName={`text-xs font-semibold ${usedTextColor}`}
      rightLabelClassName="text-xs font-medium text-[var(--text-secondary)]"
    />
  );
});

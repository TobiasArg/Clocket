import { ProgressSection, StatDisplay, SummaryPanel } from "@/components";
import { formatCurrency } from "@/utils";

export interface BudgetSummaryWidgetProps {
  progress: number;
  progressLabel: string;
  summaryTitle: string;
  totalBudget: number;
  totalBudgetLabel: string;
  totalSpent: number;
  totalSpentLabel: string;
}

export function BudgetSummaryWidget({
  progress,
  progressLabel,
  summaryTitle,
  totalBudget,
  totalBudgetLabel,
  totalSpent,
  totalSpentLabel,
}: BudgetSummaryWidgetProps) {
  return (
    <SummaryPanel title={summaryTitle}>
      <div className="flex justify-between w-full">
        <StatDisplay label={totalSpentLabel} value={formatCurrency(totalSpent)} />
        <StatDisplay label={totalBudgetLabel} value={formatCurrency(totalBudget)} align="end" />
      </div>
      <ProgressSection
        percent={progress}
        barColor="bg-[#10B981]"
        trackColor="bg-[#3F3F46]"
        leftLabel={`${progress}% ${progressLabel}`}
        leftLabelClassName="text-xs font-normal text-[#10B981]"
      />
    </SummaryPanel>
  );
}

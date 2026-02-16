import { ProgressSection, StatDisplay, SummaryPanel } from "@/components";
import { formatCurrency } from "@/utils";

export interface BudgetSummaryWidgetProps {
  overspentAmount: number;
  progress: number;
  rawProgress: number;
  progressLabel: string;
  summaryTitle: string;
  totalBudget: number;
  totalBudgetLabel: string;
  totalSpent: number;
  totalSpentLabel: string;
}

export function BudgetSummaryWidget({
  overspentAmount,
  progress,
  rawProgress,
  progressLabel,
  summaryTitle,
  totalBudget,
  totalBudgetLabel,
  totalSpent,
  totalSpentLabel,
}: BudgetSummaryWidgetProps) {
  return (
    <SummaryPanel
      title={summaryTitle}
      bg="bg-[#F4F4F5]"
      rounded="rounded-2xl"
      className="mx-5 border border-[#E4E4E7]"
      titleClassName="text-[11px] font-semibold text-[#71717A] tracking-[1.5px]"
    >
      <div className="flex justify-between w-full">
        <StatDisplay
          label={totalSpentLabel}
          value={formatCurrency(totalSpent)}
          labelClassName="text-xs font-medium text-[#71717A]"
          valueClassName="text-[30px] font-bold text-[#18181B] font-['Outfit']"
        />
        <StatDisplay
          label={totalBudgetLabel}
          value={formatCurrency(totalBudget)}
          align="end"
          labelClassName="text-xs font-medium text-[#71717A]"
          valueClassName="text-[30px] font-bold text-[#18181B] font-['Outfit']"
        />
      </div>
      <ProgressSection
        percent={progress}
        barColor="bg-[#059669]"
        trackColor="bg-[#E4E4E7]"
        leftLabel={`${rawProgress}% ${progressLabel}`}
        leftLabelClassName="text-xs font-medium text-[#059669]"
      />
      {overspentAmount > 0 && (
        <span className="text-xs font-medium text-[#B91C1C]">
          Excedido por {formatCurrency(overspentAmount)}
        </span>
      )}
    </SummaryPanel>
  );
}

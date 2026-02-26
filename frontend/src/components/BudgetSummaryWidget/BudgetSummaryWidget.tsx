import { memo } from "react";
import { StatDisplay, SummaryPanel } from "@/components";
import { ProgressSection } from "../ProgressSection/ProgressSection";
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

export const BudgetSummaryWidget = memo(function BudgetSummaryWidget({
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
      bg="bg-[var(--surface-muted)]"
      rounded="rounded-2xl"
      className="clocket-glass-card mx-5"
      titleClassName="block truncate text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1.5px]"
    >
      <div className="flex w-full justify-between gap-3">
        <StatDisplay
          label={totalSpentLabel}
          value={formatCurrency(totalSpent)}
          labelClassName="text-[11px] font-medium text-[var(--text-secondary)]"
          valueClassName="text-[clamp(1.25rem,6vw,1.9rem)] leading-none font-bold text-[var(--text-primary)] font-['Outfit']"
          className="max-w-[48%]"
        />
        <StatDisplay
          label={totalBudgetLabel}
          value={formatCurrency(totalBudget)}
          align="end"
          labelClassName="text-[11px] font-medium text-[var(--text-secondary)]"
          valueClassName="text-[clamp(1.25rem,6vw,1.9rem)] leading-none font-bold text-[var(--text-primary)] font-['Outfit']"
          className="max-w-[48%]"
        />
      </div>
      <ProgressSection
        percent={progress}
        barColor="bg-[#059669]"
        trackColor="bg-[var(--surface-border)]"
        leftLabel={`${rawProgress}% ${progressLabel}`}
        leftLabelClassName="block max-w-full truncate text-[11px] font-medium text-[#059669]"
      />
      {overspentAmount > 0 && (
        <span className="block truncate text-[11px] font-medium text-[#B91C1C]">
          Excedido por {formatCurrency(overspentAmount)}
        </span>
      )}
    </SummaryPanel>
  );
});

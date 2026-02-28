import { memo } from "react";
import { StatDisplay, SummaryPanel } from "@/components";
import { ProgressSection } from "../ProgressSection/ProgressSection";
import { formatCurrency } from "@/utils";

export interface GoalsSummaryWidgetProps {
  goalLabel?: string;
  progressLabel?: string;
  summaryTitle?: string;
  totalLabel?: string;
  totalSaved?: number;
  totalTarget?: number;
  percent?: number;
}

export const GoalsSummaryWidget = memo(function GoalsSummaryWidget({
  goalLabel = "Meta Total",
  progressLabel = "completado",
  summaryTitle = "RESUMEN DE AHORRO",
  totalLabel = "Total Ahorrado",
  totalSaved = 0,
  totalTarget = 0,
  percent = 0,
}: GoalsSummaryWidgetProps) {
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
          label={totalLabel}
          value={formatCurrency(totalSaved)}
          labelClassName="text-[11px] font-medium text-[var(--text-secondary)]"
          valueClassName="text-[clamp(1.25rem,6vw,1.9rem)] leading-none font-bold text-[var(--text-primary)] font-['Outfit']"
          className="max-w-[48%]"
        />
        <StatDisplay
          label={goalLabel}
          value={formatCurrency(totalTarget)}
          align="end"
          labelClassName="text-[11px] font-medium text-[var(--text-secondary)]"
          valueClassName="text-[clamp(1.25rem,6vw,1.9rem)] leading-none font-bold text-[var(--text-primary)] font-['Outfit']"
          className="max-w-[48%]"
        />
      </div>
      <ProgressSection
        percent={percent}
        barColor="bg-[#10B981]"
        trackColor="bg-[var(--surface-border)]"
        leftLabel={`${percent}% ${progressLabel}`}
        leftLabelClassName="block max-w-full truncate text-[11px] font-medium text-[#10B981]"
      />
    </SummaryPanel>
  );
});

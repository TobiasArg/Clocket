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

export function GoalsSummaryWidget({
  goalLabel = "Meta Total",
  progressLabel = "completado",
  summaryTitle = "RESUMEN DE AHORRO",
  totalLabel = "Total Ahorrado",
  totalSaved = 0,
  totalTarget = 0,
  percent = 0,
}: GoalsSummaryWidgetProps) {
  return (
    <SummaryPanel title={summaryTitle}>
      <div className="flex justify-between w-full">
        <StatDisplay label={totalLabel} value={formatCurrency(totalSaved)} />
        <StatDisplay label={goalLabel} value={formatCurrency(totalTarget)} align="end" />
      </div>
      <ProgressSection
        percent={percent}
        barColor="bg-[#10B981]"
        trackColor="bg-[#3F3F46]"
        leftLabel={`${percent}% ${progressLabel}`}
        leftLabelClassName="text-xs font-normal text-[#10B981]"
      />
    </SummaryPanel>
  );
}

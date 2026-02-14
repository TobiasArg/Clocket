import type { StatisticsTrendPoint } from "@/hooks";
import {
  StatDisplay,
  SummaryPanel,
  TextBadge,
  TrendLine,
} from "@/components";

export interface StatisticsSavingsWidgetProps {
  savingsBadge?: string;
  savingsBg?: string;
  savingsGoalLabel?: string;
  savingsGoalValue?: string;
  savingsLabel?: string;
  savingsTitle?: string;
  savingsValue?: string;
  trendPoints?: StatisticsTrendPoint[];
}

export function StatisticsSavingsWidget({
  savingsBadge = "+0%",
  savingsBg = "bg-[#059669]",
  savingsGoalLabel = "Meta mensual",
  savingsGoalValue = "$0.00",
  savingsLabel = "Ahorrado este mes",
  savingsTitle = "Tendencia de Ahorro",
  savingsValue = "$0.00",
  trendPoints = [],
}: StatisticsSavingsWidgetProps) {
  return (
    <SummaryPanel
      bg={savingsBg}
      rounded="rounded-[20px]"
      padding="p-5"
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-base font-bold text-white font-['Outfit']">{savingsTitle}</span>
        <TextBadge
          text={savingsBadge}
          bg="bg-white/20"
          textColor="text-white"
          rounded="rounded-lg"
          padding="px-2.5 py-1"
          fontSize="text-xs"
          fontWeight="font-semibold"
        />
      </div>
      <TrendLine points={trendPoints} />
      <div className="flex justify-between w-full">
        <StatDisplay
          label={savingsLabel}
          value={savingsValue}
          labelClassName="text-[11px] font-medium text-white/70"
          valueClassName="text-2xl font-bold text-white font-['Outfit']"
          gap="gap-0.5"
        />
        <StatDisplay
          label={savingsGoalLabel}
          value={savingsGoalValue}
          labelClassName="text-[11px] font-medium text-white/70"
          valueClassName="text-lg font-semibold text-white font-['Outfit']"
          gap="gap-0.5"
          align="end"
        />
      </div>
    </SummaryPanel>
  );
}

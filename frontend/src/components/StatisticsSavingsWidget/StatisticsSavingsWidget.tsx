import { memo } from "react";
import { SummaryPanel } from "../SummaryPanel/SummaryPanel";
import { TextBadge } from "../TextBadge/TextBadge";
import { TrendLine } from "../TrendLine/TrendLine";
import type { TrendLinePoint } from "../TrendLine/TrendLine";

export interface StatisticsSavingsWidgetProps {
  savingsBadge?: string;
  savingsBg?: string;
  savingsGoalLabel?: string;
  savingsGoalValue?: string;
  savingsLabel?: string;
  savingsTitle?: string;
  savingsValue?: string;
  trendAnimationKey?: string;
  trendPoints?: TrendLinePoint[];
}

export const StatisticsSavingsWidget = memo(function StatisticsSavingsWidget({
  savingsBadge = "+0%",
  savingsBg = "bg-[#059669]",
  savingsGoalLabel = "Meta mensual",
  savingsGoalValue = "$0.00",
  savingsLabel = "Ahorrado este mes",
  savingsTitle = "Tendencia de Ahorro",
  savingsValue = "$0.00",
  trendAnimationKey = "statistics-trend",
  trendPoints = [],
}: StatisticsSavingsWidgetProps) {
  const metrics = [
    { label: savingsLabel, value: savingsValue, valueClassName: "font-bold" },
    { label: savingsGoalLabel, value: savingsGoalValue, valueClassName: "font-semibold" },
  ] as const;

  return (
    <SummaryPanel
      bg={savingsBg}
      rounded="rounded-[20px]"
      padding="p-5"
    >
      <div className="flex items-start justify-between w-full">
        <span className="text-sm font-semibold text-white/90 font-['Outfit']">{savingsTitle}</span>
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
      <TrendLine points={trendPoints} className="h-[112px]" animationKey={trendAnimationKey} />
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-white/10 px-3 py-2">
            <span className="block text-[10px] font-medium text-white/70">{metric.label}</span>
            <span className={`block text-base text-white font-['Outfit'] ${metric.valueClassName}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </SummaryPanel>
  );
});

import { StatDisplay, SummaryPanel, TextBadge } from "@/components";
import { formatCurrency } from "@/utils";
import type { InvestmentChangePresentation } from "@/hooks";

export interface InvestmentSummaryWidgetProps {
  dayGainAmount: number;
  dayGainLabel: string;
  dayGainPresentation: InvestmentChangePresentation;
  gainAmount: number;
  gainLabel: string;
  summaryChange: InvestmentChangePresentation;
  summaryTitle: string;
  totalArsLabel: string;
  totalArsValue: number;
  totalLabel: string;
  totalValue: number;
}

export function InvestmentSummaryWidget({
  dayGainAmount,
  dayGainLabel,
  dayGainPresentation,
  gainAmount,
  gainLabel,
  summaryChange,
  summaryTitle,
  totalArsLabel,
  totalArsValue,
  totalLabel,
  totalValue,
}: InvestmentSummaryWidgetProps) {
  return (
    <SummaryPanel
      title={summaryTitle}
      titleClassName="text-sm font-medium text-[#71717A] font-['Outfit']"
      bg="bg-white"
      padding="px-5 py-4"
      gap="gap-4"
    >
      <div className="flex justify-between w-full">
        <div className="flex flex-col gap-1">
          <StatDisplay
            label={totalLabel}
            value={formatCurrency(totalValue, { currency: "USD", locale: "en-US" })}
            labelClassName="text-xs font-normal text-[#71717A]"
            valueClassName="text-2xl font-bold text-[#18181B] font-['Outfit']"
          />
          <span className="text-xs font-medium text-[#71717A]">
            {`${totalArsLabel}: ${formatCurrency(totalArsValue, { currency: "ARS", locale: "es-AR" })}`}
          </span>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs font-normal text-[#71717A]">{gainLabel}</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold font-['Outfit'] ${summaryChange.color}`}>
                {`${gainAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(gainAmount), { currency: "USD", locale: "en-US" })}`}
              </span>
              <TextBadge
                text={summaryChange.text}
                bg={summaryChange.bg}
                textColor={summaryChange.color}
                rounded="rounded-lg"
                padding="px-2 py-1"
                fontSize="text-xs"
                fontWeight="font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs font-normal text-[#71717A]">{dayGainLabel}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold font-['Outfit'] ${dayGainPresentation.color}`}>
                {`${dayGainAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(dayGainAmount), { currency: "USD", locale: "en-US" })}`}
              </span>
              <TextBadge
                text={dayGainPresentation.text}
                bg={dayGainPresentation.bg}
                textColor={dayGainPresentation.color}
                rounded="rounded-lg"
                padding="px-2 py-1"
                fontSize="text-xs"
                fontWeight="font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </SummaryPanel>
  );
}

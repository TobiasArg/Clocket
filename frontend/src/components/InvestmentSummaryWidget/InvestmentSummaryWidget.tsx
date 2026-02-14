import { StatDisplay, SummaryPanel, TextBadge } from "@/components";
import { formatCurrency } from "@/utils";
import type { InvestmentChangePresentation } from "@/hooks";

export interface InvestmentSummaryWidgetProps {
  gainAmount: number;
  gainLabel: string;
  summaryChange: InvestmentChangePresentation;
  summaryTitle: string;
  totalLabel: string;
  totalValue: number;
}

export function InvestmentSummaryWidget({
  gainAmount,
  gainLabel,
  summaryChange,
  summaryTitle,
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
        <StatDisplay
          label={totalLabel}
          value={formatCurrency(totalValue)}
          labelClassName="text-xs font-normal text-[#71717A]"
          valueClassName="text-2xl font-bold text-[#18181B] font-['Outfit']"
        />
        <div className="flex flex-col gap-1 items-end">
          <span className="text-xs font-normal text-[#71717A]">{gainLabel}</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold font-['Outfit'] ${summaryChange.color}`}>
              {`${gainAmount >= 0 ? "+" : "-"}${formatCurrency(Math.abs(gainAmount))}`}
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
      </div>
    </SummaryPanel>
  );
}

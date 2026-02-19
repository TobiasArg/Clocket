import { TrendLine } from "@/components/TrendLine/TrendLine";
import type { InvestmentTableRow } from "@/hooks/useInvestmentsPageModel";
import { formatCurrency } from "@/utils/formatCurrency";

export interface InvestmentPositionItemProps {
  item: InvestmentTableRow;
  onOpenDetail: (id: string) => void;
}

const moneyTone = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

export function InvestmentPositionItem({ item, onOpenDetail }: InvestmentPositionItemProps) {
  const priceLastUpdated = `${formatCurrency(item.currentPrice, { currency: "USD", locale: "en-US" })} · ${item.lastUpdatedLabel}`;

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(item.id)}
      className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      aria-label={`Abrir detalle de ${item.displayName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block truncate text-lg font-bold text-[#111827] font-['Outfit']">
            {item.displayName}
          </span>
          <span className="mt-1 block truncate text-xs font-medium text-[#6B7280]">
            {priceLastUpdated}
          </span>
        </div>

        <span className={`shrink-0 text-sm font-semibold ${moneyTone(item.pnlDailyPct)}`}>PnL diario {item.pnlDailyText}</span>
      </div>

      <div className="mt-3 rounded-xl bg-[#F9FAFB] p-2">
        {item.hasHistoricalData ? (
          <TrendLine
            className="h-[70px]"
            animationKey={`position-${item.id}-${item.sparklinePoints.length}`}
            points={item.sparklinePoints}
            lineColor="#0EA5E9"
            dotColor="#0EA5E9"
            gridColor="rgba(148,163,184,0.18)"
          />
        ) : (
          <div className="flex h-[70px] items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-white">
            <span className="text-[11px] font-medium text-[#6B7280]">Sin historial suficiente</span>
          </div>
        )}
      </div>
    </button>
  );
}

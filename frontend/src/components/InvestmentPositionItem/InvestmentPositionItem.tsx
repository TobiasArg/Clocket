import { TrendLine } from "@/components/TrendLine/TrendLine";
import type { InvestmentTableRow } from "@/hooks/useInvestmentsPageModel";
import { useCurrency } from "@/hooks";
import { formatCurrency, getUsdRate } from "@/utils";

export interface InvestmentPositionItemProps {
  item: InvestmentTableRow;
  onOpenDetail: (id: string) => void;
}

const formatHeldAmount = (amount: number): string => {
  return amount.toLocaleString("es-AR", {
    maximumFractionDigits: 8,
  });
};

export function InvestmentPositionItem({ item, onOpenDetail }: InvestmentPositionItemProps) {
  const { currency } = useCurrency();
  const currentPrice = currency === "ARS" ? item.currentPrice * getUsdRate() : item.currentPrice;
  const currentPriceLabel = formatCurrency(currentPrice);
  const heldAmountLabel = formatHeldAmount(item.amount);

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(item.id)}
      className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-4 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      aria-label={`Abrir detalle de ${item.displayName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-lg font-bold text-[var(--text-primary)] font-['Outfit']">
            {item.displayName}
          </span>
          <span className="mt-1 block truncate text-xs font-medium text-[var(--text-secondary)]">
            {item.lastUpdatedLabel}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="mt-1 block text-base font-bold text-[var(--text-primary)]">{currentPriceLabel}</span>
          <span className="mt-1 block truncate text-sm font-semibold text-[var(--text-secondary)]">{heldAmountLabel}</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-[var(--surface-muted)] p-2">
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
          <div className="flex h-[70px] items-center justify-center rounded-lg border border-dashed border-[var(--surface-border)] bg-[var(--panel-bg)]">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Sin historial suficiente</span>
          </div>
        )}
      </div>
    </button>
  );
}

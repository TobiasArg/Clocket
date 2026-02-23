import type { InvestmentsSummary } from "@/hooks/useInvestmentsPageModel";
import { useCurrency } from "@/hooks";
import { formatCurrency, getUsdRate } from "@/utils";

export interface InvestmentSummaryWidgetProps {
  summary: InvestmentsSummary;
}

const pctClassName = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const moneyClassName = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const signedPct = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export function InvestmentSummaryWidget({ summary }: InvestmentSummaryWidgetProps) {
  const { currency } = useCurrency();
  const totalPositions = Math.max(summary.totalPositions, 0);
  const stocksPct = totalPositions > 0 ? (summary.stocksCount / totalPositions) * 100 : 0;
  const cryptoPct = totalPositions > 0 ? (summary.cryptoCount / totalPositions) * 100 : 0;
  const usdRate = getUsdRate();
  const fromUsd = (value: number): number => (currency === "ARS" ? value * usdRate : value);
  const signedCurrency = (value: number): string => {
    return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(fromUsd(value)))}`;
  };

  return (
    <div className="clocket-glass-card rounded-2xl px-4 py-4">
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Portfolio</span>
        <p className="truncate text-[28px] font-bold leading-none text-[var(--text-primary)] font-['Outfit']">
          {formatCurrency(fromUsd(summary.currentValueUSD))}
        </p>
        <span className="mt-1 block text-xs font-medium text-[var(--text-secondary)]">
          Invertido {formatCurrency(fromUsd(summary.investedUSD))}
        </span>
      </div>

      <div className="mt-3 flex flex-col overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-muted)]">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">PnL total</span>
          <span className={`text-sm font-bold ${moneyClassName(summary.pnlTotalUSD)}`}>
            {signedCurrency(summary.pnlTotalUSD)}
          </span>
        </div>
        <div className="h-px bg-[var(--surface-border)]" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">PnL total %</span>
          <span className={`text-sm font-bold ${pctClassName(summary.pnlTotalPct)}`}>
            {signedPct(summary.pnlTotalPct)}
          </span>
        </div>
        <div className="h-px bg-[var(--surface-border)]" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">PnL diario</span>
          <span className={`text-sm font-bold ${moneyClassName(summary.pnlDailyUSD)}`}>
            {signedCurrency(summary.pnlDailyUSD)}
          </span>
        </div>
        <div className="h-px bg-[var(--surface-border)]" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Posiciones</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {summary.totalPositions}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-2.5">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-border)]">
          <span
            className="h-full bg-[var(--text-primary)]"
            style={{ width: `${Math.max(0, Math.min(100, stocksPct))}%` }}
          />
          <span
            className="h-full bg-[var(--text-secondary)]"
            style={{ width: `${Math.max(0, Math.min(100, cryptoPct))}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
          <span>Stock: {summary.stocksCount}</span>
          <span>Crypto: {summary.cryptoCount}</span>
        </div>
      </div>
    </div>
  );
}

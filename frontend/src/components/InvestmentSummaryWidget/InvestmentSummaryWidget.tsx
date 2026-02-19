import type { InvestmentsSummary } from "@/hooks/useInvestmentsPageModel";
import { formatCurrency } from "@/utils/formatCurrency";

export interface InvestmentSummaryWidgetProps {
  summary: InvestmentsSummary;
}

const pctClassName = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const moneyClassName = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const signedCurrency = (value: number): string => {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value), { currency: "USD", locale: "en-US" })}`;
};

const signedPct = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export function InvestmentSummaryWidget({ summary }: InvestmentSummaryWidgetProps) {
  const totalPositions = Math.max(summary.totalPositions, 0);
  const stocksPct = totalPositions > 0 ? (summary.stocksCount / totalPositions) * 100 : 0;
  const cryptoPct = totalPositions > 0 ? (summary.cryptoCount / totalPositions) * 100 : 0;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4">
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Portfolio</span>
        <p className="truncate text-[28px] font-bold leading-none text-[#111827] font-['Outfit']">
          {formatCurrency(summary.currentValueUSD, { currency: "USD", locale: "en-US" })}
        </p>
        <span className="mt-1 block text-xs font-medium text-[#6B7280]">
          Invertido {formatCurrency(summary.investedUSD, { currency: "USD", locale: "en-US" })}
        </span>
      </div>

      <div className="mt-3 flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">PnL total</span>
          <span className={`text-sm font-bold ${moneyClassName(summary.pnlTotalUSD)}`}>
            {signedCurrency(summary.pnlTotalUSD)}
          </span>
        </div>
        <div className="h-px bg-[#E5E7EB]" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">PnL total %</span>
          <span className={`text-sm font-bold ${pctClassName(summary.pnlTotalPct)}`}>
            {signedPct(summary.pnlTotalPct)}
          </span>
        </div>
        <div className="h-px bg-[#E5E7EB]" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">PnL diario</span>
          <span className={`text-sm font-bold ${moneyClassName(summary.pnlDailyUSD)}`}>
            {signedCurrency(summary.pnlDailyUSD)}
          </span>
        </div>
        <div className="h-px bg-[#E5E7EB]" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Posiciones</span>
          <span className="text-sm font-semibold text-[#111827]">
            {summary.totalPositions}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFD] p-2.5">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
          <span
            className="h-full bg-[#4B5563]"
            style={{ width: `${Math.max(0, Math.min(100, stocksPct))}%` }}
          />
          <span
            className="h-full bg-[#9CA3AF]"
            style={{ width: `${Math.max(0, Math.min(100, cryptoPct))}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#6B7280]">
          <span>Stock: {summary.stocksCount}</span>
          <span>Crypto: {summary.cryptoCount}</span>
        </div>
      </div>
    </div>
  );
}

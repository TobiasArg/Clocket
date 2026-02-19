import { formatCurrency } from "@/utils/formatCurrency";
import type { InvestmentsSummary } from "@/hooks/useInvestmentsPageModel";

export interface InvestmentSummaryWidgetProps {
  summary: InvestmentsSummary;
}

const pctClassName = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const moneyClassName = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

export function InvestmentSummaryWidget({ summary }: InvestmentSummaryWidgetProps) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Invertido</span>
          <span className="text-sm font-semibold text-[#111827]">
            {formatCurrency(summary.investedUSD, { currency: "USD", locale: "en-US" })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">Valor actual</span>
          <span className="text-sm font-semibold text-[#111827]">
            {formatCurrency(summary.currentValueUSD, { currency: "USD", locale: "en-US" })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">PnL total</span>
          <span className={`text-sm font-semibold ${moneyClassName(summary.pnlTotalUSD)}`}>
            {`${summary.pnlTotalUSD >= 0 ? "+" : "-"}${formatCurrency(Math.abs(summary.pnlTotalUSD), { currency: "USD", locale: "en-US" })}`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">PnL diario</span>
          <span className={`text-sm font-semibold ${moneyClassName(summary.pnlDailyUSD)}`}>
            {`${summary.pnlDailyUSD >= 0 ? "+" : "-"}${formatCurrency(Math.abs(summary.pnlDailyUSD), { currency: "USD", locale: "en-US" })}`}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">PnL total %</span>
          <span className={`text-sm font-semibold ${pctClassName(summary.pnlTotalPct)}`}>
            {`${summary.pnlTotalPct >= 0 ? "+" : ""}${summary.pnlTotalPct.toFixed(2)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

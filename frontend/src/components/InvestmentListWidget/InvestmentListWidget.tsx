import { TrendLine } from "@/components/TrendLine/TrendLine";
import type { InvestmentTableRow } from "@/hooks/useInvestmentsPageModel";
import { formatCurrency } from "@/utils/formatCurrency";

export interface InvestmentListWidgetProps {
  rows: InvestmentTableRow[];
  isLoading: boolean;
  errorMessage: string | null;
  expandedRowId: string | null;
  onRefreshRow: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

const signedMoney = (value: number): string => {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value), { currency: "USD", locale: "en-US" })}`;
};

const moneyTone = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const toChartLabel = (timestamp: string): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
};

const toLastUpdateLabel = (timestamp: string | null): string => {
  if (!timestamp) {
    return "Sin actualización";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin actualización";
  }

  return new Intl.DateTimeFormat("es-AR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export function InvestmentListWidget({
  rows,
  isLoading,
  errorMessage,
  expandedRowId,
  onRefreshRow,
  onEdit,
  onDelete,
  onToggleExpand,
}: InvestmentListWidgetProps) {
  if (isLoading && rows.length === 0) {
    return <span className="text-sm font-medium text-[#6B7280]">Cargando posiciones...</span>;
  }

  if (errorMessage && rows.length === 0) {
    return <span className="text-sm font-medium text-[#B91C1C]">{errorMessage}</span>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-5">
        <span className="block text-sm font-semibold text-[#111827]">No hay posiciones</span>
        <span className="block text-xs font-medium text-[#6B7280] mt-1">
          Agrega una posición para comenzar a trackear tu portfolio.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white md:block">
        <div className="grid grid-cols-[1.1fr_repeat(5,1fr)_0.9fr] gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
          <span>Ticker</span>
          <span>PnL diario %</span>
          <span>Precio actual</span>
          <span>Total invertido</span>
          <span>Valor actual</span>
          <span>Buy price</span>
          <span className="text-right">Acciones</span>
        </div>

        {rows.map((row) => {
          const isExpanded = expandedRowId === row.id;

          return (
            <div key={row.id} className="border-b border-[#F3F4F6] last:border-b-0">
              <div className="grid grid-cols-[1.1fr_repeat(5,1fr)_0.9fr] items-center gap-2 px-4 py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-[#111827]">{row.ticker}</span>
                  <span className="text-[11px] font-medium text-[#6B7280] uppercase">{row.assetType}</span>
                </div>

                <span className={moneyTone(row.pnlDailyPct)}>{row.pnlDailyText}</span>
                <span className="font-medium text-[#111827]">
                  {formatCurrency(row.currentPrice, { currency: "USD", locale: "en-US" })}
                </span>
                <span className="font-medium text-[#111827]">
                  {formatCurrency(row.investedUSD, { currency: "USD", locale: "en-US" })}
                </span>
                <span className="font-medium text-[#111827]">
                  {formatCurrency(row.currentValueUSD, { currency: "USD", locale: "en-US" })}
                </span>
                <span className="font-medium text-[#111827]">
                  {formatCurrency(row.buyPrice, { currency: "USD", locale: "en-US" })}
                </span>

                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onRefreshRow(row.id)}
                    className="rounded-lg border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#374151]"
                  >
                    {row.isRefreshing ? "..." : "Refresh"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(row.id)}
                    className="rounded-lg border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#374151]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="rounded-lg border border-[#FCA5A5] px-2 py-1 text-[11px] font-semibold text-[#B91C1C]"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleExpand(row.id)}
                    className="rounded-lg border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#374151]"
                  >
                    {isExpanded ? "Hide" : "Chart"}
                  </button>
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  <span className={moneyTone(row.pnlTotalUSD)}>PnL total: {signedMoney(row.pnlTotalUSD)} ({row.pnlTotalText})</span>
                  <span className={moneyTone(row.pnlMonthUSD)}>PnL mensual: {signedMoney(row.pnlMonthUSD)} ({row.pnlMonthText})</span>
                  <span className="text-[#6B7280]">Amount: {row.amount.toFixed(8)}</span>
                  <span className="text-[#6B7280]">Actualizado: {toLastUpdateLabel(row.lastUpdatedTimestamp)}</span>
                </div>

                {row.staleWarning && (
                  <span className="mt-1 block text-[11px] font-medium text-[#B45309]">{row.staleWarning}</span>
                )}
                {row.refreshError && (
                  <span className="mt-1 block text-[11px] font-medium text-[#B91C1C]">{row.refreshError}</span>
                )}

                {isExpanded && (
                  <div className="mt-3 rounded-xl bg-[#F9FAFB] p-3">
                    <TrendLine
                      animationKey={`history-${row.id}-${row.historicalPoints.length}`}
                      points={row.historicalPoints.map((point) => ({
                        label: toChartLabel(point.timestamp),
                        value: point.equity,
                      }))}
                      lineColor="#0EA5E9"
                      dotColor="#0EA5E9"
                      gridColor="rgba(148,163,184,0.18)"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => {
          const isExpanded = expandedRowId === row.id;

          return (
            <div key={row.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#111827]">{row.ticker}</span>
                  <span className="text-[11px] uppercase font-medium text-[#6B7280]">{row.assetType}</span>
                </div>
                <span className={`text-sm font-semibold ${moneyTone(row.pnlDailyPct)}`}>{row.pnlDailyText}</span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <span className="text-[#6B7280]">Precio: <strong className="text-[#111827]">{formatCurrency(row.currentPrice, { currency: "USD", locale: "en-US" })}</strong></span>
                <span className="text-[#6B7280]">Invertido: <strong className="text-[#111827]">{formatCurrency(row.investedUSD, { currency: "USD", locale: "en-US" })}</strong></span>
                <span className="text-[#6B7280]">Valor actual: <strong className="text-[#111827]">{formatCurrency(row.currentValueUSD, { currency: "USD", locale: "en-US" })}</strong></span>
                <span className="text-[#6B7280]">Buy: <strong className="text-[#111827]">{formatCurrency(row.buyPrice, { currency: "USD", locale: "en-US" })}</strong></span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => onRefreshRow(row.id)} className="rounded-lg border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#374151]">{row.isRefreshing ? "..." : "Refresh"}</button>
                <button type="button" onClick={() => onEdit(row.id)} className="rounded-lg border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#374151]">Edit</button>
                <button type="button" onClick={() => onDelete(row.id)} className="rounded-lg border border-[#FCA5A5] px-2 py-1 text-[11px] font-semibold text-[#B91C1C]">Delete</button>
                <button type="button" onClick={() => onToggleExpand(row.id)} className="rounded-lg border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#374151]">{isExpanded ? "Hide" : "Chart"}</button>
              </div>

              {row.staleWarning && (
                <span className="mt-2 block text-[11px] font-medium text-[#B45309]">{row.staleWarning}</span>
              )}
              {row.refreshError && (
                <span className="mt-1 block text-[11px] font-medium text-[#B91C1C]">{row.refreshError}</span>
              )}

              {isExpanded && (
                <div className="mt-3 rounded-xl bg-[#F9FAFB] p-3">
                  <TrendLine
                    animationKey={`history-mobile-${row.id}-${row.historicalPoints.length}`}
                    points={row.historicalPoints.map((point) => ({
                      label: toChartLabel(point.timestamp),
                      value: point.equity,
                    }))}
                    lineColor="#0EA5E9"
                    dotColor="#0EA5E9"
                    gridColor="rgba(148,163,184,0.18)"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { InvestmentPositionItem } from "@/components/InvestmentPositionItem/InvestmentPositionItem";
import type { InvestmentTableRow } from "@/hooks/useInvestmentsPageModel";

export interface InvestmentListWidgetProps {
  rows: InvestmentTableRow[];
  isLoading: boolean;
  errorMessage: string | null;
  onOpenDetail: (id: string) => void;
}

export function InvestmentListWidget({
  rows,
  isLoading,
  errorMessage,
  onOpenDetail,
}: InvestmentListWidgetProps) {
  const sectionHeader = (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-[#111827] font-['Outfit']">Posiciones</span>
      {rows.length > 0 && (
        <span className="text-xs font-medium text-[#6B7280]">{rows.length} activas</span>
      )}
    </div>
  );

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {sectionHeader}
        <span className="text-sm font-medium text-[#6B7280]">Cargando posiciones...</span>
      </div>
    );
  }

  if (errorMessage && rows.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {sectionHeader}
        <span className="text-sm font-medium text-[#B91C1C]">{errorMessage}</span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {sectionHeader}
        <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[var(--panel-bg)] p-5">
          <span className="block text-sm font-semibold text-[#111827]">No hay posiciones</span>
          <span className="mt-1 block text-xs font-medium text-[#6B7280]">
            Agregá una entrada para comenzar a trackear tu portfolio.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sectionHeader}
      {rows.map((row) => (
        <InvestmentPositionItem
          key={row.id}
          item={row}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
}

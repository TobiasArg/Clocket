import type { StatisticsFlowDay } from "@/types";
import { memo } from "react";
import { formatCurrency } from "@/utils";

export interface StatisticsFlowDetailPopupProps {
  day: StatisticsFlowDay | null;
  onClose: () => void;
  popupCloseLabel?: string;
  popupExpenseLabel?: string;
  popupIncomeLabel?: string;
}

export const StatisticsFlowDetailPopup = memo(function StatisticsFlowDetailPopup({
  day,
  onClose,
  popupCloseLabel = "Cerrar",
  popupExpenseLabel = "Egresos",
  popupIncomeLabel = "Ingresos",
}: StatisticsFlowDetailPopupProps) {
  if (!day) {
    return null;
  }

  const sections = [
    {
      amountClassName: "text-[#15803D]",
      emptyLabel: "Sin ingresos",
      key: "income",
      label: popupIncomeLabel,
      rows: day.incomeByCategory,
      total: day.incomeTotal,
      withDot: false,
    },
    {
      amountClassName: "text-[#B91C1C]",
      emptyLabel: "Sin egresos",
      key: "expense",
      label: popupExpenseLabel,
      rows: day.expenseByCategory,
      total: day.expenseTotal,
      withDot: true,
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-black">{day.dateLabel}</span>
            <span className="text-[11px] font-medium text-[#71717A]">Detalle diario</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#F4F4F5] px-2.5 py-1.5 text-xs font-semibold text-[#3F3F46]"
          >
            {popupCloseLabel}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <div key={section.key} className="rounded-xl bg-[#F9FAFB] px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-xs font-semibold ${section.amountClassName}`}>{section.label}</span>
                <span className={`text-xs font-semibold ${section.amountClassName}`}>
                  {formatCurrency(section.total)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {section.rows.length === 0 ? (
                  <span className="text-[11px] font-medium text-[#71717A]">{section.emptyLabel}</span>
                ) : (
                  section.rows.map((entry) => (
                    <div key={`${section.key}-${entry.category}`} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {section.withDot && (
                          <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true">
                            <circle cx="5" cy="5" r="5" fill={entry.color} />
                          </svg>
                        )}
                        <span className="truncate text-[11px] font-medium text-[#3F3F46]">
                          {entry.category}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold ${section.amountClassName}`}>
                        {formatCurrency(entry.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

import type { StatisticsFlowDay } from "@/types";
import { memo, useEffect } from "react";
import {
  TRANSACTION_EXPENSE_TEXT_CLASS,
  TRANSACTION_INCOME_TEXT_CLASS,
} from "@/constants";
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
  useEffect(() => {
    if (!day) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [day, onClose]);

  if (!day) {
    return null;
  }

  const sections = [
    {
      amountClassName: TRANSACTION_INCOME_TEXT_CLASS,
      emptyLabel: "Sin ingresos",
      key: "income",
      label: popupIncomeLabel,
      rows: day.incomeByCategory,
      total: day.incomeTotal,
      withDot: false,
    },
    {
      amountClassName: TRANSACTION_EXPENSE_TEXT_CLASS,
      emptyLabel: "Sin egresos",
      key: "expense",
      label: popupExpenseLabel,
      rows: day.expenseByCategory,
      total: day.expenseTotal,
      withDot: true,
    },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--panel-bg)] p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de flujo diario"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{day.dateLabel}</span>
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Detalle diario</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
          >
            {popupCloseLabel}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <div key={section.key} className="rounded-xl bg-[var(--surface-muted)] px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-xs font-semibold ${section.amountClassName}`}>{section.label}</span>
                <span className={`text-xs font-semibold tabular-nums ${section.amountClassName}`}>
                  {formatCurrency(section.total)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {section.rows.length === 0 ? (
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">{section.emptyLabel}</span>
                ) : (
                  section.rows.map((entry) => (
                    <div key={`${section.key}-${entry.category}`} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {section.withDot && (
                          <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true">
                            <circle cx="5" cy="5" r="5" fill={entry.color} />
                          </svg>
                        )}
                        <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">
                          {entry.category}
                        </span>
                      </div>
                      <span className={`min-w-[84px] text-right text-[11px] font-semibold tabular-nums ${section.amountClassName}`}>
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

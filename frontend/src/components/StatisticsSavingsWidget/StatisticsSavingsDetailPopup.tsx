import type { StatisticsTrendPoint } from "@/hooks/useStatisticsPageModel";
import { memo, useEffect } from "react";
import { formatCurrency } from "@/utils";

export interface StatisticsSavingsDetailPopupProps {
  closeLabel?: string;
  emptyLabel?: string;
  onClose: () => void;
  point: StatisticsTrendPoint | null;
  titleLabel?: string;
}

export const StatisticsSavingsDetailPopup = memo(function StatisticsSavingsDetailPopup({
  closeLabel = "Cerrar",
  emptyLabel = "Sin aportes de metas en este período.",
  onClose,
  point,
  titleLabel = "Detalle de progreso",
}: StatisticsSavingsDetailPopupProps) {
  useEffect(() => {
    if (!point) {
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
  }, [onClose, point]);

  if (!point) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--panel-bg)] p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de progreso en metas"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{titleLabel}</span>
            <span className="block text-[11px] font-medium text-[var(--text-secondary)]">{point.rangeLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
          >
            {closeLabel}
          </button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[var(--surface-muted)] px-2.5 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
              Período
            </span>
            <span className="mt-1 block text-xs font-semibold text-[var(--text-primary)]">
              {formatCurrency(point.bucketSaved)}
            </span>
          </div>
          <div className="rounded-xl bg-[var(--surface-muted)] px-2.5 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
              Acumulado
            </span>
            <span className="mt-1 block text-xs font-semibold text-[var(--text-primary)]">
              {formatCurrency(point.cumulativeSaved)}
            </span>
          </div>
          <div className="rounded-xl bg-[var(--surface-muted)] px-2.5 py-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
              Progreso
            </span>
            <span className="mt-1 block text-xs font-semibold text-[#16A34A]">
              {`${point.value.toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Aportes por meta</span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{point.label}</span>
          </div>
          <div className="flex max-h-[220px] flex-col gap-1.5 overflow-auto pr-0.5">
            {point.goalSegments.length === 0 ? (
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
            ) : (
              point.goalSegments.map((segment) => (
                <div key={`${point.label}-${segment.goalId ?? segment.label}`} className="rounded-lg bg-[var(--panel-bg)] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" aria-hidden="true">
                        <circle cx="5" cy="5" r="5" fill={segment.color} />
                      </svg>
                      <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">{segment.label}</span>
                    </div>
                    <span className="text-right text-[11px] font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(segment.amount)}
                    </span>
                  </div>
                  <div className="mt-1 h-[5px] w-full rounded-full bg-[var(--surface-border)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: segment.color,
                        width: `${Math.max(3, Math.min(100, segment.percentOfBucket))}%`,
                      }}
                    />
                  </div>
                  <span className="mt-1 block text-right text-[10px] font-medium text-[var(--text-secondary)]">
                    {`${segment.percentOfBucket.toFixed(1)}% del período`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

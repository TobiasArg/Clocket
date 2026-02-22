import { TrendLine } from "@/components/TrendLine/TrendLine";
import type { InvestmentTableRow, PositionEntryRow } from "@/hooks/useInvestmentsPageModel";
import { useCurrency } from "@/hooks";
import { formatCurrency, getUsdRate } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export interface InvestmentPositionDetailPanelProps {
  isOpen: boolean;
  row: InvestmentTableRow | null;
  entries: PositionEntryRow[];
  isEntriesLoading?: boolean;
  deletingEntryId?: string | null;
  onClose: () => void;
  onAddEntry: (id: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onRequestDelete: (id: string) => void;
}

const moneyTone = (value: number): string => {
  return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
};

const SWIPE_CLOSE_THRESHOLD = 92;
const SWIPE_MAX_DISTANCE = 180;
const SWIPE_DAMPING = 0.82;
const CLOSE_ANIMATION_MS = 280;
const CLOSE_EXIT_OFFSET_FALLBACK = 420;

export function InvestmentPositionDetailPanel({
  isOpen,
  row,
  entries,
  isEntriesLoading = false,
  deletingEntryId = null,
  onClose,
  onAddEntry,
  onDeleteEntry,
  onRequestDelete,
}: InvestmentPositionDetailPanelProps) {
  const { currency } = useCurrency();
  const usdRate = getUsdRate();
  const fromUsd = (value: number): number => (currency === "ARS" ? value * usdRate : value);
  const signedMoney = (value: number): string => {
    return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(fromUsd(value)))}`;
  };
  const panelRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isTrackingRef = useRef<boolean>(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [exitOffset, setExitOffset] = useState<number>(CLOSE_EXIT_OFFSET_FALLBACK);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const requestClose = useCallback(() => {
    if (isClosing) {
      return;
    }

    isTrackingRef.current = false;
    touchStartYRef.current = null;
    const viewportHeight = window.innerHeight || CLOSE_EXIT_OFFSET_FALLBACK;
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    setExitOffset(Math.max(viewportHeight, panelHeight) + 48);
    setIsClosing(true);

    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, CLOSE_ANIMATION_MS);
  }, [clearCloseTimeout, isClosing, onClose]);

  useEffect(() => {
    if (!isOpen) {
      clearCloseTimeout();
      setSwipeOffset(0);
      setIsClosing(false);
      setExitOffset(CLOSE_EXIT_OFFSET_FALLBACK);
      touchStartYRef.current = null;
      isTrackingRef.current = false;
    }
  }, [clearCloseTimeout, isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, requestClose]);

  if (!isOpen || !row) {
    return null;
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || isClosing) {
      return;
    }

    const panelNode = panelRef.current;
    if (!panelNode || panelNode.scrollTop > 0) {
      return;
    }

    touchStartYRef.current = event.touches[0].clientY;
    isTrackingRef.current = true;
    setSwipeOffset(0);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isTrackingRef.current || isClosing) {
      return;
    }

    const startY = touchStartYRef.current;
    const panelNode = panelRef.current;
    if (startY === null || !panelNode || panelNode.scrollTop > 0) {
      isTrackingRef.current = false;
      touchStartYRef.current = null;
      setSwipeOffset(0);
      return;
    }

    const deltaY = event.touches[0].clientY - startY;
    if (deltaY <= 0) {
      setSwipeOffset(0);
      return;
    }

    event.preventDefault();
    setSwipeOffset(Math.min(SWIPE_MAX_DISTANCE, deltaY * SWIPE_DAMPING));
  };

  const handleTouchEnd = () => {
    if (!isTrackingRef.current) {
      return;
    }

    isTrackingRef.current = false;
    touchStartYRef.current = null;

    if (swipeOffset >= SWIPE_CLOSE_THRESHOLD) {
      requestClose();
      return;
    }

    setSwipeOffset(0);
  };

  const handleTouchCancel = () => {
    isTrackingRef.current = false;
    touchStartYRef.current = null;
    setSwipeOffset(0);
  };

  const panelOffset = swipeOffset + (isClosing ? exitOffset : 0);
  const backdropClassName = isClosing ? "opacity-0" : "opacity-100";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={requestClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ease-out ${backdropClassName}`}
        aria-label="Cerrar detalle"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div
          ref={panelRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-h-[88vh] overflow-auto rounded-t-3xl bg-[var(--panel-bg)] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${panelOffset}px)` }}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--surface-border)]" />

          <div>
            <span className="block text-2xl font-bold text-[var(--text-primary)] font-['Outfit']">{row.displayName}</span>
            <span className="mt-1 inline-flex rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {row.assetType}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <section className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Resumen</span>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <span className="text-[var(--text-secondary)]">Invertido</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">{formatCurrency(fromUsd(row.investedUSD))}</span>
                <span className="text-[var(--text-secondary)]">Valor actual</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">{formatCurrency(fromUsd(row.currentValueUSD))}</span>
                <span className="text-[var(--text-secondary)]">Amount</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">{row.amount.toFixed(8)}</span>
                <span className="text-[var(--text-secondary)]">Precio de entrada</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">{formatCurrency(fromUsd(row.buyPrice))}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Performance</span>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <span className="text-[var(--text-secondary)]">PnL total</span>
                <span className={`text-right font-semibold ${moneyTone(row.pnlTotalUSD)}`}>{signedMoney(row.pnlTotalUSD)} ({row.pnlTotalText})</span>
                <span className="text-[var(--text-secondary)]">PnL diario</span>
                <span className={`text-right font-semibold ${moneyTone(row.pnlDailyUSD)}`}>{signedMoney(row.pnlDailyUSD)} ({row.pnlDailyText})</span>
                <span className="text-[var(--text-secondary)]">PnL mensual</span>
                <span className={`text-right font-semibold ${moneyTone(row.pnlMonthUSD)}`}>{signedMoney(row.pnlMonthUSD)} ({row.pnlMonthText})</span>
                <span className="text-[var(--text-secondary)]">Actualizado</span>
                <span className="text-right font-semibold text-[var(--text-primary)]">{row.lastUpdatedLabel}</span>
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Historial de valor</span>
            <div className="mt-3 rounded-xl bg-[var(--panel-bg)] p-2">
              {row.hasHistoricalData ? (
                <TrendLine
                  className="h-[180px]"
                  animationKey={`detail-${row.id}-${row.sparklinePoints.length}`}
                  points={row.sparklinePoints}
                  lineColor="#0EA5E9"
                  dotColor="#0EA5E9"
                />
              ) : (
                <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-[var(--surface-border)] bg-[var(--surface-muted)]">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">No hay snapshots suficientes para el gráfico.</span>
                </div>
              )}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Entradas</span>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{entries.length}</span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {isEntriesLoading && (
                <span className="text-xs font-medium text-[var(--text-secondary)]">Cargando entradas...</span>
              )}

              {!isEntriesLoading && entries.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Todavía no hay movimientos para esta posición.</span>
                </div>
              )}

              {!isEntriesLoading && entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{entry.entryTypeLabel}</span>
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]">{entry.createdAtLabel}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <span className="text-[var(--text-secondary)]">{currency}</span>
                    <span className="text-right font-semibold text-[var(--text-primary)]">
                      {formatCurrency(fromUsd(entry.usdSpent))}
                    </span>
                    <span className="text-[var(--text-secondary)]">Precio</span>
                    <span className="text-right font-semibold text-[var(--text-primary)]">
                      {formatCurrency(fromUsd(entry.buyPrice))}
                    </span>
                    <span className="text-[var(--text-secondary)]">Amount</span>
                    <span className="text-right font-semibold text-[var(--text-primary)]">{entry.amount.toFixed(8)}</span>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      disabled={deletingEntryId === entry.id}
                      className="rounded-lg border border-[#FECACA] px-2.5 py-1 text-[11px] font-semibold text-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] disabled:opacity-60"
                    >
                      {deletingEntryId === entry.id ? "Eliminando..." : "Eliminar entrada"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {row.staleWarning && (
            <span className="mt-3 block text-xs font-medium text-[#B45309]">{row.staleWarning}</span>
          )}
          {row.refreshError && (
            <span className="mt-1 block text-xs font-medium text-[#B91C1C]">{row.refreshError}</span>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onAddEntry(row.id)}
              className="rounded-xl border border-[var(--surface-border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              Agregar entrada
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(row.id)}
              className="rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
            >
              Eliminar posición
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

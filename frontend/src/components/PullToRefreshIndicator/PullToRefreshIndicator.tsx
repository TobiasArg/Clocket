import { memo } from "react";
import type { PullToRefreshState } from "@/hooks/usePullToRefresh";

export interface PullToRefreshIndicatorProps {
  state: PullToRefreshState;
  progress: number;
}

export const PullToRefreshIndicator = memo(function PullToRefreshIndicator({ state, progress }: PullToRefreshIndicatorProps) {
  const isVisible = state !== "idle" || progress > 0;
  const containerAnimationClass = isVisible ? "max-h-12 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1";
  const spinnerOpacity = Math.max(0.25, Math.min(1, progress + 0.2));
  const spinnerScale = 0.78 + Math.min(0.22, progress * 0.22);
  const spinnerDuration = state === "refreshing" ? "0.72s" : "1.15s";

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${containerAnimationClass}`}
      aria-hidden={!isVisible}
    >
      <div className="flex justify-center py-2" role="status" aria-live="polite">
        <span
          className="inline-flex transition-all duration-200 ease-out"
          style={{
            opacity: spinnerOpacity,
            transform: `scale(${spinnerScale})`,
          }}
        >
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--surface-border)] border-t-[var(--text-secondary)]"
            style={{ animationDuration: spinnerDuration }}
          />
        </span>
        <span className="sr-only">
          {state === "refreshing" ? "Actualizando cotizaciones" : "Preparado para actualizar"}
        </span>
      </div>
    </div>
  );
});

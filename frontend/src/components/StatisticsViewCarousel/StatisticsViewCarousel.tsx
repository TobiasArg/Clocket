import type { ReactNode, UIEvent as ReactUIEvent } from "react";
import { useEffect, useRef } from "react";
import type { StatisticsChartView } from "@/hooks";

export interface StatisticsViewOption {
  id: StatisticsChartView;
  label: string;
}

export interface StatisticsViewCarouselProps {
  activeView: StatisticsChartView;
  className?: string;
  contentClassName?: string;
  onViewChange: (nextView: StatisticsChartView) => void;
  options?: ReadonlyArray<StatisticsViewOption>;
  renderSlide: (view: StatisticsChartView, isActive: boolean) => ReactNode;
}

export const STATISTICS_VIEW_OPTIONS: ReadonlyArray<StatisticsViewOption> = [
  { id: "day", label: "Día" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
];

export function StatisticsViewCarousel({
  activeView,
  className = "",
  contentClassName = "",
  onViewChange,
  options = STATISTICS_VIEW_OPTIONS,
  renderSlide,
}: StatisticsViewCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const syncSourceRef = useRef<"dot" | "scroll" | null>(null);
  const scrollCommitTimeoutRef = useRef<number | null>(null);
  const activeViewIndex = Math.max(0, options.findIndex((option) => option.id === activeView));

  useEffect(() => {
    return () => {
      if (scrollCommitTimeoutRef.current !== null) {
        window.clearTimeout(scrollCommitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const viewportNode = viewportRef.current;
    if (!viewportNode || options.length === 0 || activeViewIndex < 0) {
      return;
    }

    if (syncSourceRef.current === "scroll") {
      syncSourceRef.current = null;
      return;
    }

    const width = viewportNode.clientWidth;
    if (width <= 0) {
      return;
    }

    const targetScrollLeft = activeViewIndex * width;
    const distance = Math.abs(viewportNode.scrollLeft - targetScrollLeft);
    if (distance < 1) {
      syncSourceRef.current = null;
      return;
    }

    viewportNode.scrollTo({
      left: targetScrollLeft,
      behavior: syncSourceRef.current === "dot" ? "smooth" : "auto",
    });
    syncSourceRef.current = null;
  }, [activeViewIndex, options.length]);

  const commitActiveViewFromViewport = (viewportNode: HTMLDivElement): void => {
    if (options.length === 0) {
      return;
    }

    const width = viewportNode.clientWidth;
    if (width <= 0) {
      return;
    }

    const rawIndex = Math.round(viewportNode.scrollLeft / width);
    const nextIndex = Math.max(0, Math.min(rawIndex, options.length - 1));
    const nextView = options[nextIndex];
    if (!nextView || nextView.id === activeView) {
      return;
    }

    syncSourceRef.current = "scroll";
    onViewChange(nextView.id);
  };

  const handleViewportScroll = (event: ReactUIEvent<HTMLDivElement>): void => {
    if (scrollCommitTimeoutRef.current !== null) {
      window.clearTimeout(scrollCommitTimeoutRef.current);
    }

    const viewportNode = event.currentTarget;
    scrollCommitTimeoutRef.current = window.setTimeout(() => {
      scrollCommitTimeoutRef.current = null;
      commitActiveViewFromViewport(viewportNode);
    }, 70);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        ref={viewportRef}
        className={`flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${contentClassName}`}
        onScroll={handleViewportScroll}
      >
        {options.map((option) => (
          <div key={option.id} className="w-full shrink-0 snap-center">
            {renderSlide(option.id, option.id === activeView)}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1">
        {options.map((option) => {
          const isActive = option.id === activeView;
          return (
            <button
              key={`${option.id}-dot`}
              type="button"
              onClick={() => {
                syncSourceRef.current = "dot";
                onViewChange(option.id);
              }}
              className={`h-1.5 rounded-full transition ${
                isActive ? "w-4 bg-[var(--text-primary)]" : "w-1.5 bg-[var(--text-secondary)]"
              }`}
              aria-label={`Ir a vista ${option.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}

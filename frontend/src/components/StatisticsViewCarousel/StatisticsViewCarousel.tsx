import type { CSSProperties, ReactNode } from "react";
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
  const activeViewIndex = Math.max(0, options.findIndex((option) => option.id === activeView));
  const sliderStyle: CSSProperties = {
    transform: `translateX(-${activeViewIndex * 100}%)`,
  };

  const handleShift = (step: -1 | 1) => {
    if (options.length <= 0) {
      return;
    }

    const nextIndex = (activeViewIndex + step + options.length) % options.length;
    const nextView = options[nextIndex];
    if (!nextView) {
      return;
    }

    onViewChange(nextView.id);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => handleShift(-1)}
          className="h-7 min-w-7 rounded-md border border-[#D4D4D8] bg-white px-2 text-xs font-semibold text-[#52525B] hover:bg-[#F4F4F5]"
          aria-label="Vista anterior"
        >
          {"<"}
        </button>

        <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#E4E4E7] p-1">
          {options.map((option) => {
            const isActive = option.id === activeView;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onViewChange(option.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  isActive
                    ? "bg-white text-[#18181B] shadow-sm"
                    : "text-[#52525B] hover:bg-white/70"
                }`}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleShift(1)}
          className="h-7 min-w-7 rounded-md border border-[#D4D4D8] bg-white px-2 text-xs font-semibold text-[#52525B] hover:bg-[#F4F4F5]"
          aria-label="Vista siguiente"
        >
          {">"}
        </button>
      </div>

      <div className={`overflow-hidden ${contentClassName}`}>
        <div className="flex w-full transition-transform duration-300 ease-out" style={sliderStyle}>
          {options.map((option) => (
            <div key={option.id} className="w-full shrink-0">
              {renderSlide(option.id, option.id === activeView)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1">
        {options.map((option) => {
          const isActive = option.id === activeView;
          return (
            <button
              key={`${option.id}-dot`}
              type="button"
              onClick={() => onViewChange(option.id)}
              className={`h-1.5 rounded-full transition ${
                isActive ? "w-4 bg-[#3F3F46]" : "w-1.5 bg-[#A1A1AA]"
              }`}
              aria-label={`Ir a vista ${option.label}`}
            />
          );
        })}
      </div>
    </div>
  );
}

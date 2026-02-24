import { memo, useRef } from "react";
import { HeroBalance } from "@/components";

export interface BalanceWidgetSlide {
  id: string;
  label: string;
  balance: string;
  incomeValue?: string;
  expenseValue?: string;
}

export interface BalanceWidgetProps {
  activeSlide: number;
  expenseLabel: string;
  incomeLabel: string;
  onSlideChange: (nextSlide: number) => void;
  slides: BalanceWidgetSlide[];
}

export const BalanceWidget = memo(function BalanceWidget({
  activeSlide,
  expenseLabel,
  incomeLabel,
  onSlideChange,
  slides,
}: BalanceWidgetProps) {
  const pointerStartX = useRef<number | null>(null);

  const goTo = (index: number) => {
    onSlideChange(Math.max(0, Math.min(index, slides.length - 1)));
  };

  return (
    <div className="clocket-aurora-card rounded-2xl p-4 flex flex-col gap-4">
      <div
        className="overflow-hidden select-none touch-pan-y"
        onPointerDown={(e) => {
          pointerStartX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (pointerStartX.current === null) return;
          const delta = e.clientX - pointerStartX.current;
          pointerStartX.current = null;
          if (Math.abs(delta) < 40) return;
          goTo(delta < 0 ? activeSlide + 1 : activeSlide - 1);
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full shrink-0">
              <HeroBalance
                label={slide.label}
                balance={slide.balance}
                incomeLabel={incomeLabel}
                incomeValue={slide.incomeValue}
                expenseLabel={expenseLabel}
                expenseValue={slide.expenseValue}
              />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={slide.label}
              className={`h-2 rounded-full transition-all duration-300 ease-out ${
                i === activeSlide
                  ? "w-5 bg-[var(--text-primary)]"
                  : "w-2 bg-[var(--surface-border)]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

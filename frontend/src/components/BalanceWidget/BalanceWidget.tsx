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

export function BalanceWidget({
  activeSlide,
  expenseLabel,
  incomeLabel,
  onSlideChange,
  slides,
}: BalanceWidgetProps) {
  return (
    <div className="rounded-2xl bg-[#F4F4F5] border border-[#E4E4E7] p-4">
      <div
        className="flex overflow-x-auto snap-x snap-mandatory"
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget;
          if (clientWidth <= 0) {
            return;
          }

          const nextIndex = Math.round(scrollLeft / clientWidth);
          const maxIndex = Math.max(0, slides.length - 1);
          onSlideChange(Math.max(0, Math.min(nextIndex, maxIndex)));
        }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full shrink-0 snap-center">
            <HeroBalance
              label={slide.label}
              balance={slide.balance}
              incomeLabel={incomeLabel}
              incomeValue={slide.incomeValue}
              expenseLabel={expenseLabel}
              expenseValue={slide.expenseValue}
              activeDot={activeSlide}
              totalDots={slides.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

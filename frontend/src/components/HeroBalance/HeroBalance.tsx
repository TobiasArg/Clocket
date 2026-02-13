import { Dot } from "@/components";
import { PhosphorIcon } from "@/components";
import { StatDisplay } from "@/components";

export interface HeroBalanceProps {
  label?: string;
  balance: string;
  incomeLabel?: string;
  incomeValue?: string;
  expenseLabel?: string;
  expenseValue?: string;
  variant?: "mobile" | "desktop";
  activeDot?: number;
  totalDots?: number;
  className?: string;
}

export function HeroBalance({
  label = "TOTAL BALANCE",
  balance,
  incomeLabel = "Ingresos",
  incomeValue,
  expenseLabel = "Gastos",
  expenseValue,
  variant = "mobile",
  activeDot = 0,
  totalDots = 3,
  className = "",
}: HeroBalanceProps) {
  if (variant === "desktop") {
    return (
      <div className={`flex flex-col gap-4 bg-black rounded-3xl px-12 py-10 flex-1 ${className}`}>
        <span className="text-[13px] font-semibold text-white/80 tracking-[3px]">{label}</span>
        <span className="text-[56px] font-black text-white font-['Outfit'] tracking-[-4px] leading-none">
          {balance}
        </span>
        <div className="flex gap-8">
          {incomeValue && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-normal text-white/70">{incomeLabel}</span>
              <div className="flex items-center gap-1.5">
                <PhosphorIcon name="arrow-up" className="text-white" size="text-[16px]" />
                <span className="text-xl font-semibold text-white font-['Outfit']">{incomeValue}</span>
              </div>
            </div>
          )}
          {expenseValue && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-normal text-white/70">{expenseLabel}</span>
              <div className="flex items-center gap-1.5">
                <PhosphorIcon name="arrow-down" className="text-white" size="text-[16px]" />
                <span className="text-xl font-semibold text-white font-['Outfit']">{expenseValue}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <span className="text-xs font-medium text-[#71717A] tracking-[2px]">{label}</span>
      <span className="text-[64px] font-black text-black font-['Outfit'] tracking-[-3px] leading-none">
        {balance}
      </span>
      <div className="flex gap-3 w-full">
        {incomeValue && (
          <StatDisplay
            label={incomeLabel}
            value={incomeValue}
            labelClassName="text-xs font-medium text-[#71717A]"
            valueClassName="text-2xl font-extrabold text-black font-['Outfit']"
            className="flex-1 bg-[#F4F4F5] rounded-2xl p-4"
          />
        )}
        {expenseValue && (
          <StatDisplay
            label={expenseLabel}
            value={expenseValue}
            labelClassName="text-xs font-medium text-[#71717A]"
            valueClassName="text-2xl font-extrabold text-black font-['Outfit']"
            className="flex-1 bg-[#F4F4F5] rounded-2xl p-4"
          />
        )}
      </div>
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: totalDots }).map((_, i) => (
          <Dot
            key={i}
            size={i === activeDot ? "w-2 h-2" : "w-1.5 h-1.5"}
            color={i === activeDot ? "bg-black" : "bg-[#D4D4D8]"}
          />
        ))}
      </div>
    </div>
  );
}

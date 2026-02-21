import { Dot } from "@/components";
import { PhosphorIcon } from "@/components";
import { StatDisplay } from "@/components";
import type { ReactNode } from "react";

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

const renderBalanceWithScaledDecimals = (value: string): ReactNode => {
  const match = value.match(/([.,]\d+)$/);
  if (!match || match.index === undefined) {
    return value;
  }

  const integerPart = value.slice(0, match.index);
  const decimalPart = match[1];

  return (
    <>
      {integerPart}
      <span className="text-[0.6em] leading-[1] align-baseline">{decimalPart}</span>
    </>
  );
};

const getBalanceSizeClass = (
  value: string,
  variant: "mobile" | "desktop",
): string => {
  const normalizedLength = value.replace(/\s+/g, "").length;

  if (variant === "desktop") {
    if (normalizedLength >= 15) {
      return "text-[clamp(1.875rem,3.6vw,2.5rem)]";
    }

    if (normalizedLength >= 12) {
      return "text-[clamp(2.125rem,4.2vw,2.875rem)]";
    }

    return "text-[clamp(2.5rem,5vw,3.125rem)]";
  }

  if (normalizedLength >= 15) {
    return "text-[clamp(1.5rem,6.6vw,2.125rem)]";
  }

  if (normalizedLength >= 12) {
    return "text-[clamp(1.75rem,7.8vw,2.5rem)]";
  }

  return "text-[clamp(2.125rem,10.5vw,3rem)]";
};

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
  const balanceSizeClass = getBalanceSizeClass(balance, variant);

  if (variant === "desktop") {
    return (
      <div className={`flex min-w-0 flex-col gap-4 bg-black rounded-3xl px-12 py-10 flex-1 ${className}`}>
        <span className="text-[13px] font-semibold text-white/80 tracking-[3px]">{label}</span>
        <span className={`block w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-black text-white font-['Outfit'] tracking-[-2px] leading-none ${balanceSizeClass}`}>
          {renderBalanceWithScaledDecimals(balance)}
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
    <div className={`flex min-w-0 flex-col items-center gap-3 ${className}`}>
      <span className="text-xs font-medium text-[var(--text-secondary)] tracking-[2px]">{label}</span>
      <span className={`block w-full max-w-full text-center overflow-hidden text-ellipsis whitespace-nowrap font-black text-[var(--text-primary)] font-['Outfit'] tracking-[-2px] leading-none ${balanceSizeClass}`}>
        {renderBalanceWithScaledDecimals(balance)}
      </span>
      <div className="flex gap-3 w-full">
        {incomeValue && (
          <StatDisplay
            label={incomeLabel}
            value={incomeValue}
            labelClassName="text-xs font-medium text-[var(--text-secondary)]"
            valueClassName="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.125rem,5.2vw,1.5rem)] font-extrabold text-[var(--text-primary)] font-['Outfit']"
            className="min-w-0 flex-1 bg-[var(--surface-muted)] rounded-2xl p-4"
          />
        )}
        {expenseValue && (
          <StatDisplay
            label={expenseLabel}
            value={expenseValue}
            labelClassName="text-xs font-medium text-[var(--text-secondary)]"
            valueClassName="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.125rem,5.2vw,1.5rem)] font-extrabold text-[var(--text-primary)] font-['Outfit']"
            className="min-w-0 flex-1 bg-[var(--surface-muted)] rounded-2xl p-4"
          />
        )}
      </div>
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: totalDots }).map((_, i) => (
          <Dot
            key={i}
            size={i === activeDot ? "w-2 h-2" : "w-1.5 h-1.5"}
            color={i === activeDot ? "bg-[var(--text-primary)]" : "bg-[var(--surface-border)]"}
          />
        ))}
      </div>
    </div>
  );
}

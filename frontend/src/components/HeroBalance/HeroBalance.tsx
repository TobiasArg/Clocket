import { PhosphorIcon } from "@/components";
import { memo, type ReactNode } from "react";

export interface HeroBalanceProps {
  label?: string;
  balance: string;
  incomeLabel?: string;
  incomeValue?: string;
  expenseLabel?: string;
  expenseValue?: string;
  variant?: "mobile" | "desktop";
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

const BALANCE_SIZE_CLASS_MOBILE = "text-[clamp(1.75rem,7.8vw,2.5rem)]";
const BALANCE_SIZE_CLASS_DESKTOP = "text-[clamp(2.125rem,4.2vw,2.875rem)]";

export const HeroBalance = memo(function HeroBalance({
  label = "TOTAL BALANCE",
  balance,
  incomeLabel = "Ingresos",
  incomeValue,
  expenseLabel = "Gastos",
  expenseValue,
  variant = "mobile",
  className = "",
}: HeroBalanceProps) {
  const balanceSizeClass = variant === "desktop" ? BALANCE_SIZE_CLASS_DESKTOP : BALANCE_SIZE_CLASS_MOBILE;

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
          <div className="min-w-0 flex-1 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4 flex items-center gap-1.5">
            <PhosphorIcon name="arrow-up" className="text-emerald-500 shrink-0" size="text-[16px]" />
            <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.125rem,5.2vw,1.5rem)] font-extrabold text-[var(--text-primary)] font-['Outfit']">
              {incomeValue}
            </span>
          </div>
        )}
        {expenseValue && (
          <div className="min-w-0 flex-1 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4 flex items-center gap-1.5">
            <PhosphorIcon name="arrow-down" className="text-[var(--text-primary)] shrink-0" size="text-[16px]" />
            <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.125rem,5.2vw,1.5rem)] font-extrabold text-[var(--text-primary)] font-['Outfit']">
              {expenseValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

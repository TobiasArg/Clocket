import { Dot } from "@/components";
import { ProgressBar } from "@/components";

export interface CategoryItemProps {
  dotColor: string;
  name: string;
  value?: string;
  secondaryValue?: string;
  nameClassName?: string;
  valueClassName?: string;
  secondaryClassName?: string;
  dotSize?: string;
  progress?: {
    percent: number;
    barColor: string;
    trackColor?: string;
    barHeight?: string;
  };
  containerClassName?: string;
  className?: string;
}

export function CategoryItem({
  dotColor,
  name,
  value,
  secondaryValue,
  nameClassName = "text-[15px] font-semibold text-[var(--text-primary)] font-['Outfit']",
  valueClassName = "text-[15px] font-bold text-[var(--text-primary)] font-['Outfit']",
  secondaryClassName = "text-xs font-medium text-[var(--text-secondary)]",
  dotSize = "w-2.5 h-2.5",
  progress,
  containerClassName = "bg-[var(--surface-muted)] rounded-2xl p-4",
  className = "",
}: CategoryItemProps) {
  return (
    <div className={`flex flex-col gap-3 ${containerClassName} ${className}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Dot color={dotColor} size={dotSize} />
          <span className={`block truncate ${nameClassName}`}>{name}</span>
        </div>
        {(value || secondaryValue) && (
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            {value && <span className={`block max-w-[120px] truncate ${valueClassName}`}>{value}</span>}
            {secondaryValue && <span className={`block max-w-[80px] truncate ${secondaryClassName}`}>{secondaryValue}</span>}
          </div>
        )}
      </div>
      {progress && (
        <ProgressBar
          percent={progress.percent}
          barColor={progress.barColor}
          trackColor={progress.trackColor ?? "bg-[var(--surface-border)]"}
          height={progress.barHeight ?? "h-1.5"}
        />
      )}
    </div>
  );
}

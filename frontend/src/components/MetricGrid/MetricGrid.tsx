import { memo } from "react";
export interface MetricGridProps {
  metrics: Array<{
    label: string;
    value: string;
    valueColor?: string;
  }>;
  labelClassName?: string;
  valueClassName?: string;
  className?: string;
}

export const MetricGrid = memo(function MetricGrid({
  metrics,
  labelClassName = "text-[11px] font-normal text-[var(--text-secondary)]",
  valueClassName = "text-base font-semibold font-['Outfit'] text-[var(--text-primary)]",
  className = "",
}: MetricGridProps) {
  return (
    <div className={`flex w-full gap-2 ${className}`}>
      {metrics.map((m) => (
        <div key={m.label} className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={`block truncate ${labelClassName}`}>{m.label}</span>
          <span className={`block truncate ${valueClassName} ${m.valueColor ?? ""}`}>{m.value}</span>
        </div>
      ))}
    </div>
  );
});

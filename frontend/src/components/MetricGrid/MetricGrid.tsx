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

export function MetricGrid({
  metrics,
  labelClassName = "text-[11px] font-normal text-[#71717A]",
  valueClassName = "text-base font-semibold font-['Outfit'] text-[#18181B]",
  className = "",
}: MetricGridProps) {
  return (
    <div className={`flex justify-between w-full ${className}`}>
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col gap-1">
          <span className={labelClassName}>{m.label}</span>
          <span className={`${valueClassName} ${m.valueColor ?? ""}`}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}

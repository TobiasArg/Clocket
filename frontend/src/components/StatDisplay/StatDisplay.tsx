export interface StatDisplayProps {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
  gap?: string;
  align?: "start" | "end";
  className?: string;
}

export function StatDisplay({
  label,
  value,
  labelClassName = "text-xs font-normal text-[#A1A1AA]",
  valueClassName = "text-[32px] font-bold text-white font-['Outfit']",
  gap = "gap-1",
  align = "start",
  className = "",
}: StatDisplayProps) {
  return (
    <div className={`flex flex-col ${gap} ${align === "end" ? "items-end" : ""} ${className}`}>
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

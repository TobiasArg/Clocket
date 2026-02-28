import { memo } from "react";
export interface StatDisplayProps {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
  gap?: string;
  align?: "start" | "end";
  className?: string;
}

export const StatDisplay = memo(function StatDisplay({
  label,
  value,
  labelClassName = "text-xs font-normal text-[var(--text-secondary)]",
  valueClassName = "text-[32px] font-bold text-white font-['Outfit']",
  gap = "gap-1",
  align = "start",
  className = "",
}: StatDisplayProps) {
  return (
    <div className={`flex min-w-0 flex-col ${gap} ${align === "end" ? "items-end" : ""} ${className}`}>
      <span className={`block max-w-full truncate ${labelClassName}`}>{label}</span>
      <span className={`block max-w-full truncate ${valueClassName}`}>{value}</span>
    </div>
  );
});

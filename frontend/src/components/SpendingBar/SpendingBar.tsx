import { getPercentWidthClass } from "@/utils";

export interface SpendingBarProps {
  label: string;
  percentage: number;
  barColor: string;
  labelWidth?: string;
  className?: string;
}

export function SpendingBar({
  label,
  percentage,
  barColor,
  labelWidth = "w-[88px]",
  className = "",
}: SpendingBarProps) {
  const widthClassName = getPercentWidthClass(percentage);

  return (
    <div className={`flex min-w-0 items-center gap-3 w-full ${className}`}>
      <span className={`min-w-0 truncate text-[13px] font-medium text-[#71717A] ${labelWidth} shrink-0`}>{label}</span>
      <div className="min-w-0 flex-1 h-2 bg-[#F4F4F5] rounded overflow-hidden">
        <div className={`h-full rounded ${barColor} ${widthClassName}`} />
      </div>
      <span className="w-[40px] shrink-0 text-[13px] font-bold text-black font-['Outfit'] text-right">
        {percentage}%
      </span>
    </div>
  );
}

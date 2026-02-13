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
  labelWidth = "w-[60px]",
  className = "",
}: SpendingBarProps) {
  const widthClassName = getPercentWidthClass(percentage);

  return (
    <div className={`flex items-center gap-3 w-full ${className}`}>
      <span className={`text-[13px] font-medium text-[#71717A] ${labelWidth} shrink-0`}>{label}</span>
      <div className="flex-1 h-2 bg-[#F4F4F5] rounded overflow-hidden">
        <div className={`h-full rounded ${barColor} ${widthClassName}`} />
      </div>
      <span className="text-[13px] font-bold text-black font-['Outfit'] text-right w-[32px]">
        {percentage}%
      </span>
    </div>
  );
}

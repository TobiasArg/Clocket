import { ProgressBar } from "@/components";

export interface ProgressSectionProps {
  percent: number;
  barColor: string;
  trackColor?: string;
  barHeight?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftLabelClassName?: string;
  rightLabelClassName?: string;
  className?: string;
}

export function ProgressSection({
  percent,
  barColor,
  trackColor = "bg-[#E4E4E7]",
  barHeight = "h-2",
  leftLabel,
  rightLabel,
  leftLabelClassName = "text-sm font-semibold text-[#18181B] font-['Outfit']",
  rightLabelClassName = "text-sm font-normal text-[#71717A]",
  className = "",
}: ProgressSectionProps) {
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <ProgressBar percent={percent} barColor={barColor} trackColor={trackColor} height={barHeight} />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between w-full">
          {leftLabel && <span className={leftLabelClassName}>{leftLabel}</span>}
          {rightLabel && <span className={rightLabelClassName}>{rightLabel}</span>}
        </div>
      )}
    </div>
  );
}

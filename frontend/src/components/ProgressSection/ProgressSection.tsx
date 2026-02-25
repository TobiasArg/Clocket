import { memo } from "react";
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

export const ProgressSection = memo(function ProgressSection({
  percent,
  barColor,
  trackColor = "bg-[var(--surface-border)]",
  barHeight = "h-2",
  leftLabel,
  rightLabel,
  leftLabelClassName = "text-sm font-semibold text-[var(--text-primary)] font-['Outfit']",
  rightLabelClassName = "text-sm font-normal text-[var(--text-secondary)]",
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
});

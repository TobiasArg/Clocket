import { memo } from "react";
import { getPercentWidthClass } from "@/utils";

export interface ProgressBarProps {
  percent: number;
  barColor: string;
  trackColor?: string;
  height?: string;
}

export const ProgressBar = memo(function ProgressBar({
  percent,
  barColor,
  trackColor = "bg-[var(--surface-muted)]",
  height = "h-2",
}: ProgressBarProps) {
  const widthClassName = getPercentWidthClass(percent);

  return (
    <div className={`w-full ${height} ${trackColor} rounded overflow-hidden`}>
      <div className={`h-full rounded ${barColor} ${widthClassName}`} />
    </div>
  );
});

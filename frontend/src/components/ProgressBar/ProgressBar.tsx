import { getPercentWidthClass } from "@/utils";

export interface ProgressBarProps {
  percent: number;
  barColor: string;
  trackColor?: string;
  height?: string;
}

export function ProgressBar({
  percent,
  barColor,
  trackColor = "bg-[#F4F4F5]",
  height = "h-2",
}: ProgressBarProps) {
  const widthClassName = getPercentWidthClass(percent);

  return (
    <div className={`w-full ${height} ${trackColor} rounded overflow-hidden`}>
      <div className={`h-full rounded ${barColor} ${widthClassName}`} />
    </div>
  );
}

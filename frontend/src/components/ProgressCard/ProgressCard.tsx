import { memo, type ReactNode } from "react";
import { ProgressSection } from "@/components";

export interface ProgressCardProps {
  topLeft: ReactNode;
  topRight?: ReactNode;
  percent: number;
  barColor: string;
  trackColor?: string;
  barHeight?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftLabelClassName?: string;
  rightLabelClassName?: string;
  bg?: string;
  rounded?: string;
  padding?: string;
  onClick?: () => void;
  className?: string;
}

export const ProgressCard = memo(function ProgressCard({
  topLeft,
  topRight,
  percent,
  barColor,
  trackColor,
  barHeight,
  leftLabel,
  rightLabel,
  leftLabelClassName,
  rightLabelClassName,
  bg = "bg-[var(--surface-muted)]",
  rounded = "rounded-[20px]",
  padding = "p-5",
  onClick,
  className = "",
}: ProgressCardProps) {
  const classes = `flex flex-col gap-4 ${bg} ${rounded} ${padding} text-left ${className}`;

  const content = (
    <>
      <div className="flex items-center justify-between w-full">
        {topLeft}
        {topRight}
      </div>
      <ProgressSection
        percent={percent}
        barColor={barColor}
        trackColor={trackColor}
        barHeight={barHeight}
        leftLabel={leftLabel}
        rightLabel={rightLabel}
        leftLabelClassName={leftLabelClassName}
        rightLabelClassName={rightLabelClassName}
      />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
});

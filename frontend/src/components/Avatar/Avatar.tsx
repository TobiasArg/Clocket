import { memo } from "react";

export interface AvatarProps {
  initials: string;
  bg?: string;
  size?: string;
  textColor?: string;
  textSize?: string;
  fontWeight?: string;
  className?: string;
}

export const Avatar = memo(function Avatar({
  initials,
  bg = "bg-[var(--text-primary)]",
  size = "w-[44px] h-[44px]",
  textColor = "text-[var(--panel-bg)]",
  textSize = "text-sm",
  fontWeight = "font-semibold",
  className = "",
}: AvatarProps) {
  return (
    <div className={`flex items-center justify-center ${size} rounded-full ${bg} ${className}`}>
      <span className={`${fontWeight} ${textSize} ${textColor}`}>{initials}</span>
    </div>
  );
});

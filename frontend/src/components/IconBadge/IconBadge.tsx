import { PhosphorIcon } from "@/components";

export interface IconBadgeProps {
  icon: string;
  bg?: string;
  iconColor?: string;
  iconSize?: string;
  size?: string;
  rounded?: string;
  className?: string;
}

export function IconBadge({
  icon,
  bg = "bg-[var(--text-primary)]",
  iconColor = "text-[var(--panel-bg)]",
  iconSize = "text-[20px]",
  size = "w-[44px] h-[44px]",
  rounded = "rounded-xl",
  className = "",
}: IconBadgeProps) {
  return (
    <div className={`flex items-center justify-center ${size} ${rounded} ${bg} ${className}`}>
      <PhosphorIcon name={icon} className={iconColor} size={iconSize} />
    </div>
  );
}

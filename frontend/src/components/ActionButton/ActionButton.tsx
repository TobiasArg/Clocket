import { memo } from "react";
import { PhosphorIcon } from "@/components";

export interface ActionButtonProps {
  type?: "button" | "submit" | "reset";
  icon?: string;
  label: string;
  iconColor?: string;
  labelColor?: string;
  bg?: string;
  rounded?: string;
  padding?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ActionButton = memo(function ActionButton({
  type = "button",
  icon,
  label,
  iconColor = "text-[var(--text-primary)]",
  labelColor = "text-[var(--text-primary)]",
  bg = "bg-[var(--surface-muted)]",
  rounded = "rounded-2xl",
  padding = "px-5 py-4",
  onClick,
  disabled = false,
  className = "",
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 w-full ${bg} ${rounded} ${padding} ${className}`}
    >
      {icon && <PhosphorIcon name={icon} className={iconColor} />}
      <span className={`text-base font-semibold ${labelColor}`}>{label}</span>
    </button>
  );
});

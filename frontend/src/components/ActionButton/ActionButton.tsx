import { PhosphorIcon } from "@/components";

export interface ActionButtonProps {
  icon?: string;
  label: string;
  iconColor?: string;
  labelColor?: string;
  bg?: string;
  rounded?: string;
  padding?: string;
  onClick?: () => void;
  className?: string;
}

export function ActionButton({
  icon,
  label,
  iconColor = "text-black",
  labelColor = "text-black",
  bg = "bg-[#F4F4F5]",
  rounded = "rounded-2xl",
  padding = "px-5 py-4",
  onClick,
  className = "",
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 w-full ${bg} ${rounded} ${padding} ${className}`}
    >
      {icon && <PhosphorIcon name={icon} className={iconColor} />}
      <span className={`text-base font-semibold ${labelColor}`}>{label}</span>
    </button>
  );
}

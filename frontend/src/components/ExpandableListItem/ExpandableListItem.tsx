import type { ReactNode } from "react";
import { PhosphorIcon } from "@/components";

export interface ExpandableListItemProps {
  left: ReactNode;
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
  className?: string;
}

export function ExpandableListItem({
  left,
  title,
  subtitle,
  titleClassName = "text-base font-semibold text-black font-['Outfit']",
  subtitleClassName = "text-xs font-medium text-[#71717A]",
  isExpanded = false,
  onToggle,
  children,
  className = "",
}: ExpandableListItemProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 py-4 text-left"
      >
        {left}
        <div className="flex flex-col gap-0.5 flex-1">
          <span className={titleClassName}>{title}</span>
          {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
        </div>
        <PhosphorIcon
          name={isExpanded ? "caret-down" : "caret-right"}
          className="text-[#71717A]"
        />
      </button>
      {isExpanded && children}
    </div>
  );
}

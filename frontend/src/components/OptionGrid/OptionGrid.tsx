import { memo } from "react";
import type { GridOption } from "@/types";
import { PhosphorIcon } from "@/components";

export interface OptionGridProps {
  rows: GridOption[][];
  onOptionClick?: (rowIndex: number, optionIndex: number) => void;
  buttonBg?: string;
  buttonRounded?: string;
  buttonHeight?: string;
  iconSize?: string;
  iconColor?: string;
  labelClassName?: string;
  className?: string;
}

export const OptionGrid = memo(function OptionGrid({
  rows,
  onOptionClick,
  buttonBg = "bg-[var(--text-primary)]",
  buttonRounded = "rounded-3xl",
  buttonHeight = "h-[160px]",
  iconSize = "text-[40px]",
  iconColor = "text-[var(--panel-bg)]",
  labelClassName = "text-base font-semibold text-[var(--panel-bg)] font-['Outfit']",
  className = "",
}: OptionGridProps) {
  const navigateToPath = (to: string): void => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname === to) {
      return;
    }

    window.history.pushState(null, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {rows.map((row, ri) => (
        <div key={row.map((o) => o.label).join("-")} className="flex gap-4">
          {row.map((option, oi) => {
            const className = `flex flex-col items-center justify-center gap-3 ${buttonBg} ${buttonRounded} ${buttonHeight} p-5 flex-1`;

            if (option.to) {
              return (
                <a
                  key={option.label}
                  href={option.to}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToPath(option.to ?? "/home");
                    onOptionClick?.(ri, oi);
                  }}
                  className={className}
                >
                  <PhosphorIcon name={option.icon} size={iconSize} className={iconColor} />
                  <span className={labelClassName}>{option.label}</span>
                </a>
              );
            }

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onOptionClick?.(ri, oi)}
                className={className}
              >
                <PhosphorIcon name={option.icon} size={iconSize} className={iconColor} />
                <span className={labelClassName}>{option.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

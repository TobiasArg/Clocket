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

export function OptionGrid({
  rows,
  onOptionClick,
  buttonBg = "bg-black",
  buttonRounded = "rounded-3xl",
  buttonHeight = "h-[160px]",
  iconSize = "text-[40px]",
  iconColor = "text-white",
  labelClassName = "text-base font-semibold text-white font-['Outfit']",
  className = "",
}: OptionGridProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {rows.map((row, ri) => (
        <div key={row.map((o) => o.label).join("-")} className="flex gap-4">
          {row.map((option, oi) => (
            <button
              key={option.label}
              type="button"
              onClick={() => onOptionClick?.(ri, oi)}
              className={`flex flex-col items-center justify-center gap-3 ${buttonBg} ${buttonRounded} ${buttonHeight} p-5 flex-1`}
            >
              <PhosphorIcon name={option.icon} size={iconSize} className={iconColor} />
              <span className={labelClassName}>{option.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

import type { GridOption } from "@/types";
import { OptionGrid } from "@/components";

export interface MoreOptionsWidgetProps {
  className?: string;
  onOptionClick?: (rowIndex: number, optionIndex: number) => void;
  rows?: GridOption[][];
}

export function MoreOptionsWidget({
  className = "rounded-3xl",
  onOptionClick,
  rows = [],
}: MoreOptionsWidgetProps) {
  return (
    <OptionGrid
      rows={rows}
      onOptionClick={onOptionClick}
      buttonBg="bg-white border border-[#E4E4E7]"
      iconColor="text-[#3F3F46]"
      labelClassName="text-base font-semibold text-[#27272A] font-['Outfit']"
      className={className}
    />
  );
}

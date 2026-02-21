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
      buttonBg="bg-[var(--panel-bg)] border border-[var(--surface-border)]"
      iconColor="text-[var(--text-secondary)]"
      labelClassName="text-base font-semibold text-[var(--text-primary)] font-['Outfit']"
      className={className}
    />
  );
}

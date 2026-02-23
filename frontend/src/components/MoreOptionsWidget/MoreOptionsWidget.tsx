import type { GridOption } from "@/types";
import { OptionGrid } from "@/components";

export interface MoreOptionsWidgetProps {
  className?: string;
  onOptionClick?: (rowIndex: number, optionIndex: number) => void;
  rows?: GridOption[][];
}

export function MoreOptionsWidget({
  className = "",
  onOptionClick,
  rows = [],
}: MoreOptionsWidgetProps) {
  const flattenedRows = rows.flatMap((row, originalRowIndex) =>
    row.map((option, originalOptionIndex) => ({
      option,
      originalRowIndex,
      originalOptionIndex,
    })),
  );
  const rowsInSingleColumn = flattenedRows.map(({ option }) => [option]);

  return (
    <OptionGrid
      rows={rowsInSingleColumn}
      onOptionClick={(singleColumnRowIndex) => {
        const source = flattenedRows[singleColumnRowIndex];
        if (!source) {
          return;
        }
        onOptionClick?.(source.originalRowIndex, source.originalOptionIndex);
      }}
      buttonBg="clocket-glass-card bg-[var(--panel-bg)]"
      buttonRounded="rounded-2xl"
      buttonHeight="h-[112px]"
      iconSize="text-[32px]"
      iconColor="text-[var(--text-secondary)]"
      labelClassName="text-base font-semibold text-[var(--text-primary)] font-['Outfit']"
      className={className}
    />
  );
}

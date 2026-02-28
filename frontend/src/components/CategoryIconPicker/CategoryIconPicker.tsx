import { memo } from "react";
import { PhosphorIcon } from "@/components";

export interface CategoryIconPickerProps {
  options?: string[];
  selectedIcon?: string;
  onChange?: (value: string) => void;
  label?: string;
  showValidation?: boolean;
  isValid?: boolean;
  errorLabel?: string;
}

export const CategoryIconPicker = memo(function CategoryIconPicker({
  options = [],
  selectedIcon = "",
  onChange,
  label = "Ícono",
  showValidation = false,
  isValid = true,
  errorLabel = "Selecciona un ícono.",
}: CategoryIconPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      <div className="grid grid-cols-4 gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-2">
        {options.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange?.(iconName)}
              className={`flex h-10 items-center justify-center rounded-lg border ${
                isSelected
                  ? "border-[var(--text-primary)] bg-[var(--surface-muted)]"
                  : "border-[var(--surface-border)]"
              }`}
              aria-label={`Seleccionar ícono ${iconName}`}
            >
              <PhosphorIcon name={iconName} size="text-[18px]" className="text-[var(--text-primary)]" />
            </button>
          );
        })}
      </div>
      {showValidation && !isValid && (
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">{errorLabel}</span>
      )}
    </div>
  );
});

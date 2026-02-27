import { memo } from "react";
export interface CategoryColorPickerOption {
  key: string;
  label: string;
  swatchClass: string;
}

export interface CategoryColorPickerProps {
  options?: CategoryColorPickerOption[];
  selectedColorKey?: string;
  onChange?: (value: string) => void;
  label?: string;
  showValidation?: boolean;
  isValid?: boolean;
  errorLabel?: string;
}

export const CategoryColorPicker = memo(function CategoryColorPicker({
  options = [],
  selectedColorKey = "",
  onChange,
  label = "Color",
  showValidation = false,
  isValid = true,
  errorLabel = "Selecciona un color.",
}: CategoryColorPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      <div className="grid grid-cols-8 gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-2">
        {options.map((color) => {
          const isSelected = selectedColorKey === color.key;
          return (
            <button
              key={color.key}
              type="button"
              title={color.label}
              onClick={() => onChange?.(color.key)}
              className={`h-7 w-7 rounded-full border-2 ${color.swatchClass} ${
                isSelected ? "border-[var(--text-primary)]" : "border-[var(--surface-border)]"
              }`}
              aria-label={`Seleccionar color ${color.label}`}
            />
          );
        })}
      </div>
      {showValidation && !isValid && (
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">{errorLabel}</span>
      )}
    </div>
  );
});

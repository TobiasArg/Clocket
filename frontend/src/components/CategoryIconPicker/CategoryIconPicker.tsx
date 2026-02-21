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

export function CategoryIconPicker({
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
      <span className="text-xs font-medium text-[#52525B]">{label}</span>
      <div className="grid grid-cols-4 gap-2 rounded-xl border border-[#E4E4E7] bg-white p-2">
        {options.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange?.(iconName)}
              className={`flex h-10 items-center justify-center rounded-lg border ${
                isSelected ? "border-black bg-[#F4F4F5]" : "border-[#E4E4E7]"
              }`}
              aria-label={`Seleccionar ícono ${iconName}`}
            >
              <PhosphorIcon name={iconName} size="text-[18px]" className="text-black" />
            </button>
          );
        })}
      </div>
      {showValidation && !isValid && (
        <span className="text-[11px] font-medium text-[#71717A]">{errorLabel}</span>
      )}
    </div>
  );
}

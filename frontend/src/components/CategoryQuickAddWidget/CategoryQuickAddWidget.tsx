import { ActionButton } from "@/components";

export interface CategoryQuickAddWidgetProps {
  nameErrorLabel?: string;
  isCategoryNameValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onNameInputChange?: (value: string) => void;
  onSubmit?: () => void;
  showValidation?: boolean;
  submitLabel?: string;
  title?: string;
}

export function CategoryQuickAddWidget({
  nameErrorLabel = "Agrega un nombre corto.",
  isCategoryNameValid = false,
  isLoading = false,
  isOpen = false,
  nameInput = "",
  nameLabel = "Nombre",
  namePlaceholder = "Ej. Salud",
  onNameInputChange,
  onSubmit,
  showValidation = false,
  submitLabel = "Guardar categoría",
  title = "Nueva categoría",
}: CategoryQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
      <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
        {title}
      </span>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{nameLabel}</span>
        <input
          type="text"
          value={nameInput}
          onChange={(event) => onNameInputChange?.(event.target.value)}
          placeholder={namePlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isCategoryNameValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {nameErrorLabel}
          </span>
        )}
      </label>

      <ActionButton
        icon="plus"
        label={submitLabel}
        iconColor="text-[#18181B]"
        labelColor="text-[#18181B]"
        bg={isCategoryNameValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
        padding="px-4 py-3"
        className={isCategoryNameValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
        onClick={onSubmit}
      />
    </div>
  );
}

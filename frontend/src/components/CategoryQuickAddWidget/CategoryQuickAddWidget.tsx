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
    <div className="flex flex-col gap-3 bg-[var(--surface-muted)] rounded-2xl p-4">
      <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
        {title}
      </span>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{nameLabel}</span>
        <input
          type="text"
          value={nameInput}
          onChange={(event) => onNameInputChange?.(event.target.value)}
          placeholder={namePlaceholder}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
        />
        {showValidation && !isCategoryNameValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {nameErrorLabel}
          </span>
        )}
      </label>

      <ActionButton
        icon="plus"
        label={submitLabel}
        iconColor="text-[var(--text-primary)]"
        labelColor="text-[var(--text-primary)]"
        bg={isCategoryNameValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
        padding="px-4 py-3"
        className={isCategoryNameValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
        onClick={onSubmit}
      />
    </div>
  );
}

import { memo } from "react";
import { ActionButton } from "../ActionButton/ActionButton";
import { CategoryColorPicker, type CategoryColorPickerOption } from "../CategoryColorPicker/CategoryColorPicker";
import { CategoryIconPicker } from "../CategoryIconPicker/CategoryIconPicker";
import { IconBadge } from "../IconBadge/IconBadge";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

export interface CategoryQuickAddWidgetProps {
  colorOptions?: CategoryColorPickerOption[];
  colorLabel?: string;
  colorErrorLabel?: string;
  iconOptions?: string[];
  iconLabel?: string;
  iconErrorLabel?: string;
  nameErrorLabel?: string;
  isCategoryNameValid?: boolean;
  isColorValid?: boolean;
  isFormValid?: boolean;
  isIconValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onColorChange?: (value: string) => void;
  onIconChange?: (value: string) => void;
  onNameInputChange?: (value: string) => void;
  onRequestClose?: () => void;
  onSubmit?: () => void;
  selectedColorKey?: string;
  selectedIcon?: string;
  showValidation?: boolean;
  submitLabel?: string;
  title?: string;
}

export const CategoryQuickAddWidget = memo(function CategoryQuickAddWidget({
  colorOptions = [],
  colorLabel = "Color",
  colorErrorLabel = "Selecciona un color.",
  iconOptions = [],
  iconLabel = "Ícono",
  iconErrorLabel = "Selecciona un ícono.",
  nameErrorLabel = "Agrega un nombre corto.",
  isCategoryNameValid = false,
  isColorValid = false,
  isFormValid = false,
  isIconValid = false,
  isLoading = false,
  isOpen = false,
  nameInput = "",
  nameLabel = "Nombre",
  namePlaceholder = "Ej. Salud",
  onColorChange,
  onIconChange,
  onNameInputChange,
  onRequestClose,
  onSubmit,
  selectedColorKey = "",
  selectedIcon = "",
  showValidation = false,
  submitLabel = "Guardar categoría",
  title = "Nueva categoría",
}: CategoryQuickAddWidgetProps) {
  const previewName = nameInput.trim().length > 0 ? nameInput.trim() : "Vista previa";
  const previewIcon = selectedIcon.trim().length > 0 ? selectedIcon : "tag";
  const previewColorClass = colorOptions.find((option) => option.key === selectedColorKey)?.swatchClass
    ?? "bg-[#71717A]";

  return (
    <SlideUpSheet
      isOpen={isOpen}
      title={title}
      onRequestClose={onRequestClose}
      onSubmit={onSubmit}
      backdropAriaLabel="Cerrar formulario de categoría"
      handleAriaLabel="Desliza hacia arriba para cerrar"
      footer={(
        <ActionButton
          type="submit"
          icon="plus"
          label={isLoading ? "Guardando..." : submitLabel}
          iconColor="text-[var(--text-primary)]"
          labelColor="text-[var(--text-primary)]"
          bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-70"}
          disabled={!isFormValid || isLoading}
        />
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="clocket-glass-card flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-3">
          <IconBadge
            icon={previewIcon}
            bg={previewColorClass}
            size="h-[40px] w-[40px]"
            rounded="rounded-xl"
          />
          <div className="min-w-0">
            <span className="block truncate font-['Outfit'] text-sm font-semibold text-[var(--text-primary)]">{previewName}</span>
            <span className="block text-xs font-medium text-[var(--text-secondary)]">Categoría</span>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{nameLabel}</span>
          <input
            type="text"
            value={nameInput}
            onChange={(event) => onNameInputChange?.(event.target.value)}
            placeholder={namePlaceholder}
            className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
          />
          {showValidation && !isCategoryNameValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{nameErrorLabel}</span>
          )}
        </label>

        <CategoryIconPicker
          options={iconOptions}
          selectedIcon={selectedIcon}
          onChange={onIconChange}
          label={iconLabel}
          showValidation={showValidation}
          isValid={isIconValid}
          errorLabel={iconErrorLabel}
        />

        <CategoryColorPicker
          options={colorOptions}
          selectedColorKey={selectedColorKey}
          onChange={onColorChange}
          label={colorLabel}
          showValidation={showValidation}
          isValid={isColorValid}
          errorLabel={colorErrorLabel}
        />
      </div>
    </SlideUpSheet>
  );
});

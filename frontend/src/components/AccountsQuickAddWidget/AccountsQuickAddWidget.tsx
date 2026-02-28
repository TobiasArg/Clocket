import { memo } from "react";
import { ActionButton } from "../ActionButton/ActionButton";
import { CategoryIconPicker } from "../CategoryIconPicker/CategoryIconPicker";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

export interface AccountsQuickAddWidgetProps {
  balanceErrorLabel?: string;
  balanceInput?: string;
  balanceLabel?: string;
  balancePlaceholder?: string;
  iconErrorLabel?: string;
  iconLabel?: string;
  iconOptions?: string[];
  isBalanceValid?: boolean;
  isFormValid?: boolean;
  isIconValid?: boolean;
  isLoading?: boolean;
  isNameValid?: boolean;
  isOpen?: boolean;
  nameErrorLabel?: string;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onBalanceChange?: (value: string) => void;
  onIconChange?: (value: string) => void;
  onNameChange?: (value: string) => void;
  onRequestClose?: () => void;
  onSubmit?: () => void;
  selectedIcon?: string;
  showValidation?: boolean;
  submitLabel?: string;
  title?: string;
}

export const AccountsQuickAddWidget = memo(function AccountsQuickAddWidget({
  balanceErrorLabel = "Ingresa un balance válido.",
  balanceInput = "",
  balanceLabel = "Balance inicial",
  balancePlaceholder = "0.00",
  iconErrorLabel = "Selecciona un ícono para la cuenta.",
  iconLabel = "Ícono",
  iconOptions = [],
  isBalanceValid = false,
  isFormValid = false,
  isIconValid = false,
  isLoading = false,
  isNameValid = false,
  isOpen = false,
  nameErrorLabel = "Agrega un nombre de cuenta.",
  nameInput = "",
  nameLabel = "Nombre de la cuenta",
  namePlaceholder = "Ej. Cuenta principal",
  onBalanceChange,
  onIconChange,
  onNameChange,
  onRequestClose,
  onSubmit,
  selectedIcon = "",
  showValidation = false,
  submitLabel = "Guardar cuenta",
  title = "Nueva cuenta",
}: AccountsQuickAddWidgetProps) {
  return (
    <SlideUpSheet
      isOpen={isOpen}
      title={title}
      onRequestClose={onRequestClose}
      onSubmit={onSubmit}
      backdropAriaLabel="Cerrar formulario de cuenta"
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
        <CategoryIconPicker
          options={iconOptions}
          selectedIcon={selectedIcon}
          onChange={onIconChange}
          label={iconLabel}
          showValidation={showValidation}
          isValid={isIconValid}
          errorLabel={iconErrorLabel}
        />

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{nameLabel}</span>
          <input
            type="text"
            value={nameInput}
            onChange={(event) => onNameChange?.(event.target.value)}
            placeholder={namePlaceholder}
            className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
          />
          {showValidation && !isNameValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {nameErrorLabel}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{balanceLabel}</span>
          <input
            type="number"
            step="0.01"
            value={balanceInput}
            onChange={(event) => onBalanceChange?.(event.target.value)}
            placeholder={balancePlaceholder}
            className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
          />
          {showValidation && !isBalanceValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {balanceErrorLabel}
            </span>
          )}
        </label>
      </div>
    </SlideUpSheet>
  );
});

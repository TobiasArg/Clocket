import { ActionButton } from "../ActionButton/ActionButton";

export interface AccountsQuickAddWidgetProps {
  balanceErrorLabel?: string;
  balanceInput?: string;
  balanceLabel?: string;
  balancePlaceholder?: string;
  isBalanceValid?: boolean;
  isFormValid?: boolean;
  isLoading?: boolean;
  isNameValid?: boolean;
  isOpen?: boolean;
  nameErrorLabel?: string;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onBalanceChange?: (value: string) => void;
  onNameChange?: (value: string) => void;
  onSubmit?: () => void;
  showValidation?: boolean;
  submitLabel?: string;
  title?: string;
}

export function AccountsQuickAddWidget({
  balanceErrorLabel = "Ingresa un balance válido.",
  balanceInput = "",
  balanceLabel = "Balance inicial",
  balancePlaceholder = "0.00",
  isBalanceValid = false,
  isFormValid = false,
  isLoading = false,
  isNameValid = false,
  isOpen = false,
  nameErrorLabel = "Agrega un nombre de cuenta.",
  nameInput = "",
  nameLabel = "Nombre de la cuenta",
  namePlaceholder = "Ej. Cuenta principal",
  onBalanceChange,
  onNameChange,
  onSubmit,
  showValidation = false,
  submitLabel = "Guardar cuenta",
  title = "Nueva cuenta",
}: AccountsQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#F4F4F5] p-4">
      <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
        {title}
      </span>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{nameLabel}</span>
        <input
          type="text"
          value={nameInput}
          onChange={(event) => onNameChange?.(event.target.value)}
          placeholder={namePlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isNameValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {nameErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{balanceLabel}</span>
        <input
          type="number"
          step="0.01"
          value={balanceInput}
          onChange={(event) => onBalanceChange?.(event.target.value)}
          placeholder={balancePlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isBalanceValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {balanceErrorLabel}
          </span>
        )}
      </label>

      <ActionButton
        icon="plus"
        label={submitLabel}
        iconColor="text-[#18181B]"
        labelColor="text-[#18181B]"
        bg={isFormValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
        padding="px-4 py-3"
        className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
        onClick={onSubmit}
      />
    </div>
  );
}

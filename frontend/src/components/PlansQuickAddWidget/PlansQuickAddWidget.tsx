import { ActionButton } from "@/components";
import type { TransactionInputCurrency } from "@/utils";

const getCurrentDateInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface PlansQuickAddWidgetProps {
  creationDateErrorLabel?: string;
  creationDateInput?: string;
  creationDateLabel?: string;
  installmentsCountInput?: string;
  installmentsErrorLabel?: string;
  installmentsLabel?: string;
  installmentsPlaceholder?: string;
  isFormValid?: boolean;
  isInstallmentsCountValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  isCreationDateValid?: boolean;
  selectedCurrency?: TransactionInputCurrency;
  isTotalAmountValid?: boolean;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onCreationDateChange?: (value: string) => void;
  onInstallmentsCountChange?: (value: string) => void;
  onNameChange?: (value: string) => void;
  onCurrencyChange?: (value: TransactionInputCurrency) => void;
  onSubmit?: () => void;
  onTotalAmountChange?: (value: string) => void;
  showValidation?: boolean;
  submitLabel?: string;
  title?: string;
  totalAmountErrorLabel?: string;
  totalAmountInput?: string;
  totalAmountLabel?: string;
  totalAmountPlaceholder?: string;
  currencyLabel?: string;
}

export function PlansQuickAddWidget({
  creationDateErrorLabel = "Usa una fecha válida que no sea futura.",
  creationDateInput = "",
  creationDateLabel = "Fecha de creación",
  installmentsCountInput = "",
  installmentsErrorLabel = "Usa al menos 1 cuota.",
  installmentsLabel = "Cantidad de cuotas",
  installmentsPlaceholder = "12",
  isFormValid = false,
  isInstallmentsCountValid = false,
  isLoading = false,
  isOpen = false,
  isCreationDateValid = false,
  selectedCurrency = "ARS",
  isTotalAmountValid = false,
  nameInput = "",
  nameLabel = "Título",
  namePlaceholder = "Ej. Notebook",
  onCreationDateChange,
  onInstallmentsCountChange,
  onNameChange,
  onCurrencyChange,
  onSubmit,
  onTotalAmountChange,
  showValidation = false,
  submitLabel = "Guardar cuota",
  title = "Nueva cuota",
  totalAmountErrorLabel = "Ingresa un monto mayor a 0.",
  totalAmountInput = "",
  totalAmountLabel = "Monto total",
  totalAmountPlaceholder = "0.00",
  currencyLabel = "Moneda",
}: PlansQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] p-4 bg-[var(--surface-muted)]">
      <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
        {title}
      </span>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{nameLabel}</span>
        <input
          type="text"
          value={nameInput}
          onChange={(event) => onNameChange?.(event.target.value)}
          placeholder={namePlaceholder}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{currencyLabel}</span>
        <select
          value={selectedCurrency}
          onChange={(event) => onCurrencyChange?.(event.target.value as TransactionInputCurrency)}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {totalAmountLabel}
        </span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={totalAmountInput}
          onChange={(event) => onTotalAmountChange?.(event.target.value)}
          placeholder={totalAmountPlaceholder}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
        />
        {showValidation && !isTotalAmountValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {totalAmountErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {installmentsLabel}
        </span>
        <input
          type="number"
          min="1"
          step="1"
          value={installmentsCountInput}
          onChange={(event) => onInstallmentsCountChange?.(event.target.value)}
          placeholder={installmentsPlaceholder}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
        />
        {showValidation && !isInstallmentsCountValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {installmentsErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {creationDateLabel}
        </span>
        <input
          type="date"
          max={getCurrentDateInputValue()}
          value={creationDateInput}
          onChange={(event) => onCreationDateChange?.(event.target.value)}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
        />
        {showValidation && !isCreationDateValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {creationDateErrorLabel}
          </span>
        )}
      </label>

      <ActionButton
        icon="plus"
        label={submitLabel}
        iconColor="text-[var(--text-primary)]"
        labelColor="text-[var(--text-primary)]"
        bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
        padding="px-4 py-3"
        className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
        onClick={onSubmit}
      />
    </div>
  );
}

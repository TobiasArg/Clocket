import { ActionButton } from "@/components";

export interface PlansQuickAddWidgetProps {
  installmentsCountInput?: string;
  installmentsErrorLabel?: string;
  installmentsLabel?: string;
  installmentsPlaceholder?: string;
  isFormValid?: boolean;
  isInstallmentsCountValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  isStartMonthValid?: boolean;
  isTotalAmountValid?: boolean;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onInstallmentsCountChange?: (value: string) => void;
  onNameChange?: (value: string) => void;
  onStartMonthChange?: (value: string) => void;
  onSubmit?: () => void;
  onTotalAmountChange?: (value: string) => void;
  showValidation?: boolean;
  startMonthErrorLabel?: string;
  startMonthInput?: string;
  startMonthLabel?: string;
  submitLabel?: string;
  title?: string;
  totalAmountErrorLabel?: string;
  totalAmountInput?: string;
  totalAmountLabel?: string;
  totalAmountPlaceholder?: string;
}

export function PlansQuickAddWidget({
  installmentsCountInput = "",
  installmentsErrorLabel = "Usa al menos 1 cuota.",
  installmentsLabel = "Cantidad de cuotas",
  installmentsPlaceholder = "12",
  isFormValid = false,
  isInstallmentsCountValid = false,
  isLoading = false,
  isOpen = false,
  isStartMonthValid = false,
  isTotalAmountValid = false,
  nameInput = "",
  nameLabel = "Título",
  namePlaceholder = "Ej. Notebook",
  onInstallmentsCountChange,
  onNameChange,
  onStartMonthChange,
  onSubmit,
  onTotalAmountChange,
  showValidation = false,
  startMonthErrorLabel = "Usa formato YYYY-MM.",
  startMonthInput = "",
  startMonthLabel = "Mes de inicio",
  submitLabel = "Guardar cuota",
  title = "Nueva cuota",
  totalAmountErrorLabel = "Ingresa un monto mayor a 0.",
  totalAmountInput = "",
  totalAmountLabel = "Monto total",
  totalAmountPlaceholder = "0.00",
}: PlansQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[20px] p-4 bg-[#F4F4F5]">
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
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">
          {totalAmountLabel}
        </span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={totalAmountInput}
          onChange={(event) => onTotalAmountChange?.(event.target.value)}
          placeholder={totalAmountPlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isTotalAmountValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {totalAmountErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">
          {installmentsLabel}
        </span>
        <input
          type="number"
          min="1"
          step="1"
          value={installmentsCountInput}
          onChange={(event) => onInstallmentsCountChange?.(event.target.value)}
          placeholder={installmentsPlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isInstallmentsCountValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {installmentsErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">
          {startMonthLabel}
        </span>
        <input
          type="month"
          value={startMonthInput}
          onChange={(event) => onStartMonthChange?.(event.target.value)}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isStartMonthValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {startMonthErrorLabel}
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

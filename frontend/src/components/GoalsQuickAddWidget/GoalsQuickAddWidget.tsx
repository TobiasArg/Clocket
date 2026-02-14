import { ActionButton } from "@/components";

export interface GoalsQuickAddWidgetProps {
  isFormValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  isTargetValid?: boolean;
  isTitleValid?: boolean;
  onSavedAmountChange?: (value: string) => void;
  onSubmit?: () => void;
  onTargetAmountChange?: (value: string) => void;
  onTargetMonthChange?: (value: string) => void;
  onTitleChange?: (value: string) => void;
  quickAddNameErrorLabel?: string;
  quickAddNameLabel?: string;
  quickAddSavedAmountLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddTargetAmountLabel?: string;
  quickAddTargetErrorLabel?: string;
  quickAddTargetMonthLabel?: string;
  savedAmountInput?: string;
  showValidation?: boolean;
  targetAmountInput?: string;
  targetMonthInput?: string;
  title?: string;
  titleInput?: string;
}

export function GoalsQuickAddWidget({
  isFormValid = false,
  isLoading = false,
  isOpen = false,
  isTargetValid = false,
  isTitleValid = false,
  onSavedAmountChange,
  onSubmit,
  onTargetAmountChange,
  onTargetMonthChange,
  onTitleChange,
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  quickAddNameLabel = "Nombre",
  quickAddSavedAmountLabel = "Ahorrado",
  quickAddSubmitLabel = "Guardar meta",
  quickAddTargetAmountLabel = "Meta",
  quickAddTargetErrorLabel = "La meta debe ser mayor a 0.",
  quickAddTargetMonthLabel = "Mes objetivo",
  savedAmountInput = "",
  showValidation = false,
  targetAmountInput = "",
  targetMonthInput = "",
  title = "Nueva meta",
  titleInput = "",
}: GoalsQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="px-5 pb-2">
      <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
        <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
          {title}
        </span>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
          <input
            type="text"
            value={titleInput}
            onChange={(event) => onTitleChange?.(event.target.value)}
            placeholder="Ej. Vacaciones"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
          {showValidation && !isTitleValid && (
            <span className="text-[11px] font-medium text-[#71717A]">{quickAddNameErrorLabel}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{quickAddTargetAmountLabel}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmountInput}
            onChange={(event) => onTargetAmountChange?.(event.target.value)}
            placeholder="0.00"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
          {showValidation && !isTargetValid && (
            <span className="text-[11px] font-medium text-[#71717A]">{quickAddTargetErrorLabel}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{quickAddSavedAmountLabel}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={savedAmountInput}
            onChange={(event) => onSavedAmountChange?.(event.target.value)}
            placeholder="0.00"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{quickAddTargetMonthLabel}</span>
          <input
            type="month"
            value={targetMonthInput}
            onChange={(event) => onTargetMonthChange?.(event.target.value)}
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
        </label>

        <ActionButton
          icon="plus"
          label={quickAddSubmitLabel}
          iconColor="text-[#18181B]"
          labelColor="text-[#18181B]"
          bg={isFormValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
}

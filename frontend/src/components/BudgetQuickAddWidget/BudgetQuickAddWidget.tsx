import type { BudgetCategoryOption } from "@/hooks";
import { ActionButton, PhosphorIcon } from "@/components";

export interface BudgetQuickAddWidgetProps {
  amountErrorLabel: string;
  amountLabel: string;
  categoryErrorLabel: string;
  categories: BudgetCategoryOption[];
  categoryLabel: string;
  isAmountValid: boolean;
  isCategoryValid: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isOpen: boolean;
  limitAmountInput: string;
  onBackClick?: () => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubmit: () => void;
  selectedCategoryId: string;
  showValidation: boolean;
  submitLabel: string;
  title: string;
}

export function BudgetQuickAddWidget({
  amountErrorLabel,
  amountLabel,
  categoryErrorLabel,
  categories,
  categoryLabel,
  isAmountValid,
  isCategoryValid,
  isFormValid,
  isLoading,
  isOpen,
  limitAmountInput,
  onBackClick,
  onAmountChange,
  onCategoryChange,
  onSubmit,
  selectedCategoryId,
  showValidation,
  submitLabel,
  title,
}: BudgetQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="px-5">
      <form
        className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D4D4D8] bg-white text-[#3F3F46]"
              aria-label="Volver"
            >
              <PhosphorIcon name="arrow-left" className="text-[#3F3F46]" />
            </button>
          )}
          <span className="block min-w-0 truncate text-[11px] font-semibold text-[#71717A] tracking-[1px]">
            {title}
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{categoryLabel}</span>
          <select
            value={selectedCategoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {showValidation && !isCategoryValid && (
            <span className="text-[11px] font-medium text-[#71717A]">
              {categoryErrorLabel}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{amountLabel}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={limitAmountInput}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0.00"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
          {showValidation && !isAmountValid && (
            <span className="text-[11px] font-medium text-[#71717A]">
              {amountErrorLabel}
            </span>
          )}
        </label>

        <ActionButton
          type="submit"
          icon="plus"
          label={isLoading ? "Guardando..." : submitLabel}
          iconColor="text-[#18181B]"
          labelColor="text-[#18181B]"
          bg={isFormValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#D4D4D8]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-60"}
          disabled={!isFormValid || isLoading}
        />
      </form>
    </div>
  );
}

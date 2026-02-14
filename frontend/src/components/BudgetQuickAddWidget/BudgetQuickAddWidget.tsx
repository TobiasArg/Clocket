import type { BudgetCategoryOption } from "@/hooks";
import { ActionButton } from "@/components";

export interface BudgetQuickAddWidgetProps {
  amountErrorLabel: string;
  amountLabel: string;
  categories: BudgetCategoryOption[];
  categoryLabel: string;
  isAmountValid: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  isOpen: boolean;
  limitAmountInput: string;
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
  categories,
  categoryLabel,
  isAmountValid,
  isFormValid,
  isLoading,
  isOpen,
  limitAmountInput,
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
      <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
        <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
          {title}
        </span>

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
    </div>
  );
}

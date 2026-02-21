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
        className="flex flex-col gap-3 bg-[var(--surface-muted)] rounded-2xl p-4"
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--panel-bg)] text-[var(--text-secondary)]"
              aria-label="Volver"
            >
              <PhosphorIcon name="arrow-left" className="text-[var(--text-secondary)]" />
            </button>
          )}
          <span className="block min-w-0 truncate text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
            {title}
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{categoryLabel}</span>
          <select
            value={selectedCategoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {showValidation && !isCategoryValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {categoryErrorLabel}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{amountLabel}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={limitAmountInput}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0.00"
            className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
          />
          {showValidation && !isAmountValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {amountErrorLabel}
            </span>
          )}
        </label>

        <ActionButton
          type="submit"
          icon="plus"
          label={isLoading ? "Guardando..." : submitLabel}
          iconColor="text-[var(--text-primary)]"
          labelColor="text-[var(--text-primary)]"
          bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-border)]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-60"}
          disabled={!isFormValid || isLoading}
        />
      </form>
    </div>
  );
}

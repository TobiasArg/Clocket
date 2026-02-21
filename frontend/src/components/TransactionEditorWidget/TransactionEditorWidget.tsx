import { ActionButton } from "@/components";
import type { AmountSign, TransactionsEditorMode } from "@/hooks";
import type { TransactionInputCurrency } from "@/utils";

export interface TransactionEditorWidgetProps {
  accountsError?: string | null;
  categoriesError?: string | null;
  descriptionInput?: string;
  editorMode?: TransactionsEditorMode;
  editingAmountSign?: AmountSign;
  editSubmitLabel?: string;
  editTitle?: string;
  isAccountValid?: boolean;
  isAccountsLoading?: boolean;
  isAmountValid?: boolean;
  isCategoriesLoading?: boolean;
  isFormValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  isDescriptionValid?: boolean;
  noAccountsLabel?: string;
  onAmountChange?: (value: string) => void;
  onCurrencyChange?: (value: TransactionInputCurrency) => void;
  onDescriptionChange?: (value: string) => void;
  onSelectedAccountIdChange?: (value: string) => void;
  onSelectedCategoryIdChange?: (value: string) => void;
  onSignChange?: (value: AmountSign) => void;
  onSubmit?: () => void;
  quickAddAccountErrorLabel?: string;
  quickAddAccountLabel?: string;
  quickAddAmountErrorLabel?: string;
  quickAddAmountLabel?: string;
  quickAddAmountPlaceholder?: string;
  quickAddCategoryLabel?: string;
  quickAddCurrencyLabel?: string;
  quickAddDescriptionErrorLabel?: string;
  quickAddDescriptionLabel?: string;
  quickAddDescriptionPlaceholder?: string;
  quickAddExpenseLabel?: string;
  quickAddIncomeLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddTitle?: string;
  quickAddTypeLabel?: string;
  selectedAccountId?: string;
  selectedCurrency?: TransactionInputCurrency;
  selectedCategoryId?: string;
  showValidation?: boolean;
  sortedAccounts?: Array<{ id: string; name: string }>;
  sortedCategories?: Array<{ id: string; name: string }>;
  uncategorizedAccountLabel?: string;
  uncategorizedLabel?: string;
  amountInput?: string;
}

export function TransactionEditorWidget({
  accountsError = null,
  amountInput = "",
  categoriesError = null,
  descriptionInput = "",
  editorMode = null,
  editingAmountSign = "-",
  editSubmitLabel = "Guardar cambios",
  editTitle = "Editar transacción",
  isAccountValid = false,
  isAccountsLoading = false,
  isAmountValid = false,
  isCategoriesLoading = false,
  isDescriptionValid = false,
  isFormValid = false,
  isLoading = false,
  isOpen = false,
  noAccountsLabel = "Crea una cuenta en Más > Cuentas para registrar transacciones.",
  onAmountChange,
  onCurrencyChange,
  onDescriptionChange,
  onSelectedAccountIdChange,
  onSelectedCategoryIdChange,
  onSignChange,
  onSubmit,
  quickAddAccountErrorLabel = "Selecciona una cuenta.",
  quickAddAccountLabel = "Cuenta",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  quickAddAmountLabel = "Monto",
  quickAddAmountPlaceholder = "0.00",
  quickAddCategoryLabel = "Categoría",
  quickAddCurrencyLabel = "Moneda",
  quickAddDescriptionErrorLabel = "Agrega una descripción corta.",
  quickAddDescriptionLabel = "Descripción",
  quickAddDescriptionPlaceholder = "Ej. Café, Uber, supermercado",
  quickAddExpenseLabel = "Egreso",
  quickAddIncomeLabel = "Ingreso",
  quickAddSubmitLabel = "Agregar transacción",
  quickAddTitle = "Quick Add",
  quickAddTypeLabel = "Tipo",
  selectedAccountId = "",
  selectedCurrency = "ARS",
  selectedCategoryId = "",
  showValidation = false,
  sortedAccounts = [],
  sortedCategories = [],
  uncategorizedAccountLabel = "Sin cuenta",
  uncategorizedLabel = "Uncategorized",
}: TransactionEditorWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 bg-[var(--surface-muted)] rounded-2xl p-4">
      <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
        {editorMode === "create" ? quickAddTitle : editTitle}
      </span>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddTypeLabel}</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSignChange?.("-")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              editingAmountSign === "-"
                ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
            }`}
          >
            {quickAddExpenseLabel}
          </button>
          <button
            type="button"
            onClick={() => onSignChange?.("+")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              editingAmountSign === "+"
                ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
            }`}
          >
            {quickAddIncomeLabel}
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddAmountLabel}</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amountInput}
          onChange={(event) => onAmountChange?.(event.target.value)}
          placeholder={quickAddAmountPlaceholder}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isAmountValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {quickAddAmountErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddCurrencyLabel}</span>
        <select
          value={selectedCurrency}
          onChange={(event) => onCurrencyChange?.(event.target.value as TransactionInputCurrency)}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddDescriptionLabel}</span>
        <input
          type="text"
          value={descriptionInput}
          onChange={(event) => onDescriptionChange?.(event.target.value)}
          placeholder={quickAddDescriptionPlaceholder}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isDescriptionValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {quickAddDescriptionErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddAccountLabel}</span>
        <select
          value={selectedAccountId}
          onChange={(event) => onSelectedAccountIdChange?.(event.target.value)}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
        >
          <option value="">{uncategorizedAccountLabel}</option>
          {sortedAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {showValidation && !isAccountValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {quickAddAccountErrorLabel}
          </span>
        )}
        {isAccountsLoading && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            Cargando cuentas...
          </span>
        )}
        {accountsError && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            No pudimos cargar las cuentas.
          </span>
        )}
        {!isAccountsLoading && sortedAccounts.length === 0 && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {noAccountsLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddCategoryLabel}</span>
        <select
          value={selectedCategoryId}
          onChange={(event) => onSelectedCategoryIdChange?.(event.target.value)}
          className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
        >
          <option value="">{uncategorizedLabel}</option>
          {sortedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {isCategoriesLoading && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            Cargando categorías...
          </span>
        )}
        {categoriesError && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            No pudimos cargar las categorías.
          </span>
        )}
      </label>

      <ActionButton
        icon={editorMode === "create" ? "plus" : "check"}
        label={editorMode === "create" ? quickAddSubmitLabel : editSubmitLabel}
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

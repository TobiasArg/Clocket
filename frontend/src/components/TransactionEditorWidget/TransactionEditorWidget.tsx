import { ActionButton } from "@/components";
import type { AmountSign, TransactionsEditorMode } from "@/hooks";
import type { TransactionInputCurrency, TransactionItem } from "@/utils";

export interface TransactionEditorWidgetProps {
  accountsError?: string | null;
  categoriesError?: string | null;
  deleteActionLabel?: string;
  deleteCancelLabel?: string;
  deleteConfirmHint?: string;
  deleteConfirmLabel?: string;
  deleteConfirmTitle?: string;
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
  isSelectedTransactionAvailable?: boolean;
  isDescriptionValid?: boolean;
  noAccountsLabel?: string;
  onAmountChange?: (value: string) => void;
  onCurrencyChange?: (value: TransactionInputCurrency) => void;
  onDelete?: () => void;
  onDescriptionChange?: (value: string) => void;
  onSelectedAccountIdChange?: (value: string) => void;
  onSelectedCategoryIdChange?: (value: string) => void;
  onSignChange?: (value: AmountSign) => void;
  onSubmit?: () => void;
  onToggleDeleteConfirm?: (value: boolean) => void;
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
  selectedTransaction?: TransactionItem | null;
  showDeleteConfirm?: boolean;
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
  deleteActionLabel = "Delete",
  deleteCancelLabel = "Cancel",
  deleteConfirmHint = "This can’t be undone.",
  deleteConfirmLabel = "Delete",
  deleteConfirmTitle = "Delete this transaction?",
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
  isSelectedTransactionAvailable = false,
  noAccountsLabel = "Crea una cuenta en Más > Cuentas para registrar transacciones.",
  onAmountChange,
  onCurrencyChange,
  onDelete,
  onDescriptionChange,
  onSelectedAccountIdChange,
  onSelectedCategoryIdChange,
  onSignChange,
  onSubmit,
  onToggleDeleteConfirm,
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
  selectedTransaction = null,
  showDeleteConfirm = false,
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
    <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
      <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
        {editorMode === "create" ? quickAddTitle : editTitle}
      </span>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{quickAddTypeLabel}</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSignChange?.("-")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              editingAmountSign === "-"
                ? "bg-[#E4E4E7] text-[#18181B]"
                : "bg-white text-[#52525B]"
            }`}
          >
            {quickAddExpenseLabel}
          </button>
          <button
            type="button"
            onClick={() => onSignChange?.("+")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              editingAmountSign === "+"
                ? "bg-[#E4E4E7] text-[#18181B]"
                : "bg-white text-[#52525B]"
            }`}
          >
            {quickAddIncomeLabel}
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{quickAddAmountLabel}</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amountInput}
          onChange={(event) => onAmountChange?.(event.target.value)}
          placeholder={quickAddAmountPlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isAmountValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {quickAddAmountErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{quickAddCurrencyLabel}</span>
        <select
          value={selectedCurrency}
          onChange={(event) => onCurrencyChange?.(event.target.value as TransactionInputCurrency)}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{quickAddDescriptionLabel}</span>
        <input
          type="text"
          value={descriptionInput}
          onChange={(event) => onDescriptionChange?.(event.target.value)}
          placeholder={quickAddDescriptionPlaceholder}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        />
        {showValidation && !isDescriptionValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {quickAddDescriptionErrorLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{quickAddAccountLabel}</span>
        <select
          value={selectedAccountId}
          onChange={(event) => onSelectedAccountIdChange?.(event.target.value)}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        >
          <option value="">{uncategorizedAccountLabel}</option>
          {sortedAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {showValidation && !isAccountValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {quickAddAccountErrorLabel}
          </span>
        )}
        {isAccountsLoading && (
          <span className="text-[11px] font-medium text-[#71717A]">
            Cargando cuentas...
          </span>
        )}
        {accountsError && (
          <span className="text-[11px] font-medium text-[#71717A]">
            No pudimos cargar las cuentas.
          </span>
        )}
        {!isAccountsLoading && sortedAccounts.length === 0 && (
          <span className="text-[11px] font-medium text-[#71717A]">
            {noAccountsLabel}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[#52525B]">{quickAddCategoryLabel}</span>
        <select
          value={selectedCategoryId}
          onChange={(event) => onSelectedCategoryIdChange?.(event.target.value)}
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
        >
          <option value="">{uncategorizedLabel}</option>
          {sortedCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {isCategoriesLoading && (
          <span className="text-[11px] font-medium text-[#71717A]">
            Cargando categorías...
          </span>
        )}
        {categoriesError && (
          <span className="text-[11px] font-medium text-[#71717A]">
            No pudimos cargar las categorías.
          </span>
        )}
      </label>

      <ActionButton
        icon={editorMode === "create" ? "plus" : "check"}
        label={editorMode === "create" ? quickAddSubmitLabel : editSubmitLabel}
        iconColor="text-[#18181B]"
        labelColor="text-[#18181B]"
        bg={isFormValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
        padding="px-4 py-3"
        className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
        onClick={onSubmit}
      />

      {editorMode === "edit" && isSelectedTransactionAvailable && selectedTransaction && (
        <div className="flex flex-col gap-2">
          {!showDeleteConfirm && (
            <button
              type="button"
              onClick={() => onToggleDeleteConfirm?.(true)}
              className="w-fit text-xs font-medium text-[#71717A]"
            >
              {deleteActionLabel}
            </button>
          )}

          {showDeleteConfirm && (
            <div className="rounded-xl bg-white px-3 py-3 flex flex-col gap-2">
              <span className="text-xs font-semibold text-black">{deleteConfirmTitle}</span>
              <span className="text-xs font-medium text-[#71717A]">{deleteConfirmHint}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleDeleteConfirm?.(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] text-xs font-medium text-[#52525B]"
                >
                  {deleteCancelLabel}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-lg bg-[#E4E4E7] text-xs font-medium text-[#18181B]"
                >
                  {deleteConfirmLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

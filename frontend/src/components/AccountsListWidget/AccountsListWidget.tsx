import { CardSection } from "@/components";
import { AccountSwipeDeleteRow } from "./AccountSwipeDeleteRow";
import type { AccountFlow } from "@/hooks";

export interface AccountsListWidgetProps {
  accountFlowsById?: Map<string, AccountFlow>;
  accounts?: Array<{ id: string; name: string; balance: number; updatedAt: string }>;
  deleteActionLabel?: string;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  incomeLabel?: string;
  expenseLabel?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  onDeleteAccount?: (accountId: string) => void;
  pendingDeleteAccountId?: string | null;
  updatedPrefix?: string;
}

export function AccountsListWidget({
  accountFlowsById = new Map<string, AccountFlow>(),
  accounts = [],
  deleteActionLabel = "Eliminar",
  emptyHint = "Crea tu primera cuenta para organizar tu balance.",
  emptyTitle = "No hay cuentas",
  errorLabel = "No pudimos cargar las cuentas. Intenta nuevamente.",
  hasError = false,
  incomeLabel = "Ing.",
  expenseLabel = "Gas.",
  isLoading = false,
  loadingLabel = "Cargando cuentas...",
  onDeleteAccount,
  pendingDeleteAccountId = null,
  updatedPrefix = "Actualizado",
}: AccountsListWidgetProps) {
  return (
    <CardSection
      titleClassName="text-base font-bold text-black font-['Outfit']"
      className="rounded-2xl bg-[#F4F4F5] p-4"
    >
      {isLoading && accounts.length === 0 && (
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      )}

      {!isLoading && hasError && (
        <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
      )}

      {!isLoading && !hasError && accounts.length === 0 && (
        <div className="rounded-2xl bg-white px-4 py-4">
          <span className="block text-sm font-semibold text-black font-['Outfit']">
            {emptyTitle}
          </span>
          <span className="block text-xs font-medium text-[#71717A] mt-1">
            {emptyHint}
          </span>
        </div>
      )}

      {accounts.map((account, index) => {
        const flow = accountFlowsById.get(account.id) ?? { income: 0, expense: 0 };
        const isDeleting = pendingDeleteAccountId === account.id;

        return (
          <AccountSwipeDeleteRow
            key={account.id}
            account={account}
            flow={flow}
            isDeleting={isDeleting}
            isInteractionLocked={pendingDeleteAccountId !== null}
            updatedPrefix={updatedPrefix}
            incomeLabel={incomeLabel}
            expenseLabel={expenseLabel}
            deleteActionLabel={deleteActionLabel}
            onDelete={onDeleteAccount}
            showBorder={index < accounts.length - 1}
          />
        );
      })}
    </CardSection>
  );
}

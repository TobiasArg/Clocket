import { memo } from "react";
import { CardSection } from "@/components";
import { TransactionSwipeDeleteRow } from "./TransactionSwipeDeleteRow";
import type { TransactionsMonthGroup } from "@/hooks";
import type { TransactionItem } from "@/utils";

export interface TransactionsMonthListWidgetProps {
  deleteActionLabel?: string;
  editActionLabel?: string;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  isLoading?: boolean;
  pendingDeleteTransactionId?: string | null;
  loadingLabel?: string;
  monthGroups?: TransactionsMonthGroup[];
  onDeleteTransaction?: (transactionId: string) => void;
  onTransactionClick?: (
    transaction: TransactionItem,
    monthIndex: number,
    transactionIndex: number,
  ) => void;
  resolveAccountLabel?: (transaction: TransactionItem) => string;
  resolveCategoryLabel?: (transaction: TransactionItem) => string;
}

export const TransactionsMonthListWidget = memo(function TransactionsMonthListWidget({
  deleteActionLabel = "Eliminar",
  editActionLabel = "Editar",
  emptyHint = "Agrega tu primera transacción para empezar.",
  emptyTitle = "No hay transacciones todavía",
  errorLabel = "No pudimos cargar las transacciones. Intenta nuevamente.",
  hasError = false,
  isLoading = false,
  pendingDeleteTransactionId = null,
  loadingLabel = "Cargando transacciones...",
  monthGroups = [],
  onDeleteTransaction,
  onTransactionClick,
  resolveAccountLabel,
  resolveCategoryLabel,
}: TransactionsMonthListWidgetProps) {
  return (
    <>
      {isLoading && monthGroups.length === 0 && (
        <CardSection
          title={loadingLabel}
          titleClassName="text-sm font-semibold text-[var(--text-secondary)]"
          gap="gap-3"
        >
          <div className="animate-pulse h-[68px] rounded-2xl bg-[var(--surface-muted)]" />
          <div className="animate-pulse h-[68px] rounded-2xl bg-[var(--surface-muted)]" />
        </CardSection>
      )}

      {!isLoading && hasError && (
        <CardSection gap="gap-2">
          <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
            <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
          </div>
        </CardSection>
      )}

      {!isLoading && !hasError && monthGroups.length === 0 && (
        <CardSection gap="gap-2">
          <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
            <span className="block text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">
              {emptyTitle}
            </span>
            <span className="block text-xs font-medium text-[var(--text-secondary)] mt-1">
              {emptyHint}
            </span>
          </div>
        </CardSection>
      )}

      {!hasError &&
        monthGroups.map((month, monthIndex) => (
          <CardSection
            key={month.key}
            title={month.title}
            titleClassName="text-lg font-bold text-[var(--text-primary)] font-['Outfit']"
            action={(
              <span className={`text-base font-semibold font-['Outfit'] ${month.totalColor}`}>
                {month.total}
              </span>
            )}
            gap="gap-3"
          >
            {month.transactions.map((transaction, transactionIndex) => {
              const subtitle = `${resolveAccountLabel?.(transaction) ?? ""} · ${resolveCategoryLabel?.(transaction) ?? ""}`;

              return (
                <TransactionSwipeDeleteRow
                key={transaction.id}
                transaction={transaction}
                subtitle={subtitle}
                editActionLabel={editActionLabel}
                deleteActionLabel={deleteActionLabel}
                isDeleting={pendingDeleteTransactionId === transaction.id}
                isInteractionLocked={pendingDeleteTransactionId !== null}
                onDelete={onDeleteTransaction}
                onSelect={() => onTransactionClick?.(transaction, monthIndex, transactionIndex)}
                showBorder={transactionIndex < month.transactions.length - 1}
              />
              );
            })}
          </CardSection>
        ))}
    </>
  );
});

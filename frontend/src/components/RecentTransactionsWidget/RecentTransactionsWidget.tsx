import { memo } from "react";
import { CardSection, IconBadge, ListItemRow } from "@/components";

export interface RecentTransactionRow {
  amount: string;
  amountColor?: string;
  date: string;
  icon: string;
  iconBg: string;
  key: string;
  name: string;
}

export interface RecentTransactionsWidgetProps {
  emptyLabel: string;
  errorLabel: string;
  hasError: boolean;
  isLoading: boolean;
  onViewAll?: () => void;
  showEmpty: boolean;
  title: string;
  transactions: RecentTransactionRow[];
  viewAllLabel: string;
}

export const RecentTransactionsWidget = memo(function RecentTransactionsWidget({
  emptyLabel,
  errorLabel,
  hasError,
  isLoading,
  onViewAll,
  showEmpty,
  title,
  transactions,
  viewAllLabel,
}: RecentTransactionsWidgetProps) {
  return (
    <CardSection
      title={title}
      titleClassName="text-lg font-bold text-[var(--text-primary)] font-['Outfit']"
      gap="gap-3"
      className="clocket-aurora-card rounded-2xl p-4"
      action={(
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {viewAllLabel}
        </button>
      )}
    >
      {isLoading && transactions.length === 0 && (
        <>
          <div className="animate-pulse h-[64px] rounded-2xl bg-[var(--surface-muted)]" />
          <div className="animate-pulse h-[64px] rounded-2xl bg-[var(--surface-muted)]" />
        </>
      )}

      {!isLoading && hasError && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
      )}

      {!isLoading && !hasError && showEmpty && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
      )}

      {transactions.map((transaction) => (
        <ListItemRow
          key={transaction.key}
          left={<IconBadge icon={transaction.icon} bg={transaction.iconBg} />}
          title={transaction.name}
          subtitle={transaction.date}
          titleClassName="text-base font-semibold text-[var(--text-primary)] font-['Outfit']"
          subtitleClassName="text-xs font-normal text-[var(--text-secondary)]"
          right={(
            <span
              className={`text-base font-bold font-['Outfit'] ${transaction.amountColor ?? "text-[var(--text-primary)]"}`}
            >
              {transaction.amount}
            </span>
          )}
          className="bg-[var(--panel-bg)] rounded-2xl"
          padding="p-4"
        />
      ))}
    </CardSection>
  );
});

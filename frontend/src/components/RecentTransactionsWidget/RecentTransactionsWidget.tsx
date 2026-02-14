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

export function RecentTransactionsWidget({
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
      titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
      className="rounded-[24px] bg-[#F4F4F5] p-4"
      action={(
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-[#71717A]"
        >
          {viewAllLabel}
        </button>
      )}
    >
      {isLoading && transactions.length === 0 && (
        <>
          <div className="animate-pulse h-[64px] rounded-2xl bg-[#F4F4F5]" />
          <div className="animate-pulse h-[64px] rounded-2xl bg-[#F4F4F5]" />
        </>
      )}

      {!isLoading && hasError && (
        <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
      )}

      {!isLoading && !hasError && showEmpty && (
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
      )}

      {transactions.map((transaction, index) => (
        <ListItemRow
          key={transaction.key}
          left={<IconBadge icon={transaction.icon} bg={transaction.iconBg} />}
          title={transaction.name}
          subtitle={transaction.date}
          titleClassName="text-base font-semibold text-black font-['Outfit']"
          subtitleClassName="text-xs font-normal text-[#A1A1AA]"
          right={(
            <span
              className={`text-base font-bold font-['Outfit'] ${transaction.amountColor ?? "text-black"}`}
            >
              {transaction.amount}
            </span>
          )}
          showBorder={index < transactions.length - 1}
          padding="py-4"
        />
      ))}
    </CardSection>
  );
}

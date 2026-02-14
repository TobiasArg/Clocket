import { CardSection, IconBadge, ListItemRow, PhosphorIcon } from "@/components";
import type { TransactionsMonthGroup } from "@/hooks";
import type { TransactionItem } from "@/utils";

export interface TransactionsMonthListWidgetProps {
  editActionLabel?: string;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  monthGroups?: TransactionsMonthGroup[];
  onTransactionClick?: (
    transaction: TransactionItem,
    monthIndex: number,
    transactionIndex: number,
  ) => void;
  resolveAccountLabel?: (transaction: TransactionItem) => string;
  resolveCategoryLabel?: (transaction: TransactionItem) => string;
}

const parseAmountSign = (value: string): "+" | "-" => {
  return value.trim().startsWith("+") ? "+" : "-";
};

export function TransactionsMonthListWidget({
  editActionLabel = "Editar",
  emptyHint = "Agrega tu primera transacción para empezar.",
  emptyTitle = "No hay transacciones todavía",
  errorLabel = "No pudimos cargar las transacciones. Intenta nuevamente.",
  hasError = false,
  isLoading = false,
  loadingLabel = "Cargando transacciones...",
  monthGroups = [],
  onTransactionClick,
  resolveAccountLabel,
  resolveCategoryLabel,
}: TransactionsMonthListWidgetProps) {
  return (
    <>
      {isLoading && monthGroups.length === 0 && (
        <CardSection
          title={loadingLabel}
          titleClassName="text-sm font-semibold text-[#71717A]"
          gap="gap-3"
        >
          <div className="animate-pulse h-[68px] rounded-2xl bg-[#F4F4F5]" />
          <div className="animate-pulse h-[68px] rounded-2xl bg-[#F4F4F5]" />
        </CardSection>
      )}

      {!isLoading && hasError && (
        <CardSection gap="gap-2">
          <div className="rounded-2xl bg-[#F4F4F5] px-4 py-3">
            <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
          </div>
        </CardSection>
      )}

      {!isLoading && !hasError && monthGroups.length === 0 && (
        <CardSection gap="gap-2">
          <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
            <span className="block text-sm font-semibold text-black font-['Outfit']">
              {emptyTitle}
            </span>
            <span className="block text-xs font-medium text-[#71717A] mt-1">
              {emptyHint}
            </span>
          </div>
        </CardSection>
      )}

      {!hasError &&
        monthGroups.map((month, monthIndex) => (
          <CardSection
            key={month.title}
            title={month.title}
            titleClassName="text-lg font-bold text-black font-['Outfit']"
            action={(
              <span className={`text-base font-semibold font-['Outfit'] ${month.totalColor}`}>
                {month.total}
              </span>
            )}
            gap="gap-3"
          >
            {month.transactions.map((transaction, transactionIndex) => (
              <ListItemRow
                key={transaction.id}
                left={<IconBadge icon={transaction.icon} bg={transaction.iconBg} />}
                title={transaction.name}
                subtitle={`${resolveAccountLabel?.(transaction) ?? ""} · ${resolveCategoryLabel?.(transaction) ?? ""}`}
                titleClassName="text-[15px] font-semibold text-black font-['Outfit']"
                subtitleClassName="text-[11px] font-medium text-[#71717A] truncate"
                right={(
                  <div className="flex flex-col gap-0.5 items-end shrink-0">
                    <span
                      className={`text-[15px] font-bold font-['Outfit'] ${
                        parseAmountSign(transaction.amount) === "+"
                          ? "text-[#16A34A]"
                          : "text-[#DC2626]"
                      }`}
                    >
                      {transaction.amount}
                    </span>
                    <span className="block max-w-[132px] truncate text-[10px] font-medium text-[#A1A1AA]">
                      {transaction.meta}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#71717A]">
                      <PhosphorIcon name="pencil-simple" size="text-[10px]" className="text-[#71717A]" />
                      <span>{editActionLabel}</span>
                    </div>
                  </div>
                )}
                onClick={() => onTransactionClick?.(transaction, monthIndex, transactionIndex)}
                showBorder={transactionIndex < month.transactions.length - 1}
                padding="py-3.5"
              />
            ))}
          </CardSection>
        ))}
    </>
  );
}

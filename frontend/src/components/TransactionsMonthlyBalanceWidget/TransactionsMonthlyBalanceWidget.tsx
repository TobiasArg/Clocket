import { CardSection } from "@/components";
import { formatCurrency } from "@/utils";

export interface TransactionsMonthlyBalanceWidgetProps {
  hasMonthlyTransactions?: boolean;
  isCuotasLoading?: boolean;
  isLoading?: boolean;
  itemsCount?: number;
  monthlyBalance?: {
    expense: number;
    income: number;
    net: number;
  };
  monthlyBalanceTitle?: string;
  monthlyEmptyHint?: string;
  monthlyExpenseLabel?: string;
  monthlyIncomeLabel?: string;
  monthlyLoadingLabel?: string;
  monthlyNetLabel?: string;
  monthlyPendingInstallments?: number;
  monthlyPendingInstallmentsLabel?: string;
  monthlyPendingInstallmentsLoadingLabel?: string;
  cuotasCount?: number;
}

export function TransactionsMonthlyBalanceWidget({
  hasMonthlyTransactions = false,
  isCuotasLoading = false,
  isLoading = false,
  itemsCount = 0,
  monthlyBalance = { income: 0, expense: 0, net: 0 },
  monthlyBalanceTitle = "Balance mensual",
  monthlyEmptyHint = "No transactions yet",
  monthlyExpenseLabel = "Gastos",
  monthlyIncomeLabel = "Ingresos",
  monthlyLoadingLabel = "Calculando balance...",
  monthlyNetLabel = "Neto",
  monthlyPendingInstallments = 0,
  monthlyPendingInstallmentsLabel = "Pending installments this month",
  monthlyPendingInstallmentsLoadingLabel = "Calculating installments...",
  cuotasCount = 0,
}: TransactionsMonthlyBalanceWidgetProps) {
  return (
    <CardSection gap="gap-2">
      <div className="clocket-glass-card flex flex-col gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
          {monthlyBalanceTitle}
        </span>

        {isLoading && itemsCount === 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">{monthlyLoadingLabel}</span>
            <div className="animate-pulse h-8 rounded-xl bg-[var(--panel-bg)]" />
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">{monthlyNetLabel}</span>
              <span className="block max-w-full truncate text-[clamp(1.5rem,8vw,2rem)] font-bold text-[var(--text-primary)] font-['Outfit'] leading-none">
                {formatCurrency(monthlyBalance.net)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="clocket-glass-card rounded-xl bg-[var(--panel-bg)] px-3 py-2">
                <span className="block text-[11px] font-medium text-[var(--text-secondary)]">
                  {monthlyIncomeLabel}
                </span>
                <span className="block max-w-full truncate text-sm font-semibold text-[var(--text-secondary)]">
                  {formatCurrency(monthlyBalance.income)}
                </span>
              </div>
              <div className="clocket-glass-card rounded-xl bg-[var(--panel-bg)] px-3 py-2">
                <span className="block text-[11px] font-medium text-[var(--text-secondary)]">
                  {monthlyExpenseLabel}
                </span>
                <span className="block max-w-full truncate text-sm font-semibold text-[var(--text-secondary)]">
                  {formatCurrency(monthlyBalance.expense)}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-secondary)]">
                {monthlyPendingInstallmentsLabel}
              </span>
              <span className="shrink-0 text-sm font-semibold text-[var(--text-secondary)]">
                {isCuotasLoading && cuotasCount === 0
                  ? monthlyPendingInstallmentsLoadingLabel
                  : formatCurrency(monthlyPendingInstallments)}
              </span>
            </div>

            {!hasMonthlyTransactions && (
              <span className="text-xs font-medium text-[var(--text-secondary)]">{monthlyEmptyHint}</span>
            )}
          </>
        )}
      </div>
    </CardSection>
  );
}

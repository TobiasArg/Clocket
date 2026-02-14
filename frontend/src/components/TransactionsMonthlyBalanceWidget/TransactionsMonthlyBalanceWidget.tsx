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
      <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4 flex flex-col gap-3">
        <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
          {monthlyBalanceTitle}
        </span>

        {isLoading && itemsCount === 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#71717A]">{monthlyLoadingLabel}</span>
            <div className="animate-pulse h-8 rounded-xl bg-white" />
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-[#71717A]">{monthlyNetLabel}</span>
              <span className="block max-w-full truncate text-[clamp(1.5rem,8vw,2rem)] font-bold text-black font-['Outfit'] leading-none">
                {formatCurrency(monthlyBalance.net)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white px-3 py-2">
                <span className="block text-[11px] font-medium text-[#71717A]">
                  {monthlyIncomeLabel}
                </span>
                <span className="block max-w-full truncate text-sm font-semibold text-[#52525B]">
                  {formatCurrency(monthlyBalance.income)}
                </span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2">
                <span className="block text-[11px] font-medium text-[#71717A]">
                  {monthlyExpenseLabel}
                </span>
                <span className="block max-w-full truncate text-sm font-semibold text-[#52525B]">
                  {formatCurrency(monthlyBalance.expense)}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#71717A]">
                {monthlyPendingInstallmentsLabel}
              </span>
              <span className="shrink-0 text-sm font-semibold text-[#52525B]">
                {isCuotasLoading && cuotasCount === 0
                  ? monthlyPendingInstallmentsLoadingLabel
                  : formatCurrency(monthlyPendingInstallments)}
              </span>
            </div>

            {!hasMonthlyTransactions && (
              <span className="text-xs font-medium text-[#71717A]">{monthlyEmptyHint}</span>
            )}
          </>
        )}
      </div>
    </CardSection>
  );
}

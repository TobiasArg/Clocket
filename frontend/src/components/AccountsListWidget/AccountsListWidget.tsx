import { CardSection, IconBadge, ListItemRow } from "@/components";
import type { AccountFlow } from "@/hooks";
import { formatCurrency } from "@/utils";

export interface AccountsListWidgetProps {
  accountFlowsById?: Map<string, AccountFlow>;
  accounts?: Array<{ id: string; name: string; balance: number; updatedAt: string }>;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  incomeLabel?: string;
  expenseLabel?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  updatedPrefix?: string;
}

const UPDATED_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AccountsListWidget({
  accountFlowsById = new Map<string, AccountFlow>(),
  accounts = [],
  emptyHint = "Crea tu primera cuenta para organizar tu balance.",
  emptyTitle = "No hay cuentas",
  errorLabel = "No pudimos cargar las cuentas. Intenta nuevamente.",
  hasError = false,
  incomeLabel = "In",
  expenseLabel = "Out",
  isLoading = false,
  loadingLabel = "Cargando cuentas...",
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

        return (
          <ListItemRow
            key={account.id}
            left={(
              <IconBadge
                icon="wallet"
                bg="bg-[#18181B]"
                iconColor="text-white"
                size="w-[40px] h-[40px]"
                rounded="rounded-xl"
              />
            )}
            title={account.name}
            subtitle={`${updatedPrefix} ${UPDATED_FORMATTER.format(new Date(account.updatedAt))}`}
            titleClassName="text-base font-semibold text-black font-['Outfit']"
            subtitleClassName="text-xs font-medium text-[#71717A]"
            right={(
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-base font-bold font-['Outfit'] ${
                    account.balance >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                  }`}
                >
                  {formatCurrency(account.balance)}
                </span>
                <span className="text-[10px] font-medium text-[#71717A]">
                  {incomeLabel} {formatCurrency(flow.income)} · {expenseLabel} {formatCurrency(flow.expense)}
                </span>
              </div>
            )}
            showBorder={index < accounts.length - 1}
            borderColor="border-[#E4E4E7]"
            padding="py-3.5"
          />
        );
      })}
    </CardSection>
  );
}

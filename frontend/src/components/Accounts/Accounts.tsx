import { useMemo, useState } from "react";
import { ActionButton, CardSection, IconBadge, ListItemRow, PageHeader } from "@/components";
import { useAccounts, useTransactions } from "@/hooks";
import { formatCurrency } from "@/utils";

export interface AccountsProps {
  headerTitle?: string;
  summaryTitle?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddBalanceLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddBalancePlaceholder?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddBalanceErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  updatedPrefix?: string;
  incomeLabel?: string;
  expenseLabel?: string;
  onBackClick?: () => void;
  onAddClick?: () => void;
}

const UPDATED_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const parseSignedAmountValue = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function Accounts({
  headerTitle = "Cuentas",
  summaryTitle = "Balance total",
  quickAddTitle = "Nueva cuenta",
  quickAddNameLabel = "Nombre de la cuenta",
  quickAddBalanceLabel = "Balance inicial",
  quickAddNamePlaceholder = "Ej. Cuenta principal",
  quickAddBalancePlaceholder = "0.00",
  quickAddSubmitLabel = "Guardar cuenta",
  quickAddNameErrorLabel = "Agrega un nombre de cuenta.",
  quickAddBalanceErrorLabel = "Ingresa un balance válido.",
  loadingLabel = "Cargando cuentas...",
  emptyTitle = "No hay cuentas",
  emptyHint = "Crea tu primera cuenta para organizar tu balance.",
  errorLabel = "No pudimos cargar las cuentas. Intenta nuevamente.",
  updatedPrefix = "Actualizado",
  incomeLabel = "In",
  expenseLabel = "Out",
  onBackClick,
  onAddClick,
}: AccountsProps) {
  const { items, isLoading, error, create } = useAccounts();
  const { items: transactions } = useTransactions();
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const normalizedName = nameInput.trim();
  const balanceValue = Number(balanceInput);
  const isNameValid = normalizedName.length > 0;
  const isBalanceValid = Number.isFinite(balanceValue);
  const isFormValid = isNameValid && isBalanceValid;

  const totalBalance = useMemo(
    () => items.reduce((sum, account) => sum + account.balance, 0),
    [items],
  );
  const flowsByAccountId = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    transactions.forEach((transaction) => {
      const amount = parseSignedAmountValue(transaction.amount);
      const current = map.get(transaction.accountId) ?? { income: 0, expense: 0 };

      if (amount > 0) {
        current.income += amount;
      } else if (amount < 0) {
        current.expense += Math.abs(amount);
      }

      map.set(transaction.accountId, current);
    });

    return map;
  }, [transactions]);

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      setNameInput("");
      setBalanceInput("");
      setShowValidation(false);
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
    }

    onAddClick?.();
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const created = await create({
      name: normalizedName,
      balance: balanceValue,
    });

    if (!created) {
      return;
    }

    setIsEditorOpen(false);
    setNameInput("");
    setBalanceInput("");
    setShowValidation(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />

      <div className="flex-1 overflow-auto px-5 py-3">
        <div className="flex flex-col gap-4">
          {isEditorOpen && (
            <div className="flex flex-col gap-3 rounded-2xl bg-[#F4F4F5] p-4">
              <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
                {quickAddTitle}
              </span>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder={quickAddNamePlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isNameValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {quickAddNameErrorLabel}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddBalanceLabel}</span>
                <input
                  type="number"
                  step="0.01"
                  value={balanceInput}
                  onChange={(event) => setBalanceInput(event.target.value)}
                  placeholder={quickAddBalancePlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isBalanceValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {quickAddBalanceErrorLabel}
                  </span>
                )}
              </label>

              <ActionButton
                icon="plus"
                label={quickAddSubmitLabel}
                iconColor="text-[#18181B]"
                labelColor="text-[#18181B]"
                bg={isFormValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
                padding="px-4 py-3"
                className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
                onClick={() => {
                  void handleCreate();
                }}
              />
            </div>
          )}

          <CardSection
            title={summaryTitle}
            titleClassName="text-base font-bold text-black font-['Outfit']"
            className="rounded-2xl bg-[#F4F4F5] p-4"
          >
            <span className="block text-[clamp(1.5rem,8vw,2rem)] font-bold text-black font-['Outfit']">
              {formatCurrency(totalBalance)}
            </span>
          </CardSection>

          <CardSection
            titleClassName="text-base font-bold text-black font-['Outfit']"
            className="rounded-2xl bg-[#F4F4F5] p-4"
          >
            {isLoading && items.length === 0 && (
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            )}

            {!isLoading && error && (
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            )}

            {!isLoading && !error && items.length === 0 && (
              <div className="rounded-2xl bg-white px-4 py-4">
                <span className="block text-sm font-semibold text-black font-['Outfit']">
                  {emptyTitle}
                </span>
                <span className="block text-xs font-medium text-[#71717A] mt-1">
                  {emptyHint}
                </span>
              </div>
            )}

            {items.map((account, index) => {
              const flow = flowsByAccountId.get(account.id) ?? { income: 0, expense: 0 };

              return (
                <ListItemRow
                  key={account.id}
                  left={
                    <IconBadge
                      icon="wallet"
                      bg="bg-[#18181B]"
                      iconColor="text-white"
                      size="w-[40px] h-[40px]"
                      rounded="rounded-xl"
                    />
                  }
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
                  showBorder={index < items.length - 1}
                  borderColor="border-[#E4E4E7]"
                  padding="py-3.5"
                />
              );
            })}
          </CardSection>
        </div>
      </div>
    </div>
  );
}

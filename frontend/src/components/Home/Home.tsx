import { useMemo } from "react";
import type {
  CuotaItem,
  GoalCardSimple,
  NavItem,
  SpendingCategory,
  Transaction,
} from "@/types";
import {
  Avatar,
  BottomNavigation,
  CardSection,
  HeroBalance,
  IconBadge,
  ListItemRow,
  PhosphorIcon,
  SpendingBar,
} from "@/components";
import { useCategories, useCuotas, useTransactions } from "@/hooks";
import {
  formatCurrency,
  getCurrentMonthWindow,
  getMonthlyBalance,
  getPendingInstallmentsTotalForMonth,
  getTransactionDateForMonthBalance,
  isCuotaActiveInMonth,
} from "@/utils";

export interface HomeProps {
  avatarInitials?: string;
  greeting?: string;
  userName?: string;
  totalBalance?: string;
  incomeLabel?: string;
  incomeValue?: string;
  expenseLabel?: string;
  expenseValue?: string;
  activeDot?: number;
  recentTitle?: string;
  recentViewAll?: string;
  transactions?: Transaction[];
  spendingTitle?: string;
  spendingTotal?: string;
  spendingCategories?: SpendingCategory[];
  spendingPendingLabel?: string;
  goalsTitle?: string;
  goals?: GoalCardSimple[];
  cuotasTitle?: string;
  cuotasViewAll?: string;
  cuotas?: CuotaItem[];
  navItems?: NavItem[];
  loadingLabel?: string;
  errorLabel?: string;
  emptyTransactionsLabel?: string;
  emptySpendingLabel?: string;
  emptyCuotasLabel?: string;
  onNavItemClick?: (index: number) => void;
  onMenuClick?: () => void;
  onSeeAllTransactions?: () => void;
  onSeeAllCuotas?: () => void;
}

interface HomeTransactionRow {
  key: string;
  icon: string;
  iconBg: string;
  name: string;
  date: string;
  amount: string;
  amountColor?: string;
}

const RECENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SPENDING_COLORS = [
  "bg-[#DC2626]",
  "bg-[#2563EB]",
  "bg-[#7C3AED]",
  "bg-[#71717A]",
] as const;

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAmountColor = (amount: string, amountColor?: string): string => {
  if (amountColor) {
    return amountColor;
  }

  return amount.trim().startsWith("+") ? "text-[#16A34A]" : "text-[#DC2626]";
};

export function Home({
  avatarInitials = "JS",
  greeting = "Good morning",
  userName = "John",
  totalBalance,
  incomeLabel = "Income",
  incomeValue,
  expenseLabel = "Expenses",
  expenseValue,
  activeDot = 0,
  recentTitle = "Recent",
  recentViewAll = "See all",
  transactions,
  spendingTitle = "Spending",
  spendingTotal,
  spendingCategories,
  spendingPendingLabel = "Pending installments",
  goalsTitle = "Goals",
  goals = [
    { icon: "airplane", name: "Vacation", progress: "48%", highlighted: true },
    { icon: "car", name: "New Car", progress: "34%" },
    { icon: "shield", name: "Emergency", progress: "92%" },
  ],
  cuotasTitle = "Planes de Cuotas",
  cuotasViewAll = "Ver todos",
  cuotas,
  navItems = [
    { icon: "house", label: "Home", active: true },
    { icon: "wallet", label: "Budgets" },
    { icon: "chart-bar", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three", label: "Más" },
  ],
  loadingLabel = "Loading...",
  errorLabel = "We couldn’t load this section. Please try again.",
  emptyTransactionsLabel = "No transactions yet.",
  emptySpendingLabel = "No spending yet this month.",
  emptyCuotasLabel = "No active installments.",
  onNavItemClick,
  onMenuClick,
  onSeeAllTransactions,
  onSeeAllCuotas,
}: HomeProps) {
  const {
    items: transactionItems,
    isLoading: isTransactionsLoading,
    error: transactionsError,
  } = useTransactions();
  const { items: categories } = useCategories();
  const {
    items: cuotaItems,
    isLoading: isCuotasLoading,
    error: cuotasError,
  } = useCuotas();

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });

    return map;
  }, [categories]);

  const monthlyBalance = useMemo(
    () => getMonthlyBalance(transactionItems),
    [transactionItems],
  );
  const monthlyPendingInstallments = useMemo(
    () => getPendingInstallmentsTotalForMonth(cuotaItems),
    [cuotaItems],
  );

  const recentTransactions = useMemo<HomeTransactionRow[]>(() => {
    if (transactions) {
      return transactions.map((transaction, index) => ({
        key: `${transaction.name}-${index}`,
        ...transaction,
      }));
    }

    return [...transactionItems]
      .sort((left, right) => {
        const leftDate = getTransactionDateForMonthBalance(left)?.getTime() ?? 0;
        const rightDate = getTransactionDateForMonthBalance(right)?.getTime() ?? 0;
        return rightDate - leftDate;
      })
      .slice(0, 3)
      .map((transaction) => ({
        key: transaction.id,
        icon: transaction.icon,
        iconBg: transaction.iconBg,
        name: transaction.name,
        date: RECENT_DATE_FORMATTER.format(
          getTransactionDateForMonthBalance(transaction) ?? new Date(),
        ),
        amount: transaction.amount,
        amountColor: getAmountColor(transaction.amount, transaction.amountColor),
      }));
  }, [transactionItems, transactions]);

  const computedSpendingCategories = useMemo<SpendingCategory[]>(() => {
    const monthWindow = getCurrentMonthWindow();
    const grouped = new Map<string, number>();

    transactionItems.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (
        transactionDate < monthWindow.start ||
        transactionDate >= monthWindow.end
      ) {
        return;
      }

      const signedAmount = parseSignedAmount(transaction.amount);
      if (signedAmount >= 0) {
        return;
      }

      const categoryLabel = transaction.categoryId
        ? (categoryNameById.get(transaction.categoryId) ?? "Uncategorized")
        : (transaction.category || "Uncategorized");

      grouped.set(categoryLabel, (grouped.get(categoryLabel) ?? 0) + Math.abs(signedAmount));
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, amount], index) => ({
        label,
        percentage: Math.max(1, Math.round((amount / total) * 100)),
        color: SPENDING_COLORS[index % SPENDING_COLORS.length],
      }));
  }, [categoryNameById, transactionItems]);

  const activeCuotas = useMemo(() => {
    if (cuotas) {
      return cuotas;
    }

    return cuotaItems
      .filter((cuota) => isCuotaActiveInMonth(cuota))
      .slice(0, 3)
      .map<CuotaItem>((cuota) => ({
        name: cuota.title,
        progressLabel: `${cuota.paidInstallmentsCount}/${cuota.installmentsCount} cuotas`,
        amount: formatCurrency(cuota.installmentAmount),
      }));
  }, [cuotaItems, cuotas]);

  const displayedTotalBalance = totalBalance ?? formatCurrency(monthlyBalance.net);
  const displayedIncomeValue = incomeValue ?? formatCurrency(monthlyBalance.income);
  const displayedExpenseValue = expenseValue ?? formatCurrency(monthlyBalance.expense);
  const displayedSpendingTotal = spendingTotal ?? formatCurrency(monthlyBalance.expense);
  const displayedSpendingCategories = spendingCategories ?? computedSpendingCategories;
  const pendingInstallmentsLabel = isCuotasLoading && !cuotas && cuotaItems.length === 0
    ? loadingLabel
    : formatCurrency(monthlyPendingInstallments);

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={avatarInitials} size="w-[44px] h-[44px]" />
          <div className="flex flex-col">
            <span className="text-[13px] font-normal text-[#71717A]">{greeting}</span>
            <span className="text-lg font-bold text-black font-['Outfit']">{userName}</span>
          </div>
        </div>
        <button type="button" onClick={onMenuClick} aria-label="Menu">
          <IconBadge
            icon="list"
            bg="bg-[#F4F4F5]"
            iconColor="text-black"
            size="w-[44px] h-[44px]"
            rounded="rounded-full"
          />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-8 px-5 pb-5">
          <HeroBalance
            balance={displayedTotalBalance}
            incomeLabel={incomeLabel}
            incomeValue={displayedIncomeValue}
            expenseLabel={expenseLabel}
            expenseValue={displayedExpenseValue}
            activeDot={activeDot}
          />

          <CardSection
            title={recentTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
            action={
              <button
                type="button"
                onClick={onSeeAllTransactions}
                className="text-sm font-medium text-[#71717A]"
              >
                {recentViewAll}
              </button>
            }
          >
            {isTransactionsLoading && !transactions && recentTransactions.length === 0 && (
              <>
                <div className="animate-pulse h-[64px] rounded-2xl bg-[#F4F4F5]" />
                <div className="animate-pulse h-[64px] rounded-2xl bg-[#F4F4F5]" />
              </>
            )}

            {!transactions && transactionsError && (
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            )}

            {!transactions && !transactionsError && recentTransactions.length === 0 && !isTransactionsLoading && (
              <span className="text-sm font-medium text-[#71717A]">{emptyTransactionsLabel}</span>
            )}

            {recentTransactions.map((transaction, index) => (
              <ListItemRow
                key={transaction.key}
                left={<IconBadge icon={transaction.icon} bg={transaction.iconBg} />}
                title={transaction.name}
                subtitle={transaction.date}
                titleClassName="text-base font-semibold text-black font-['Outfit']"
                subtitleClassName="text-xs font-normal text-[#A1A1AA]"
                right={
                  <span
                    className={`text-base font-bold font-['Outfit'] ${transaction.amountColor ?? "text-black"}`}
                  >
                    {transaction.amount}
                  </span>
                }
                showBorder={index < recentTransactions.length - 1}
                padding="py-4"
              />
            ))}
          </CardSection>

          <CardSection
            title={spendingTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
            action={
              <div className="flex flex-col items-end">
                <span className="text-xl font-light text-[#71717A] font-['Outfit']">
                  {displayedSpendingTotal}
                </span>
                <span className="text-[11px] font-medium text-[#A1A1AA]">
                  {spendingPendingLabel}: {pendingInstallmentsLabel}
                </span>
              </div>
            }
          >
            {isTransactionsLoading && !spendingCategories && displayedSpendingCategories.length === 0 && (
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            )}

            {!spendingCategories && displayedSpendingCategories.length === 0 && !isTransactionsLoading && (
              <span className="text-sm font-medium text-[#71717A]">{emptySpendingLabel}</span>
            )}

            {displayedSpendingCategories.map((category) => (
              <SpendingBar
                key={category.label}
                label={category.label}
                percentage={category.percentage}
                barColor={category.color}
              />
            ))}
          </CardSection>

          <CardSection
            title={goalsTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
          >
            <div className="flex gap-3 overflow-x-auto">
              {goals.map((goal) => (
                <div
                  key={goal.name}
                  className={`flex flex-col gap-3 rounded-[20px] p-4 min-w-[140px] ${
                    goal.highlighted ? "bg-black" : "bg-[#F4F4F5]"
                  }`}
                >
                  <PhosphorIcon
                    name={goal.icon}
                    size="text-2xl"
                    className={goal.highlighted ? "text-white" : "text-black"}
                  />
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-base font-bold font-['Outfit'] ${goal.highlighted ? "text-white" : "text-black"}`}
                    >
                      {goal.name}
                    </span>
                    <span
                      className={`text-2xl font-light font-['Outfit'] ${goal.highlighted ? "text-[#A1A1AA]" : "text-[#71717A]"}`}
                    >
                      {goal.progress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardSection>

          <CardSection
            title={cuotasTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
            action={
              <button
                type="button"
                onClick={onSeeAllCuotas}
                className="text-sm font-medium text-[#71717A]"
              >
                {cuotasViewAll}
              </button>
            }
          >
            {!cuotas && isCuotasLoading && activeCuotas.length === 0 && (
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            )}

            {!cuotas && cuotasError && (
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            )}

            {!cuotas && !cuotasError && activeCuotas.length === 0 && !isCuotasLoading && (
              <span className="text-sm font-medium text-[#71717A]">{emptyCuotasLabel}</span>
            )}

            {activeCuotas.map((cuota) => (
              <ListItemRow
                key={cuota.name}
                left={<></>}
                title={cuota.name}
                subtitle={cuota.progressLabel}
                titleClassName="text-base font-semibold text-black font-['Outfit']"
                subtitleClassName="text-[13px] font-medium text-[#71717A]"
                right={
                  <span className="text-xl font-bold text-black font-['Outfit']">{cuota.amount}</span>
                }
                padding="p-4"
                className="bg-[#F4F4F5] rounded-2xl"
                gap="gap-0"
              />
            ))}
          </CardSection>
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}

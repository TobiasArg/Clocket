import type {
  CuotaItem,
  GoalCardSimple,
  NavItem,
  SpendingCategory,
  Transaction,
} from "@/modules/home";
import {
  Avatar,
  BalanceWidget,
  BottomNavigation,
  GoalsWidget,
  IconBadge,
  InstallmentPlansWidget,
  RecentTransactionsWidget,
  SpendingInfoWidget,
  useHomePageModel,
} from "@/modules/home";

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
    { icon: "house", label: "Home", active: true, to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-bar", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "dots-three", label: "Más", to: "/more" },
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
    activeBalanceSlide,
    balanceSlides,
    displayedSpendingCategories,
    displayedSpendingTotal,
    hasCuotasError,
    hasTransactionsError,
    isCuotasLoading,
    isTransactionsLoading,
    pendingInstallmentsLabel,
    recentTransactions,
    setActiveBalanceSlide,
    visibleCuotas,
  } = useHomePageModel({
    activeDot,
    transactions,
    spendingTotal,
    spendingCategories,
    totalBalance,
    incomeValue,
    expenseValue,
    cuotas,
    loadingLabel,
  });

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
        <div className="flex flex-col gap-4 px-5 pb-5">
          <BalanceWidget
            activeSlide={activeBalanceSlide}
            slides={balanceSlides}
            onSlideChange={setActiveBalanceSlide}
            incomeLabel={incomeLabel}
            expenseLabel={expenseLabel}
          />

          <RecentTransactionsWidget
            title={recentTitle}
            viewAllLabel={recentViewAll}
            onViewAll={onSeeAllTransactions}
            isLoading={isTransactionsLoading && !transactions && recentTransactions.length === 0}
            hasError={!transactions && hasTransactionsError}
            showEmpty={
              !transactions &&
              !hasTransactionsError &&
              recentTransactions.length === 0 &&
              !isTransactionsLoading
            }
            emptyLabel={emptyTransactionsLabel}
            errorLabel={errorLabel}
            transactions={recentTransactions}
          />

          <SpendingInfoWidget
            title={spendingTitle}
            total={displayedSpendingTotal}
            pendingInstallmentsLabel={spendingPendingLabel}
            pendingInstallmentsValue={pendingInstallmentsLabel}
            isLoading={
              isTransactionsLoading &&
              !spendingCategories &&
              displayedSpendingCategories.length === 0
            }
            showEmpty={
              !spendingCategories &&
              displayedSpendingCategories.length === 0 &&
              !isTransactionsLoading
            }
            loadingLabel={loadingLabel}
            emptyLabel={emptySpendingLabel}
            categories={displayedSpendingCategories}
          />

          <GoalsWidget
            title={goalsTitle}
            goals={goals}
          />

          <InstallmentPlansWidget
            title={cuotasTitle}
            viewAllLabel={cuotasViewAll}
            onViewAll={onSeeAllCuotas}
            isLoading={!cuotas && isCuotasLoading && visibleCuotas.length === 0}
            hasError={!cuotas && hasCuotasError}
            showEmpty={
              !cuotas &&
              !hasCuotasError &&
              visibleCuotas.length === 0 &&
              !isCuotasLoading
            }
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyLabel={emptyCuotasLabel}
            cuotas={visibleCuotas}
          />
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}

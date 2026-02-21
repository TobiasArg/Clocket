import { DEFAULT_NAV_ITEMS } from "@/constants";
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
  onGoalClick?: (goalId: string) => void;
}

export function Home({
  avatarInitials = "JS",
  greeting = "Buenos días",
  userName = "John",
  totalBalance,
  incomeLabel = "Ing.",
  incomeValue,
  expenseLabel = "Gas.",
  expenseValue,
  activeDot = 0,
  recentTitle = "Recientes",
  recentViewAll = "Ver todos",
  transactions,
  spendingTitle = "Gastos",
  spendingTotal,
  spendingCategories,
  spendingPendingLabel = "Cuotas pendientes",
  goalsTitle = "Metas",
  goals,
  cuotasTitle = "Planes de Cuotas",
  cuotasViewAll = "Ver todos",
  cuotas,
  navItems = DEFAULT_NAV_ITEMS,
  loadingLabel = "Cargando...",
  errorLabel = "No pudimos cargar esta sección. Intenta nuevamente.",
  emptyTransactionsLabel = "Aún no hay transacciones.",
  emptySpendingLabel = "Sin gastos este mes.",
  emptyCuotasLabel = "Sin cuotas activas.",
  onNavItemClick,
  onMenuClick,
  onSeeAllTransactions,
  onSeeAllCuotas,
  onGoalClick,
}: HomeProps) {
  const {
    activeBalanceSlide,
    balanceSlides,
    dashboardGoals,
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
    <div className="flex flex-col h-full w-full bg-[var(--panel-bg)]">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={avatarInitials} size="w-[44px] h-[44px]" />
          <div className="flex flex-col">
            <span className="text-sm font-normal text-[var(--text-secondary)]">{greeting}</span>
            <span className="text-lg font-bold text-[var(--text-primary)] font-['Outfit']">{userName}</span>
          </div>
        </div>
        <button type="button" onClick={onMenuClick} aria-label="Menu">
          <IconBadge
            icon="list"
            bg="bg-[var(--surface-muted)]"
            iconColor="text-[var(--text-primary)]"
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
            goals={goals ?? dashboardGoals}
            onGoalClick={onGoalClick}
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

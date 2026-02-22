import type {
  SidebarNavItem,
  UserProfile,
  StatCard,
  TransactionDetailed,
  SpendingCategoryDetailed,
  GoalCardDetailed,
  PlanSummaryItem,
  BudgetSummaryItem,
} from "@/types";
import { PhosphorIcon } from "@/components";
import { ProgressBar } from "@/components";
import { ListItemRow } from "@/components";
import { StatDisplay } from "@/components";
import { CardSection } from "@/components";
import { SidebarNav } from "@/components";
import {
  TRANSACTION_EXPENSE_TEXT_CLASS,
  TRANSACTION_INCOME_TEXT_CLASS,
} from "@/constants";
import { HeroBalance } from "../HeroBalance/HeroBalance";
import { IconBadge } from "../IconBadge/IconBadge";

export interface HomeDesktopProps {
  logoInitial?: string;
  logoName?: string;
  navItems?: SidebarNavItem[];
  navItemsBottom?: SidebarNavItem[];
  user?: UserProfile;
  greeting?: string;
  headerTitle?: string;
  searchPlaceholder?: string;
  heroLabel?: string;
  heroBalance?: string;
  incomeLabel?: string;
  incomeValue?: string;
  expenseLabel?: string;
  expenseValue?: string;
  stats?: StatCard[];
  txTitle?: string;
  transactions?: TransactionDetailed[];
  spendTitle?: string;
  spendPeriod?: string;
  spendingCategories?: SpendingCategoryDetailed[];
  chartsTitle?: string;
  chartsSubtitle?: string;
  goalsTitle?: string;
  goals?: GoalCardDetailed[];
  planesTitle?: string;
  planesViewAll?: string;
  planes?: PlanSummaryItem[];
  budgetsTitle?: string;
  budgetsViewAll?: string;
  budgets?: BudgetSummaryItem[];
  onNavItemClick?: (index: number) => void;
  onSearchFocus?: () => void;
  onNotificationClick?: () => void;
  onAddGoalClick?: () => void;
  onViewAllPlanes?: () => void;
  onViewAllBudgets?: () => void;
}

export function HomeDesktop({
  logoInitial = "F",
  logoName = "FinTrack",
  navItems = [
    { icon: "house", label: "Dashboard", active: true, to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-pie-slice", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "gear", label: "Settings", to: "/settings" },
  ],
  navItemsBottom = [
    { icon: "arrows-left-right", label: "Transacciones", to: "/transactions" },
    { icon: "tag", label: "Categorías", to: "/categories" },
    { icon: "credit-card", label: "Planes de Cuotas", to: "/plans" },
  ],
  user = { initial: "M", name: "Maria Chen", email: "maria@email.com" },
  greeting = "Good morning, Maria",
  headerTitle = "Dashboard",
  searchPlaceholder = "Search transactions...",
  heroLabel = "TOTAL BALANCE",
  heroBalance = "$24,562",
  incomeLabel = "Ingresos",
  incomeValue = "$8,420",
  expenseLabel = "Gastos",
  expenseValue = "$3,842",
  stats = [
    { label: "Efectivo", value: "$12,340", change: "+5.2% este mes", changeColor: "text-[#10B981]" },
    { label: "Tarjeta", value: "$12,222", change: "-2.1% este mes", changeColor: "text-[#EF4444]" },
  ],
  txTitle = "Recent Transactions",
  transactions = [
    { icon: "fork-knife", iconBg: "bg-[#DC2626]", name: "Supermercado", category: "Alimentación · Hoy", amount: "-$85.50", amountColor: TRANSACTION_EXPENSE_TEXT_CLASS, meta: "" },
    { icon: "arrow-down", iconBg: "bg-[#10B981]", name: "Salario", category: "Ingreso · 5 Feb", amount: "+$4,200.00", amountColor: TRANSACTION_INCOME_TEXT_CLASS, meta: "" },
    { icon: "car", iconBg: "bg-[#2563EB]", name: "Gasolina", category: "Transporte · Ayer", amount: "-$45.00", amountColor: TRANSACTION_EXPENSE_TEXT_CLASS, meta: "" },
    { icon: "popcorn", iconBg: "bg-[#7C3AED]", name: "Netflix", category: "Entretenimiento · 3 Feb", amount: "-$15.99", amountColor: TRANSACTION_EXPENSE_TEXT_CLASS, meta: "" },
  ],
  spendTitle = "Spending",
  spendPeriod = "This month",
  spendingCategories = [
    { name: "Alimentación", value: "$1,076", barColor: "bg-[#DC2626]", barWidthPercent: 64 },
    { name: "Transporte", value: "$884", barColor: "bg-[#2563EB]", barWidthPercent: 51 },
    { name: "Entretenimiento", value: "$730", barColor: "bg-[#7C3AED]", barWidthPercent: 42 },
    { name: "Compras", value: "$500", barColor: "bg-[#EA580C]", barWidthPercent: 29 },
  ],
  chartsTitle = "Área para Gráficos",
  chartsSubtitle = "Balance Mensual · Gastos por Categoría · Tendencia",
  goalsTitle = "Goals",
  goals = [
    { icon: "airplane-tilt", name: "Vacaciones", progressText: "$1,950 / $3,000", percent: "65%", barWidthPercent: 65, highlighted: true },
    { icon: "device-mobile", name: "iPhone Nuevo", progressText: "$480 / $1,200", percent: "40%", barWidthPercent: 40 },
    { icon: "graduation-cap", name: "Curso Online", progressText: "$125 / $500", percent: "25%", barWidthPercent: 25 },
  ],
  planesTitle = "Planes de Cuotas",
  planesViewAll = "Ver todos",
  planes = [
    { name: "MacBook Pro", detail: "Cuota 8/12 · $250/mes", remaining: "$1,000", highlighted: true },
    { name: "Smart TV", detail: "Cuota 3/6 · $150/mes", remaining: "$450" },
    { name: "Aire Acondicionado", detail: "Cuota 2/12 · $100/mes", remaining: "$1,000" },
  ],
  budgetsTitle = "Budgets",
  budgetsViewAll = "Ver todos",
  budgets = [
    { icon: "hamburger", iconBg: "bg-[#DC2626]", name: "Alimentación", meta: "$420 / $600", percent: "70%", percentColor: "text-[#DC2626]", highlighted: true },
    { icon: "car", iconBg: "bg-[#2563EB]", name: "Transporte", meta: "$180 / $360", percent: "50%", percentColor: "text-[#2563EB]" },
    { icon: "popcorn", iconBg: "bg-[#7C3AED]", name: "Entretenimiento", meta: "$195 / $240", percent: "81%", percentColor: "text-[#7C3AED]" },
  ],
  onNavItemClick,
  onSearchFocus,
  onNotificationClick,
  onAddGoalClick,
  onViewAllPlanes,
  onViewAllBudgets,
}: HomeDesktopProps) {
  return (
    <div className="flex h-full w-full bg-[var(--panel-bg)] overflow-hidden">
      <SidebarNav
        logoInitial={logoInitial}
        logoName={logoName}
        navItems={navItems}
        navItemsBottom={navItemsBottom}
        user={user}
        onNavItemClick={onNavItemClick}
      />

      <main className="flex-1 overflow-auto px-12 py-10">
        <div className="flex flex-col gap-10 max-w-[1100px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <StatDisplay
              label={greeting}
              value={headerTitle}
              labelClassName="text-sm font-normal text-[var(--text-secondary)]"
              valueClassName="text-[32px] font-extrabold text-[var(--text-primary)] font-['Outfit']"
              gap="gap-1"
            />
            <div className="flex items-center gap-3">
              <div
                onClick={onSearchFocus}
                className="flex items-center gap-2.5 bg-[var(--surface-muted)] rounded-xl px-4 py-3 w-[280px] cursor-text"
              >
                <PhosphorIcon name="magnifying-glass" className="text-[var(--text-secondary)]" />
                <span className="text-sm font-normal text-[var(--text-secondary)]">{searchPlaceholder}</span>
              </div>
              <button type="button" onClick={onNotificationClick} aria-label="Notifications">
                <IconBadge
                  icon="bell"
                  bg="bg-[var(--surface-muted)]"
                  iconColor="text-[var(--text-secondary)]"
                  size="w-[48px] h-[48px]"
                  rounded="rounded-xl"
                  iconSize="text-[22px]"
                />
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="flex gap-8">
            <HeroBalance
              label={heroLabel}
              balance={heroBalance}
              incomeLabel={incomeLabel}
              incomeValue={incomeValue}
              expenseLabel={expenseLabel}
              expenseValue={expenseValue}
              variant="desktop"
            />
            <div className="flex flex-col gap-4 w-[280px] shrink-0">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-3 bg-[var(--surface-muted)] rounded-[20px] p-6 flex-1">
                  <span className="text-[13px] font-medium text-[var(--text-secondary)]">{stat.label}</span>
                  <span className="text-[32px] font-extrabold text-[var(--text-primary)] font-['Outfit']">{stat.value}</span>
                  <span className={`text-xs font-medium ${stat.changeColor}`}>{stat.change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions + Spending */}
          <div className="flex gap-8">
            <CardSection title={txTitle} className="flex-1">
              <div className="flex flex-col bg-[var(--surface-muted)] rounded-2xl p-1">
                {transactions.map((tx) => (
                  <ListItemRow
                    key={tx.name}
                    left={<IconBadge icon={tx.icon} bg={tx.iconBg} />}
                    title={tx.name}
                    subtitle={tx.category}
                    titleClassName="text-sm font-semibold text-[var(--text-primary)]"
                    subtitleClassName="text-xs font-normal text-[var(--text-secondary)]"
                    right={
                      <span className={`text-[15px] font-bold font-['Outfit'] ${tx.amountColor}`}>
                        {tx.amount}
                      </span>
                    }
                    padding="px-5 py-4"
                    className="bg-[var(--panel-bg)] first:rounded-t-xl last:rounded-b-xl"
                    gap="gap-3.5"
                  />
                ))}
              </div>
            </CardSection>

            <div className="flex flex-col gap-5 w-[360px] shrink-0">
              <CardSection
                title={spendTitle}
                action={<span className="text-[13px] font-normal text-[var(--text-secondary)]">{spendPeriod}</span>}
              >
                <div className="flex flex-col gap-5 bg-[var(--surface-muted)] rounded-[20px] p-6">
                  {spendingCategories.map((cat) => (
                    <div key={cat.name} className="flex flex-col gap-2.5">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{cat.name}</span>
                        <span className="text-sm font-bold text-[var(--text-primary)] font-['Outfit']">{cat.value}</span>
                      </div>
                      <ProgressBar
                        percent={cat.barWidthPercent}
                        barColor={cat.barColor}
                        trackColor="bg-[var(--surface-border)]"
                      />
                    </div>
                  ))}
                </div>
              </CardSection>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="flex items-center justify-center bg-[var(--surface-muted)] rounded-[20px] h-[280px] p-6">
            <div className="flex flex-col items-center gap-3">
              <PhosphorIcon name="chart-line-up" className="text-[var(--text-secondary)]" size="text-[48px]" />
              <span className="text-lg font-semibold text-[var(--text-secondary)] font-['Outfit']">{chartsTitle}</span>
              <span className="text-[13px] font-normal text-[var(--text-secondary)]">{chartsSubtitle}</span>
            </div>
          </div>

          {/* Goals */}
          <CardSection
            title={goalsTitle}
            action={
              <button type="button" onClick={onAddGoalClick} aria-label="Add goal">
                <IconBadge
                  icon="plus"
                  bg="bg-[var(--surface-muted)]"
                  iconColor="text-[var(--text-secondary)]"
                  size="w-[32px] h-[32px]"
                  rounded="rounded-lg"
                  iconSize="text-[16px]"
                />
              </button>
            }
          >
            <div className="flex gap-6">
              {goals.map((goal) => {
                const isHL = goal.highlighted ?? false;
                return (
                  <div
                    key={goal.name}
                    className={`flex flex-col gap-4 rounded-[20px] p-5 flex-1 ${isHL ? "bg-[var(--text-primary)]" : "bg-[var(--surface-muted)]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <IconBadge
                        icon={goal.icon}
                        bg="bg-[var(--panel-bg)]"
                        iconColor={isHL ? "text-[var(--panel-bg)]" : "text-[var(--text-primary)]"}
                        size="w-[40px] h-[40px]"
                        rounded="rounded-[10px]"
                      />
                      <span className={`text-sm font-semibold font-['Outfit'] ${isHL ? "text-[var(--panel-bg)]" : "text-[var(--text-primary)]"}`}>
                        {goal.percent}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`text-base font-semibold font-['Outfit'] ${isHL ? "text-[var(--panel-bg)]" : "text-[var(--text-primary)]"}`}>
                        {goal.name}
                      </span>
                      <span className={`text-xs font-normal text-[var(--text-secondary)]`}>
                        {goal.progressText}
                      </span>
                    </div>
                    <ProgressBar
                      percent={goal.barWidthPercent}
                      barColor="bg-[#10B981]"
                      trackColor="bg-[var(--surface-border)]"
                      height="h-1.5"
                    />
                  </div>
                );
              })}
            </div>
          </CardSection>

          {/* Planes + Budgets */}
          <div className="flex gap-8">
            <CardSection
              title={planesTitle}
              action={
                <button type="button" onClick={onViewAllPlanes} className="text-[13px] font-normal text-[#10B981]">
                  {planesViewAll}
                </button>
              }
              className="flex-1"
            >
              <div className="flex flex-col gap-4 bg-[var(--surface-muted)] rounded-[20px] p-5">
                {planes.map((plan) => {
                  const isHL = plan.highlighted ?? false;
                  return (
                    <div
                      key={plan.name}
                      className={`flex items-center justify-between rounded-[14px] p-4 ${isHL ? "bg-[var(--text-primary)]" : "bg-[var(--panel-bg)]"}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-semibold font-['Outfit'] ${isHL ? "text-[var(--panel-bg)]" : "text-[var(--text-primary)]"}`}>
                          {plan.name}
                        </span>
                        <span className={`text-[11px] font-normal text-[var(--text-secondary)]`}>
                          {plan.detail}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`text-sm font-semibold font-['Outfit'] ${isHL ? "text-[var(--panel-bg)]" : "text-[var(--text-primary)]"}`}>
                          {plan.remaining}
                        </span>
                        <span className="text-[10px] font-normal text-[var(--text-secondary)]">restante</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardSection>

            <CardSection
              title={budgetsTitle}
              action={
                <button type="button" onClick={onViewAllBudgets} className="text-[13px] font-normal text-[#10B981]">
                  {budgetsViewAll}
                </button>
              }
              className="flex-1"
            >
              <div className="flex flex-col gap-4 bg-[var(--surface-muted)] rounded-[20px] p-5">
                {budgets.map((b) => {
                  const isHL = b.highlighted ?? false;
                  return (
                    <div
                      key={b.name}
                      className={`flex items-center justify-between rounded-[14px] p-4 ${isHL ? "bg-[var(--text-primary)]" : "bg-[var(--panel-bg)]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <IconBadge
                          icon={b.icon}
                          bg={b.iconBg}
                          size="w-[36px] h-[36px]"
                          rounded="rounded-[18px]"
                          iconSize="text-[18px]"
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-sm font-semibold font-['Outfit'] ${isHL ? "text-[var(--panel-bg)]" : "text-[var(--text-primary)]"}`}>
                            {b.name}
                          </span>
                          <span className={`text-xs font-normal text-[var(--text-secondary)]`}>
                            {b.meta}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`text-base font-bold font-['Outfit'] ${isHL ? "text-[#DC2626]" : b.percentColor}`}>
                          {b.percent}
                        </span>
                        <span className={`text-[11px] font-normal text-[var(--text-secondary)]`}>
                          {b.statusLabel ?? "usado"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardSection>
          </div>
        </div>
      </main>
    </div>
  );
}

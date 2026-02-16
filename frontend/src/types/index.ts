// === Navegacion ===

export interface NavItem {
  icon: string;
  label: string;
  active?: boolean;
  to?: string;
}

export interface SidebarNavItem {
  icon: string;
  label: string;
  active?: boolean;
  to?: string;
}

// === Transacciones ===

export interface Transaction {
  icon: string;
  iconBg: string;
  name: string;
  date: string;
  amount: string;
  amountColor?: string;
}

export interface TransactionDetailed {
  icon: string;
  iconBg: string;
  name: string;
  category: string;
  amount: string;
  amountColor: string;
  meta: string;
}

export type TransactionType = "regular" | "saving";

// === Presupuestos ===

export interface BudgetListItem {
  icon: string;
  name: string;
  meta: string;
  percentText: string;
  percentColor: string;
  percentBg: string;
  barColor: string;
  barWidthPercent: number;
  spentAmount: string;
  totalAmount: string;
}

export interface BudgetSummaryItem {
  icon: string;
  iconBg: string;
  name: string;
  meta: string;
  percent: string;
  percentColor: string;
  statusLabel?: string;
  highlighted?: boolean;
}

export interface BudgetPlan {
  id: string;
  categoryId: string;
  name: string;
  limitAmount: number;
  month: string;
  createdAt: string;
  updatedAt: string;
}

// === Metas ===

export interface GoalCardSimple {
  id: string;
  icon: string;
  name: string;
  progressPercent: number;
  colorKey: GoalColorKey;
}

export interface GoalCardDetailed {
  icon: string;
  name: string;
  progressText: string;
  percent: string;
  barWidthPercent: number;
  highlighted?: boolean;
}

export interface GoalListItem {
  icon: string;
  name: string;
  date: string;
  percentText: string;
  percentColor: string;
  percentBg: string;
  barColor: string;
  barWidthPercent: number;
  currentAmount: string;
  targetAmount: string;
}

export interface GoalPlan {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  deadlineDate: string;
  icon: string;
  colorKey: GoalColorKey;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalColorKey =
  | "emerald"
  | "sky"
  | "indigo"
  | "violet"
  | "rose"
  | "amber"
  | "cyan"
  | "lime";

// === Planes ===

export interface PlanListItem {
  name: string;
  description: string;
  currentInstallment: number;
  totalInstallments: number;
  monthlyAmount: string;
  totalCost: string;
  highlighted?: boolean;
}

export interface PlanSummaryItem {
  name: string;
  detail: string;
  remaining: string;
  highlighted?: boolean;
}

// === Gastos ===

export interface SpendingCategory {
  label: string;
  percentage: number;
  color: string;
}

export interface SpendingCategoryDetailed {
  name: string;
  value: string;
  barColor: string;
  barWidthPercent: number;
}

// === Inversiones ===

export interface StockMetric {
  label: string;
  value: string;
  valueColor?: string;
}

export interface StockCard {
  ticker: string;
  name: string;
  exchange: string;
  changeText: string;
  changeColor: string;
  changeBg: string;
  row1: StockMetric[];
  row2: StockMetric[];
}

export interface InvestmentPosition {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  priceSource: "market" | "manual";
  manualPrice?: number;
  createdAt: string;
  updatedAt: string;
}

// === Estadisticas ===

export interface LegendItem {
  color: string;
  label: string;
}

export interface CategoryBreakdown {
  dotColor: string;
  name: string;
  value: string;
}

export interface DonutSegment {
  color: string;
  name: string;
  value: string;
  percentage: number;
}

export interface StatisticsFlowCategoryAmount {
  amount: number;
  category: string;
  color: string;
}

export interface StatisticsFlowDay {
  dateKey: string;
  dateLabel: string;
  expenseByCategory: StatisticsFlowCategoryAmount[];
  expenseTotal: number;
  incomeByCategory: StatisticsFlowCategoryAmount[];
  incomeTotal: number;
  label: string;
}

// === Cuotas ===

export interface CuotaItem {
  name: string;
  progressLabel: string;
  amount: string;
}

export interface CuotaPlan {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  startMonth: string;
  paidInstallmentsCount: number;
  categoryId?: string;
  subcategoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CuotaPlanStatus = "active" | "finished";

export interface CuotaPlanWithStatus extends CuotaPlan {
  status: CuotaPlanStatus;
}

// === Subcategorias ===

export interface SubcategoryItem {
  dotColor: string;
  name: string;
  amount: string;
  percent: string;
  barColor: string;
  barWidthPercent: number;
}

// === Usuario ===

export interface UserProfile {
  initial: string;
  name: string;
  email: string;
}

// === Tarjetas de estadisticas ===

export interface StatCard {
  label: string;
  value: string;
  change: string;
  changeColor: string;
}

// === Agrupacion de transacciones ===

export interface MonthGroup {
  title: string;
  total: string;
  totalColor?: string;
  transactions: TransactionDetailed[];
}

// === Configuracion ===

export interface SettingsItem {
  icon: string;
  name: string;
  description: string;
}

export interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export interface AppSettings {
  currency: "USD" | "EUR";
  language: "es" | "en";
  notificationsEnabled: boolean;
  theme: "light";
}

// === Cuentas ===

export interface Account {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

// === Categorias ===

export interface Category {
  id?: string;
  icon: string;
  iconBg: string;
  name: string;
  subcategoryCount: number;
  subcategories?: string[];
}

// === Grid ===

export interface GridOption {
  icon: string;
  label: string;
  to?: string;
}

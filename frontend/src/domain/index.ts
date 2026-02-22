export { DEFAULT_ACCOUNT_ID, DEFAULT_ACCOUNT_NAME } from "./accounts/repository";
export type {
  AccountItem,
  AccountsRepository,
  CreateAccountInput,
  UpdateAccountPatch,
} from "./accounts/repository";

export type {
  AppSettingsItem,
  AppSettingsRepository,
  UpdateAppSettingsPatch,
} from "./app-settings/repository";

export type {
  BudgetScopeRule,
  BudgetPlanItem,
  BudgetsRepository,
  CreateBudgetInput,
  UpdateBudgetPatch,
} from "./budgets/repository";
export {
  BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
  doesBudgetScopeMatchTransaction,
  doesBudgetScopeRuleMatchTransaction,
  doBudgetScopeRulesOverlap,
  getPrimaryBudgetCategoryId,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
} from "./budgets/budgetScopeMatcher";

export type {
  CategoriesRepository,
  CategoryItem,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "./categories/repository";
export {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  getCategoryColorOption,
} from "./categories/categoryAppearance";
export type { CategoryColorKey, CategoryColorOption } from "./categories/categoryAppearance";

export {
  compareDateParts,
  formatDateParts,
  getFulfilledInstallmentsByDate,
  getInstallmentDateParts,
  getInstallmentDateString,
  getTodayDatePartsLocal,
  isFutureDateParts,
  parseDateParts,
} from "./cuotas/cuotasDateUtils";
export type { DateParts } from "./cuotas/cuotasDateUtils";

export {
  getPendingInstallmentsTotalForMonth,
  isCuotaActiveInMonth,
} from "./cuotas/monthlyCuotaImpact";

export type {
  CreateCuotaInput,
  CuotaPlanItem,
  CuotasRepository,
  UpdateCuotaPatch,
} from "./cuotas/repository";

export {
  DEFAULT_GOAL_COLOR_KEY,
  getGoalCategoryName,
  getGoalColorOption,
  GOAL_COLOR_OPTIONS,
  GOAL_ICON_OPTIONS,
} from "./goals/goalAppearance";
export type { GoalColorOption } from "./goals/goalAppearance";

export type {
  CreateGoalInput,
  GoalPlanItem,
  GoalsRepository,
  UpdateGoalPatch,
} from "./goals/repository";

export type {
  AddInvestmentEntryInput,
  AddInvestmentEntryResult,
  AddSnapshotInput,
  CreateInvestmentInput,
  InvestmentEntryItem,
  InvestmentSnapshotItem,
  InvestmentPositionItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "./investments/repository";
export type {
  AssetKey,
  AssetRefs,
  AssetType,
  EntryType,
  HistoricalPoint,
  Position,
  PositionEntry,
  Snapshot,
  SnapshotSource,
} from "./investments/portfolioTypes";

export type {
  getCurrentMonthWindow,
  getMonthlyBalance,
  getTransactionDateForMonthBalance,
} from "./transactions/monthlyBalance";
export type { MonthWindow, MonthlyBalance } from "./transactions/monthlyBalance";

export { TRANSACTIONS_CHANGED_EVENT } from "./transactions/repository";
export type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "./transactions/repository";

export { buildStatisticsDailyFlow } from "./statistics/statisticsFlow";

export {
  DEFAULT_USD_RATE,
  getUsdRate,
  normalizeUsdRate,
  toArsTransactionAmount,
} from "./currency/transactionCurrency";
export type { TransactionInputCurrency } from "./currency/transactionCurrency";

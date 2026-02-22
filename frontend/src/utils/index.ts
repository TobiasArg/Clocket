export {
  formatCurrency,
  getGlobalCurrency,
  resolveLocaleForCurrency,
  setGlobalCurrency,
} from "./formatCurrency";
export type { FormatCurrencyOptions, SupportedCurrency } from "./formatCurrency";
export { navigateToPath } from "./navigation";
export { getPercentWidthClass } from "./percentWidthClass";
export { buildExportSnapshot, buildTransactionsCsv, downloadJsonExport, downloadTransactionsCsvExport } from "./settingsExport";
export { hashPin, isValidPin, verifyPin } from "./securityPin";
export { APP_SETTINGS_STORAGE_KEY, applyTheme, getStoredTheme, initializeThemeFromStorage, resolveStoredTheme } from "./theme";

export {
  DEFAULT_USD_RATE,
  getUsdRate,
  normalizeUsdRate,
  toArsTransactionAmount,
} from "@/domain/currency/transactionCurrency";

export {
  DEFAULT_GOAL_COLOR_KEY,
  getGoalCategoryName,
  getGoalColorOption,
  GOAL_COLOR_OPTIONS,
  GOAL_ICON_OPTIONS,
} from "@/domain/goals/goalAppearance";

export {
  getCurrentMonthWindow,
  getMonthlyBalance,
  getTransactionDateForMonthBalance,
} from "@/domain/transactions/monthlyBalance";

export { buildStatisticsDailyFlow } from "@/domain/statistics/statisticsFlow";

export {
  getPendingInstallmentsTotalForMonth,
  isCuotaActiveInMonth,
} from "@/domain/cuotas/monthlyCuotaImpact";

export {
  compareDateParts,
  formatDateParts,
  getFulfilledInstallmentsByDate,
  getInstallmentDateParts,
  getInstallmentDateString,
  getTodayDatePartsLocal,
  isFutureDateParts,
  parseDateParts,
} from "@/domain/cuotas/cuotasDateUtils";

export {
  fetchCryptoRate,
  fetchStockQuote,
  MarketQuoteApiError,
} from "@/data/http";

export {
  LocalStorageAccountsRepository,
  accountsRepository,
  LocalStorageAppSettingsRepository,
  appSettingsRepository,
  LocalStorageBudgetsRepository,
  budgetsRepository,
  LocalStorageCategoriesRepository,
  categoriesRepository,
  LocalStorageCuotasRepository,
  cuotasRepository,
  LocalStorageGoalsRepository,
  goalsRepository,
  LocalStorageInvestmentsPortfolioRepository,
  investmentsPortfolioRepository,
  LocalStorageInvestmentsRepository,
  investmentsRepository,
  LocalStorageTransactionsRepository,
  transactionsRepository,
} from "@/data/localStorage";

export { TRANSACTIONS_CHANGED_EVENT } from "@/domain/transactions/repository";

export type { MonthWindow, MonthlyBalance } from "@/domain/transactions/monthlyBalance";
export type { DateParts } from "@/domain/cuotas/cuotasDateUtils";

export {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_COLOR_KEY,
  DEFAULT_CATEGORY_ICON,
  getCategoryColorOption,
} from "@/domain/categories/categoryAppearance";

export type {
  AccountItem,
  AccountsRepository,
  CreateAccountInput,
  UpdateAccountPatch,
} from "@/domain/accounts/repository";
export {
  ACCOUNT_ICON_OPTIONS,
  DEFAULT_ACCOUNT_ICON,
  DEFAULT_ACCOUNT_ID,
  DEFAULT_ACCOUNT_NAME,
} from "@/domain/accounts/repository";

export type {
  AppSettingsItem,
  AppSettingsRepository,
  UpdateAppSettingsPatch,
} from "@/domain/app-settings/repository";

export type {
  BudgetScopeRule,
  BudgetPlanItem,
  BudgetsRepository,
  CreateBudgetInput,
  UpdateBudgetPatch,
} from "@/domain/budgets/repository";
export {
  BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
  doesBudgetScopeMatchTransaction,
  doesBudgetScopeRuleMatchTransaction,
  doBudgetScopeRulesOverlap,
  getPrimaryBudgetCategoryId,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
} from "@/domain/budgets/budgetScopeMatcher";

export type {
  CategoriesRepository,
  CategoryItem,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "@/domain/categories/repository";
export type { CategoryColorKey, CategoryColorOption } from "@/domain/categories/categoryAppearance";

export type {
  CreateCuotaInput,
  CuotaPlanItem,
  CuotasRepository,
  UpdateCuotaPatch,
} from "@/domain/cuotas/repository";

export type {
  CreateGoalInput,
  GoalPlanItem,
  GoalsRepository,
  UpdateGoalPatch,
} from "@/domain/goals/repository";

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
} from "@/domain/investments/portfolioTypes";

export type {
  AddInvestmentEntryInput,
  AddInvestmentEntryResult,
  CreateInvestmentInput,
  InvestmentEntryItem,
  InvestmentSnapshotItem,
  InvestmentPositionItem,
  InvestmentsRepository,
  AddSnapshotInput,
  UpdateInvestmentPatch,
} from "@/domain/investments/repository";

export type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "@/domain/transactions/repository";

export type { GoalColorOption } from "@/domain/goals/goalAppearance";
export type { TransactionInputCurrency } from "@/domain/currency/transactionCurrency";

export { formatCurrency } from "./formatCurrency";
export { navigateToPath } from "./navigation";
export { getPercentWidthClass } from "./percentWidthClass";

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
  AlpacaQuotesHttpRepository,
  fetchCryptoRate,
  fetchStockQuote,
  MarketQuoteApiError,
  marketQuotesRepository,
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

export type {
  AccountItem,
  AccountsRepository,
  CreateAccountInput,
  UpdateAccountPatch,
} from "@/domain/accounts/repository";

export type {
  AppSettingsItem,
  AppSettingsRepository,
  UpdateAppSettingsPatch,
} from "@/domain/app-settings/repository";

export type {
  BudgetPlanItem,
  BudgetsRepository,
  CreateBudgetInput,
  UpdateBudgetPatch,
} from "@/domain/budgets/repository";

export type {
  CategoriesRepository,
  CategoryItem,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "@/domain/categories/repository";

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
  HistoricalPoint,
  Position,
  Snapshot,
  SnapshotSource,
} from "@/domain/investments/portfolioTypes";

export type {
  CreateInvestmentInput,
  InvestmentSnapshotItem,
  InvestmentPositionItem,
  InvestmentsRepository,
  AddSnapshotInput,
  UpdateInvestmentPatch,
} from "@/domain/investments/repository";

export type {
  MarketQuote,
  MarketQuotesRepository,
  MarketQuotesResult,
  MarketUnavailableQuote,
} from "@/domain/market/quotesRepository";

export type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "@/domain/transactions/repository";

export type { GoalColorOption } from "@/domain/goals/goalAppearance";
export type { TransactionInputCurrency } from "@/domain/currency/transactionCurrency";

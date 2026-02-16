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
  BudgetPlanItem,
  BudgetsRepository,
  CreateBudgetInput,
  UpdateBudgetPatch,
} from "./budgets/repository";

export type {
  CategoriesRepository,
  CategoryItem,
  CreateCategoryInput,
  UpdateCategoryPatch,
} from "./categories/repository";

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
  CreateInvestmentInput,
  InvestmentPositionItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "./investments/repository";

export type {
  MarketQuote,
  MarketQuotesRepository,
  MarketQuotesResult,
  MarketUnavailableQuote,
} from "./market/quotesRepository";

export {
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

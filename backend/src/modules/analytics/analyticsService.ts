import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import type { AccountRecord, AccountsRepository } from "../accounts/accountsRepository";
import type { CategoryRecord } from "../categories/categoriesRepository";
import type { CategoriesRepository } from "../categories/categoriesRepository";
import type { GoalRecord, GoalsRepository } from "../goals/goalsRepository";
import type { InstallmentPlanRecord, InstallmentPlansRepository } from "../installments/installmentPlansRepository";
import type { TransactionRecord, TransactionsRepository } from "../transactions/transactionsRepository";
import { getUsdArsExchangeRate } from "../exchange-rates/exchangeRateService";
import {
  convertToDisplayCurrency,
  parseDisplayCurrency,
  type MoneyConversionContext,
} from "../exchange-rates/moneyConversion";
import type { ExchangeRateSuccessResponse } from "../exchange-rates/exchangeRateContracts";
import type {
  AnalyticsChartView,
  AnalyticsFlowBucketResponse,
  AnalyticsScope,
  AnalyticsTrendPointResponse,
  HomeAnalyticsResponse,
  StatisticsAnalyticsResponse,
} from "./analyticsContracts";

export interface AnalyticsService {
  getHomeAnalytics: (query?: Record<string, string | string[] | undefined>) => Promise<HomeAnalyticsResponse>;
  getStatisticsAnalytics: (query?: Record<string, string | string[] | undefined>) => Promise<StatisticsAnalyticsResponse>;
}

const FALLBACK_TAILWIND_COLOR = "bg-[#71717A]";
const FALLBACK_CSS_COLOR = "#71717A";
const INCOME_COLOR = "#16A34A";
const DONUT_COLORS = ["#DC2626", "#2563EB", "#EA580C", "#71717A"] as const;

const toCurrencyString = (value: number): string => (Number.isFinite(value) ? value : 0).toFixed(2);
const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};
const roundToSingleDecimal = (value: number): number => Math.round(value * 10) / 10;
const clampPercentValue = (value: number): number => Math.max(0, Math.min(100, value));
const isGoalSavingTransaction = (transaction: TransactionRecord): boolean => (
  transaction.transactionType === "saving" || Boolean(transaction.goalId)
);
const isExpenseTransaction = (transaction: TransactionRecord): boolean => toNumber(transaction.amount) < 0;
const getDisplayAmount = (
  amount: string | number,
  currency: "USD" | "ARS",
  context: MoneyConversionContext | null,
): number => convertToDisplayCurrency(amount, currency, context);

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
const buildMonthKey = (date: Date): string => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const buildDateKey = (date: Date): string => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
const startOfUtcDay = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const addDays = (date: Date, days: number): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
const addMonths = (date: Date, months: number): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
const startOfUtcWeek = (date: Date): Date => {
  const start = startOfUtcDay(date);
  const day = start.getUTCDay();
  return addDays(start, day === 0 ? -6 : 1 - day);
};
const parseTransactionDate = (transaction: TransactionRecord): Date | null => {
  const parsed = new Date(`${transaction.date.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const getMonthWindow = (now: Date): { start: Date; end: Date; periodMonth: string } => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { start, end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)), periodMonth: buildMonthKey(start) };
};
const within = (date: Date, range: { start: Date; end: Date } | null): boolean => !range || (date >= range.start && date < range.end);

const cssColorFromTailwindBg = (value: string | null | undefined, fallback = FALLBACK_CSS_COLOR): string => {
  const match = value?.match(/^bg-\[(#[0-9a-fA-F]{3,8})\]$/);
  return match?.[1] ?? fallback;
};

interface CategoryLookupEntry { name: string; icon: string; tailwindColor: string; cssColor: string }
const buildCategoryLookup = (categories: CategoryRecord[]): Map<string, CategoryLookupEntry> => {
  const map = new Map<string, CategoryLookupEntry>();
  categories.forEach((category) => {
    map.set(category.id, {
      name: category.name,
      icon: category.icon,
      tailwindColor: category.iconBg || FALLBACK_TAILWIND_COLOR,
      cssColor: cssColorFromTailwindBg(category.iconBg),
    });
  });
  return map;
};

const resolveCategory = (
  transaction: TransactionRecord,
  categoryLookup: Map<string, CategoryLookupEntry>,
  defaultLabel = "Uncategorized",
) => {
  const fromLookup = transaction.categoryId ? categoryLookup.get(transaction.categoryId) : undefined;
  return {
    key: transaction.categoryId ? `id:${transaction.categoryId}` : `name:${defaultLabel.toLocaleLowerCase("es-ES")}`,
    label: fromLookup?.name ?? defaultLabel,
    icon: fromLookup?.icon ?? transaction.uiIcon ?? "tag",
    tailwindColor: fromLookup?.tailwindColor ?? transaction.uiIconBg ?? FALLBACK_TAILWIND_COLOR,
    cssColor: fromLookup?.cssColor ?? cssColorFromTailwindBg(transaction.uiIconBg),
  };
};

const buildMoneySummary = (transactions: TransactionRecord[], conversionContext: MoneyConversionContext | null) => {
  let income = 0;
  let expense = 0;
  transactions.forEach((transaction) => {
    const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
    if (amount > 0) income += amount;
    if (amount < 0) expense += Math.abs(amount);
  });
  return { income, expense, net: income - expense };
};

const buildTrendBuckets = (view: AnalyticsChartView, now: Date) => {
  if (view === "day") {
    const start = addDays(startOfUtcDay(now), -6);
    return Array.from({ length: 7 }, (_, index) => ({ start: addDays(start, index), end: addDays(start, index + 1) }));
  }
  if (view === "week") {
    const start = addDays(startOfUtcWeek(now), -7 * 7);
    return Array.from({ length: 8 }, (_, index) => ({ start: addDays(start, index * 7), end: addDays(start, index * 7 + 7) }));
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  return Array.from({ length: 6 }, (_, index) => ({ start: addMonths(start, index), end: addMonths(start, index + 1) }));
};

const formatBucketLabel = (date: Date, view: AnalyticsChartView): string => {
  if (view === "day") return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", weekday: "short" }).format(date).replace(".", "").toUpperCase();
  if (view === "week") return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", day: "2-digit", month: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", month: "short" }).format(date).replace(".", "").toUpperCase();
};
const formatDateLabel = (date: Date): string => new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", day: "2-digit", month: "short" }).format(date).replace(".", "");
const buildFlowKey = (date: Date, view: AnalyticsChartView): string => view === "day" ? buildDateKey(date) : `${view === "week" ? buildDateKey(date) : buildMonthKey(date)}_${view}`;

const buildFlowBuckets = (
  transactions: TransactionRecord[],
  categories: Map<string, CategoryLookupEntry>,
  view: AnalyticsChartView,
  now: Date,
  conversionContext: MoneyConversionContext | null,
): AnalyticsFlowBucketResponse[] => buildTrendBuckets(view, now).map((bucket) => {
  const income = new Map<string, { amount: number; category: string; color: string }>();
  const expense = new Map<string, { amount: number; category: string; color: string }>();
  let incomeTotal = 0;
  let expenseTotal = 0;

  transactions.forEach((transaction) => {
    if (isGoalSavingTransaction(transaction)) return;
    const date = parseTransactionDate(transaction);
    if (!date || !within(date, bucket)) return;
    const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
    if (amount === 0) return;
    const resolved = resolveCategory(transaction, categories, amount > 0 ? "Ingreso" : "Uncategorized");
    const target = amount > 0 ? income : expense;
    const current = target.get(resolved.key);
    target.set(resolved.key, {
      amount: (current?.amount ?? 0) + Math.abs(amount),
      category: current?.category ?? resolved.label,
      color: current?.color ?? (amount > 0 ? INCOME_COLOR : resolved.cssColor),
    });
    if (amount > 0) incomeTotal += amount;
    else expenseTotal += Math.abs(amount);
  });

  const endInclusive = addDays(bucket.end, -1);
  const dateLabel = view === "month"
    ? new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", month: "long", year: "numeric" }).format(bucket.start)
    : `${formatDateLabel(bucket.start)} - ${formatDateLabel(endInclusive)}`;
  return {
    dateKey: buildFlowKey(bucket.start, view),
    dateLabel: view === "day" ? formatDateLabel(bucket.start) : dateLabel,
    rangeStart: toDateOnly(bucket.start),
    rangeEnd: toDateOnly(bucket.end),
    expenseByCategory: Array.from(expense.values()).sort((a, b) => b.amount - a.amount).map((entry) => ({ ...entry, amount: toCurrencyString(entry.amount) })),
    expenseTotal: toCurrencyString(expenseTotal),
    incomeByCategory: Array.from(income.values()).sort((a, b) => b.amount - a.amount).map((entry) => ({ ...entry, amount: toCurrencyString(entry.amount) })),
    incomeTotal: toCurrencyString(incomeTotal),
    label: formatBucketLabel(bucket.start, view),
  };
});

const buildGoalTrend = (
  savingsTransactions: TransactionRecord[],
  goals: GoalRecord[],
  view: AnalyticsChartView,
  now: Date,
  conversionContext: MoneyConversionContext | null,
): AnalyticsTrendPointResponse[] => {
  const buckets = buildTrendBuckets(view, now);
  const firstStart = buckets[0]?.start;
  const goalMetaById = new Map(goals.map((goal) => [goal.id, goal]));
  const totalGoalAmount = goals.reduce((sum, goal) => sum + Math.max(0, getDisplayAmount(goal.targetAmount, goal.currency, conversionContext)), 0);
  let cumulativeSaved = firstStart
    ? savingsTransactions.reduce((sum, transaction) => {
        const date = parseTransactionDate(transaction);
        const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
        return date && date < firstStart && amount < 0 ? sum + Math.abs(amount) : sum;
      }, 0)
    : 0;

  return buckets.map((bucket) => {
    const segmentMap = new Map<string, { amount: number; color: string; goalId: string | null; label: string }>();
    let bucketSaved = 0;
    savingsTransactions.forEach((transaction) => {
      const date = parseTransactionDate(transaction);
      const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
      if (!date || !within(date, bucket) || amount >= 0) return;
      const absolute = Math.abs(amount);
      const goalId = transaction.goalId || null;
      const goal = goalId ? goalMetaById.get(goalId) : undefined;
      const key = goalId ?? "__unassigned_goal__";
      const current = segmentMap.get(key);
      segmentMap.set(key, {
        amount: (current?.amount ?? 0) + absolute,
        color: current?.color ?? FALLBACK_CSS_COLOR,
        goalId,
        label: current?.label ?? goal?.title ?? "Sin meta",
      });
      bucketSaved += absolute;
    });
    cumulativeSaved += bucketSaved;
    return {
      bucketSaved: toCurrencyString(bucketSaved),
      cumulativeSaved: toCurrencyString(cumulativeSaved),
      goalSegments: Array.from(segmentMap.values()).sort((a, b) => b.amount - a.amount).map((segment) => ({
        ...segment,
        amount: toCurrencyString(segment.amount),
        percentOfBucket: bucketSaved > 0 ? roundToSingleDecimal(clampPercentValue((segment.amount / bucketSaved) * 100)) : 0,
      })),
      label: formatBucketLabel(bucket.start, view),
      rangeLabel: `${formatDateLabel(bucket.start)} - ${formatDateLabel(addDays(bucket.end, -1))}`,
      rangeStart: toDateOnly(bucket.start),
      rangeEnd: toDateOnly(bucket.end),
      value: roundToSingleDecimal(clampPercentValue(totalGoalAmount > 0 ? (cumulativeSaved / totalGoalAmount) * 100 : 0)),
    };
  });
};

const parseScope = (query: Record<string, string | string[] | undefined> | undefined): AnalyticsScope => {
  const value = query?.scope;
  if (value === undefined) return "month";
  if (value === "month" || value === "historical") return value;
  throw new CoreFinanceApiError("Query parameter 'scope' must be 'month' or 'historical'.", { code: "INVALID_REQUEST", status: 400 });
};

const validateOptionalView = (query: Record<string, string | string[] | undefined> | undefined): void => {
  const value = query?.view;
  if (value === undefined || value === "day" || value === "week" || value === "month") return;
  throw new CoreFinanceApiError("Query parameter 'view' must be 'day', 'week', or 'month'.", { code: "INVALID_REQUEST", status: 400 });
};

const isInstallmentActiveInMonth = (plan: InstallmentPlanRecord, now: Date): boolean => {
  const { periodMonth } = getMonthWindow(now);
  const start = plan.startMonth;
  const [yearValue, monthValue] = start.split("-");
  const end = buildMonthKey(new Date(Date.UTC(Number(yearValue), Number(monthValue) - 1 + plan.installmentsCount, 1)));
  return plan.paidInstallmentsCount < plan.installmentsCount && start <= periodMonth && periodMonth < end;
};

export const createAnalyticsService = ({
  accountsRepository,
  categoriesRepository,
  goalsRepository,
  installmentPlansRepository,
  transactionsRepository,
  exchangeRateProvider = getUsdArsExchangeRate,
  now = () => new Date(),
}: {
  accountsRepository: Pick<AccountsRepository, "listActive">;
  categoriesRepository: Pick<CategoriesRepository, "listActive">;
  goalsRepository: Pick<GoalsRepository, "listActive">;
  installmentPlansRepository: Pick<InstallmentPlansRepository, "listActive">;
  transactionsRepository: Pick<TransactionsRepository, "listActive">;
  exchangeRateProvider?: () => ExchangeRateSuccessResponse;
  now?: () => Date;
}): AnalyticsService => {
  const loadInputs = async () => {
    const [accounts, categories, goals, installments, transactions] = await Promise.all([
      accountsRepository.listActive(),
      categoriesRepository.listActive(),
      goalsRepository.listActive(),
      installmentPlansRepository.listActive(),
      transactionsRepository.listActive(),
    ]);
    return { accounts, categories, goals, installments, transactions };
  };

  return {
    async getHomeAnalytics(query = {}) {
      const currentNow = now();
      const displayCurrency = parseDisplayCurrency(query);
      const conversionContext = displayCurrency
        ? { currency: displayCurrency, exchangeRate: exchangeRateProvider() }
        : null;
      const { start, end, periodMonth } = getMonthWindow(currentNow);
      const { accounts, categories, goals, installments, transactions } = await loadInputs();
      const categoryLookup = buildCategoryLookup(categories);
      const monthlyTransactions = transactions.filter((transaction) => {
        const date = parseTransactionDate(transaction);
        return date ? within(date, { start, end }) : false;
      });
      const regularMonthlyTransactions = monthlyTransactions.filter((transaction) => !isGoalSavingTransaction(transaction));
      const monthlySummary = buildMoneySummary(regularMonthlyTransactions, conversionContext);
      const overallTransactions = transactions.filter((transaction) => !isGoalSavingTransaction(transaction));
      const overallSummary = buildMoneySummary(overallTransactions, conversionContext);
      const openingBalanceTotal = accounts.reduce((sum, account) => (
        sum + getDisplayAmount(account.balance, account.currency, conversionContext)
      ), 0);

      const categoryTotals = new Map<string, { amount: number; label: string; color: string }>();
      regularMonthlyTransactions.forEach((transaction) => {
        if (!isExpenseTransaction(transaction)) return;
        const resolved = resolveCategory(transaction, categoryLookup);
        const current = categoryTotals.get(resolved.key);
        categoryTotals.set(resolved.key, {
          amount: (current?.amount ?? 0) + Math.abs(getDisplayAmount(transaction.amount, transaction.currency, conversionContext)),
          label: current?.label ?? resolved.label,
          color: current?.color ?? resolved.tailwindColor,
        });
      });
      const spendingTotal = Array.from(categoryTotals.values()).reduce((sum, item) => sum + item.amount, 0);

      const savedByGoalId = new Map<string, number>();
      transactions.forEach((transaction) => {
        if (!transaction.goalId) return;
        const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
        if (amount < 0) savedByGoalId.set(transaction.goalId, (savedByGoalId.get(transaction.goalId) ?? 0) + Math.abs(amount));
      });

      const activeInstallments = installments.filter((plan) => isInstallmentActiveInMonth(plan, currentNow));
      return {
        periodMonth,
        totalBalance: toCurrencyString(openingBalanceTotal + overallSummary.net),
        monthlyIncome: toCurrencyString(monthlySummary.income),
        monthlyExpense: toCurrencyString(monthlySummary.expense),
        spendingTotal: toCurrencyString(monthlySummary.expense),
        spendingCategories: spendingTotal > 0
          ? Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount).slice(0, 4).map((item) => ({ label: item.label, percentage: Math.max(1, Math.round((item.amount / spendingTotal) * 100)), color: item.color }))
          : [],
        recentTransactions: [...transactions].sort((a, b) => (parseTransactionDate(b)?.getTime() ?? 0) - (parseTransactionDate(a)?.getTime() ?? 0)).slice(0, 3).map((transaction) => {
          const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
          const resolved = resolveCategory(transaction, categoryLookup, amount > 0 ? "Ingreso" : "Uncategorized");
          return { key: transaction.id, icon: transaction.uiIcon ?? resolved.icon, iconBg: transaction.uiIconBg ?? resolved.tailwindColor, name: transaction.name, date: transaction.date, amount: toCurrencyString(amount) };
        }),
        dashboardGoals: goals.map((goal) => ({
          id: goal.id,
          icon: goal.icon,
          name: goal.title,
          progressPercent: clampPercent(((savedByGoalId.get(goal.id) ?? 0) / Math.max(1, getDisplayAmount(goal.targetAmount, goal.currency, conversionContext))) * 100),
          colorKey: goal.colorKey,
        })).sort((a, b) => b.progressPercent - a.progressPercent).slice(0, 8),
        accountSummaries: accounts.map((account: AccountRecord) => {
          const summary = buildMoneySummary(transactions.filter((transaction) => transaction.accountId === account.id && !isGoalSavingTransaction(transaction)), conversionContext);
          const openingBalance = getDisplayAmount(account.balance, account.currency, conversionContext);
          return { id: account.id, label: account.name, balance: toCurrencyString(openingBalance + summary.net), income: toCurrencyString(summary.income), expense: toCurrencyString(summary.expense) };
        }),
        pendingInstallmentsTotal: toCurrencyString(activeInstallments.reduce((sum, plan) => sum + getDisplayAmount(plan.installmentAmount, plan.currency, conversionContext), 0)),
        visibleInstallments: activeInstallments.slice(0, 3).map((plan) => ({ name: plan.title, progressLabel: `${plan.paidInstallmentsCount}/${plan.installmentsCount} cuotas`, amount: toCurrencyString(getDisplayAmount(plan.installmentAmount, plan.currency, conversionContext)) })),
      };
    },

    async getStatisticsAnalytics(query = {}) {
      const scope = parseScope(query);
      validateOptionalView(query);
      const displayCurrency = parseDisplayCurrency(query);
      const conversionContext = displayCurrency
        ? { currency: displayCurrency, exchangeRate: exchangeRateProvider() }
        : null;
      const currentNow = now();
      const { start, end, periodMonth } = getMonthWindow(currentNow);
      const range = scope === "month" ? { start, end } : null;
      const { categories, goals, transactions } = await loadInputs();
      const categoryLookup = buildCategoryLookup(categories);
      const regularTransactions = transactions.filter((transaction) => !isGoalSavingTransaction(transaction));
      const savingsTransactions = transactions.filter(isGoalSavingTransaction);
      const scopedRegular = regularTransactions.filter((transaction) => {
        const date = parseTransactionDate(transaction);
        return date ? within(date, range) : false;
      });
      const scopedSavings = savingsTransactions.filter((transaction) => {
        const date = parseTransactionDate(transaction);
        return date ? within(date, range) : false;
      });
      const monthlyBalance = buildMoneySummary(scopedRegular, conversionContext);
      const expenseGroups = new Map<string, { amount: number; label: string; cssColor: string }>();
      scopedRegular.forEach((transaction) => {
        if (!isExpenseTransaction(transaction)) return;
        const resolved = resolveCategory(transaction, categoryLookup);
        const current = expenseGroups.get(resolved.key);
        expenseGroups.set(resolved.key, { amount: (current?.amount ?? 0) + Math.abs(getDisplayAmount(transaction.amount, transaction.currency, conversionContext)), label: current?.label ?? resolved.label, cssColor: current?.cssColor ?? resolved.cssColor });
      });
      const totalExpense = Array.from(expenseGroups.values()).reduce((sum, entry) => sum + entry.amount, 0);
      const categoryRows = totalExpense > 0
        ? Array.from(expenseGroups.values()).sort((a, b) => b.amount - a.amount).slice(0, 4).map((entry, index) => ({ dotColor: `bg-[${entry.cssColor || DONUT_COLORS[index % DONUT_COLORS.length]}]`, name: entry.label, amount: toCurrencyString(entry.amount), percentage: clampPercent((entry.amount / totalExpense) * 100) }))
        : [];
      const totalGoalsSaved = scopedSavings.reduce((sum, transaction) => {
        const amount = getDisplayAmount(transaction.amount, transaction.currency, conversionContext);
        return amount < 0 ? sum + Math.abs(amount) : sum;
      }, 0);
      const monthlyGoal = goals.reduce((sum, goal) => sum + Math.max(0, getDisplayAmount(goal.targetAmount, goal.currency, conversionContext)), 0);
      return {
        scope,
        periodMonth,
        monthlyBalance: { income: toCurrencyString(monthlyBalance.income), expense: toCurrencyString(monthlyBalance.expense), net: toCurrencyString(monthlyBalance.net) },
        monthlyGoal: toCurrencyString(monthlyGoal),
        totalGoalsSaved: toCurrencyString(totalGoalsSaved),
        monthlyTransactionsCount: scopedRegular.length,
        categoryRows,
        donutSegments: categoryRows.map((row, index) => ({ color: cssColorFromTailwindBg(row.dotColor, DONUT_COLORS[index % DONUT_COLORS.length]), name: row.name, amount: row.amount, percentage: row.percentage })),
        flowByView: {
          day: buildFlowBuckets(scopedRegular, categoryLookup, "day", currentNow, conversionContext),
          week: buildFlowBuckets(scopedRegular, categoryLookup, "week", currentNow, conversionContext),
          month: buildFlowBuckets(scopedRegular, categoryLookup, "month", currentNow, conversionContext),
        },
        trendPointsByView: {
          day: buildGoalTrend(scopedSavings, goals, "day", currentNow, conversionContext),
          week: buildGoalTrend(scopedSavings, goals, "week", currentNow, conversionContext),
          month: buildGoalTrend(scopedSavings, goals, "month", currentNow, conversionContext),
        },
      };
    },
  };
};

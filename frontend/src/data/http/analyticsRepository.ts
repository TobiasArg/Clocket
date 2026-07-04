import type { CategoryBreakdown, CuotaItem, DonutSegment, GoalCardSimple, SpendingCategory, StatisticsFlowDay } from "@/types";
import type { HomeBalanceSlide, HomeTransactionRow } from "@/hooks/useHomePageModel";
import type { StatisticsChartView, StatisticsScope, StatisticsTrendPoint } from "@/hooks/useStatisticsPageModel";
import { TRANSACTION_EXPENSE_TEXT_CLASS, TRANSACTION_INCOME_TEXT_CLASS } from "@/constants";
import { formatCurrency } from "@/utils/formatCurrency";
import type { SupportedCurrency } from "@/utils/formatCurrency";
import { coreFinanceHttpClient, withCoreFinanceErrors } from "./coreFinanceHttpClient";

interface BackendMoneySummary {
  income: string;
  expense: string;
  net: string;
}

interface BackendHomeAnalyticsResponse {
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpense: string;
  spendingTotal: string;
  spendingCategories: SpendingCategory[];
  recentTransactions: Array<{
    key: string;
    icon: string;
    iconBg: string;
    name: string;
    date: string;
    amount: string;
  }>;
  dashboardGoals: GoalCardSimple[];
  accountSummaries: Array<{
    id: string;
    label: string;
    balance: string;
    income: string;
    expense: string;
  }>;
  pendingInstallmentsTotal: string;
  visibleInstallments: CuotaItem[];
}

interface BackendStatisticsAnalyticsResponse {
  monthlyBalance: BackendMoneySummary;
  monthlyGoal: string;
  totalGoalsSaved: string;
  monthlyTransactionsCount: number;
  categoryRows: Array<{ dotColor: string; name: string; amount: string; percentage: number }>;
  donutSegments: Array<{ color: string; name: string; amount: string; percentage: number }>;
  flowByView: Record<StatisticsChartView, BackendFlowBucket[]>;
  trendPointsByView: Record<StatisticsChartView, BackendTrendPoint[]>;
}

interface BackendFlowBucket {
  dateKey: string;
  dateLabel: string;
  expenseByCategory: Array<{ amount: string; category: string; color: string }>;
  expenseTotal: string;
  incomeByCategory: Array<{ amount: string; category: string; color: string }>;
  incomeTotal: string;
  label: string;
}

interface BackendTrendPoint {
  bucketSaved: string;
  cumulativeSaved: string;
  goalSegments: Array<{ amount: string; color: string; goalId: string | null; label: string; percentOfBucket: number }>;
  label: string;
  rangeLabel: string;
  value: number;
}

export interface HomeAnalyticsModel {
  balanceSlides: HomeBalanceSlide[];
  dashboardGoals: GoalCardSimple[];
  displayedExpenseValue: string;
  displayedIncomeValue: string;
  displayedSpendingCategories: SpendingCategory[];
  displayedSpendingTotal: string;
  displayedTotalBalance: string;
  pendingInstallmentsLabel: string;
  recentTransactions: HomeTransactionRow[];
  visibleCuotas: CuotaItem[];
}

export interface StatisticsAnalyticsModel {
  categoryRows: CategoryBreakdown[];
  donutSegments: DonutSegment[];
  flowByView: Record<StatisticsChartView, StatisticsFlowDay[]>;
  monthlyBalance: { income: number; expense: number; net: number };
  monthlyGoal: number;
  monthlyTransactionsCount: number;
  resolvedCategoryTotal: string;
  resolvedSavingsBadge: string;
  resolvedSavingsGoalValue: string;
  resolvedSavingsValue: string;
  resolvedTotalExpenseValue: string;
  resolvedTotalIncomeValue: string;
  trendPointsByView: Record<StatisticsChartView, StatisticsTrendPoint[]>;
}

const RECENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const parseAmount = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const signedAmountLabel = (value: string, currency: SupportedCurrency): string => {
  const amount = parseAmount(value);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}${formatCurrency(Math.abs(amount), { currency })}`;
};

const formatBackendDate = (value: string): string => {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? value : RECENT_DATE_FORMATTER.format(parsed);
};

const mapFlowBucket = (bucket: BackendFlowBucket): StatisticsFlowDay => ({
  dateKey: bucket.dateKey,
  dateLabel: bucket.dateLabel,
  expenseByCategory: bucket.expenseByCategory.map((entry) => ({
    amount: parseAmount(entry.amount),
    category: entry.category,
    color: entry.color,
  })),
  expenseTotal: parseAmount(bucket.expenseTotal),
  incomeByCategory: bucket.incomeByCategory.map((entry) => ({
    amount: parseAmount(entry.amount),
    category: entry.category,
    color: entry.color,
  })),
  incomeTotal: parseAmount(bucket.incomeTotal),
  label: bucket.label,
});

const mapTrendPoint = (point: BackendTrendPoint): StatisticsTrendPoint => ({
  bucketSaved: parseAmount(point.bucketSaved),
  cumulativeSaved: parseAmount(point.cumulativeSaved),
  goalSegments: point.goalSegments.map((segment) => ({
    amount: parseAmount(segment.amount),
    color: segment.color,
    goalId: segment.goalId,
    label: segment.label,
    percentOfBucket: segment.percentOfBucket,
  })),
  label: point.label,
  rangeLabel: point.rangeLabel,
  value: point.value,
});

export class HttpAnalyticsRepository {
  public async getHome(currency: SupportedCurrency = "ARS"): Promise<HomeAnalyticsModel> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.get<BackendHomeAnalyticsResponse>("/api/analytics/home", {
        params: { currency },
      });
      const data = response.data;
      return {
        balanceSlides: [
          {
            id: "total-balance",
            label: "TOTAL BALANCE",
            balance: formatCurrency(parseAmount(data.totalBalance), { currency }),
            incomeValue: formatCurrency(parseAmount(data.monthlyIncome), { currency }),
            expenseValue: formatCurrency(parseAmount(data.monthlyExpense), { currency }),
          },
          ...data.accountSummaries.map((account) => ({
            id: account.id,
            label: account.label,
            balance: formatCurrency(parseAmount(account.balance), { currency }),
            incomeValue: formatCurrency(parseAmount(account.income), { currency }),
            expenseValue: formatCurrency(parseAmount(account.expense), { currency }),
          })),
        ],
        dashboardGoals: data.dashboardGoals,
        displayedExpenseValue: formatCurrency(parseAmount(data.monthlyExpense), { currency }),
        displayedIncomeValue: formatCurrency(parseAmount(data.monthlyIncome), { currency }),
        displayedSpendingCategories: data.spendingCategories,
        displayedSpendingTotal: formatCurrency(parseAmount(data.spendingTotal), { currency }),
        displayedTotalBalance: formatCurrency(parseAmount(data.totalBalance), { currency }),
        pendingInstallmentsLabel: formatCurrency(parseAmount(data.pendingInstallmentsTotal), { currency }),
        recentTransactions: data.recentTransactions.map((transaction) => {
          const amount = parseAmount(transaction.amount);
          return {
            key: transaction.key,
            icon: transaction.icon,
            iconBg: transaction.iconBg,
            name: transaction.name,
            date: formatBackendDate(transaction.date),
            amount: signedAmountLabel(transaction.amount, currency),
            amountColor: amount >= 0 ? TRANSACTION_INCOME_TEXT_CLASS : TRANSACTION_EXPENSE_TEXT_CLASS,
          };
        }),
        visibleCuotas: data.visibleInstallments.map((cuota) => ({
          ...cuota,
          amount: formatCurrency(parseAmount(cuota.amount), { currency }),
        })),
      };
    });
  }

  public async getStatistics(scope: StatisticsScope, currency: SupportedCurrency = "ARS"): Promise<StatisticsAnalyticsModel> {
    return withCoreFinanceErrors(async () => {
      const response = await coreFinanceHttpClient.get<BackendStatisticsAnalyticsResponse>(
        "/api/analytics/statistics",
        { params: { scope, currency } },
      );
      const data = response.data;
      const monthlyBalance = {
        income: parseAmount(data.monthlyBalance.income),
        expense: parseAmount(data.monthlyBalance.expense),
        net: parseAmount(data.monthlyBalance.net),
      };
      const monthlyGoal = parseAmount(data.monthlyGoal);
      const totalGoalsSaved = parseAmount(data.totalGoalsSaved);
      const savingsPercent = monthlyGoal > 0 ? Math.max(0, Math.min(100, Math.round((totalGoalsSaved / monthlyGoal) * 100))) : 0;
      return {
        categoryRows: data.categoryRows.map((row) => ({
          dotColor: row.dotColor,
          name: row.name,
          value: `${formatCurrency(parseAmount(row.amount), { currency })} (${row.percentage}%)`,
        })),
        donutSegments: data.donutSegments.map((segment) => ({
          color: segment.color,
          name: segment.name,
          percentage: segment.percentage,
          value: formatCurrency(parseAmount(segment.amount), { currency }),
        })),
        flowByView: {
          day: data.flowByView.day.map(mapFlowBucket),
          week: data.flowByView.week.map(mapFlowBucket),
          month: data.flowByView.month.map(mapFlowBucket),
        },
        monthlyBalance,
        monthlyGoal,
        monthlyTransactionsCount: data.monthlyTransactionsCount,
        resolvedCategoryTotal: formatCurrency(monthlyBalance.expense, { currency }),
        resolvedSavingsBadge: `${savingsPercent}%`,
        resolvedSavingsGoalValue: formatCurrency(monthlyGoal, { currency }),
        resolvedSavingsValue: formatCurrency(totalGoalsSaved, { currency }),
        resolvedTotalExpenseValue: formatCurrency(monthlyBalance.expense, { currency }),
        resolvedTotalIncomeValue: formatCurrency(monthlyBalance.income, { currency }),
        trendPointsByView: {
          day: data.trendPointsByView.day.map(mapTrendPoint),
          week: data.trendPointsByView.week.map(mapTrendPoint),
          month: data.trendPointsByView.month.map(mapTrendPoint),
        },
      };
    });
  }
}

export const httpAnalyticsRepository = new HttpAnalyticsRepository();

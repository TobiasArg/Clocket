import type { GoalColorKey } from "../goals/goalsRepository";

export type AnalyticsScope = "historical" | "month";
export type AnalyticsChartView = "day" | "week" | "month";

export interface AnalyticsMoneySummaryResponse {
  income: string;
  expense: string;
  net: string;
}

export interface AnalyticsSpendingCategoryResponse {
  label: string;
  percentage: number;
  color: string;
}

export interface AnalyticsRecentTransactionResponse {
  key: string;
  icon: string;
  iconBg: string;
  name: string;
  date: string;
  amount: string;
}

export interface AnalyticsGoalProgressResponse {
  id: string;
  icon: string;
  name: string;
  progressPercent: number;
  colorKey: GoalColorKey;
}

export interface AnalyticsAccountSummaryResponse {
  id: string;
  label: string;
  balance: string;
  income: string;
  expense: string;
}

export interface AnalyticsInstallmentSummaryResponse {
  name: string;
  progressLabel: string;
  amount: string;
}

export interface HomeAnalyticsResponse {
  periodMonth: string;
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpense: string;
  spendingTotal: string;
  spendingCategories: AnalyticsSpendingCategoryResponse[];
  recentTransactions: AnalyticsRecentTransactionResponse[];
  dashboardGoals: AnalyticsGoalProgressResponse[];
  accountSummaries: AnalyticsAccountSummaryResponse[];
  pendingInstallmentsTotal: string;
  visibleInstallments: AnalyticsInstallmentSummaryResponse[];
}

export interface AnalyticsCategoryBreakdownResponse {
  dotColor: string;
  name: string;
  amount: string;
  percentage: number;
}

export interface AnalyticsDonutSegmentResponse {
  color: string;
  name: string;
  amount: string;
  percentage: number;
}

export interface AnalyticsFlowCategoryAmountResponse {
  amount: string;
  category: string;
  color: string;
}

export interface AnalyticsFlowBucketResponse {
  dateKey: string;
  dateLabel: string;
  rangeStart: string;
  rangeEnd: string;
  expenseByCategory: AnalyticsFlowCategoryAmountResponse[];
  expenseTotal: string;
  incomeByCategory: AnalyticsFlowCategoryAmountResponse[];
  incomeTotal: string;
  label: string;
}

export interface AnalyticsTrendGoalSegmentResponse {
  amount: string;
  color: string;
  goalId: string | null;
  label: string;
  percentOfBucket: number;
}

export interface AnalyticsTrendPointResponse {
  bucketSaved: string;
  cumulativeSaved: string;
  goalSegments: AnalyticsTrendGoalSegmentResponse[];
  label: string;
  rangeLabel: string;
  rangeStart: string;
  rangeEnd: string;
  value: number;
}

export interface StatisticsAnalyticsResponse {
  scope: AnalyticsScope;
  periodMonth: string;
  monthlyBalance: AnalyticsMoneySummaryResponse;
  monthlyGoal: string;
  totalGoalsSaved: string;
  monthlyTransactionsCount: number;
  categoryRows: AnalyticsCategoryBreakdownResponse[];
  donutSegments: AnalyticsDonutSegmentResponse[];
  flowByView: Record<AnalyticsChartView, AnalyticsFlowBucketResponse[]>;
  trendPointsByView: Record<AnalyticsChartView, AnalyticsTrendPointResponse[]>;
}

import type { BudgetRecord, BudgetScopeRuleRecord } from "./budgetsRepository";

export type BudgetScopeRuleResponse = BudgetScopeRuleRecord;

export interface BudgetResponse {
  id: string;
  categoryId: string | null;
  name: string;
  limitAmount: string;
  currency: "USD" | "ARS";
  periodMonth: string;
  createdAt: string;
  updatedAt: string;
  scopeRules: BudgetScopeRuleResponse[];
}

export interface BudgetListResponse {
  budgets: BudgetResponse[];
}

export interface DeleteBudgetResponse {
  deleted: true;
}

export interface ClearBudgetsResponse {
  deletedCount: number;
}

export interface BudgetUsageSummaryResponse {
  totalLimitAmount: string;
  totalSpentAmount: string;
  rawProgress: number;
  clampedProgress: number;
  remainingAmount: string;
  overspentAmount: string;
}

export interface BudgetUsageItemResponse {
  budget: BudgetResponse;
  spentAmount: string;
  rawProgress: number;
  clampedProgress: number;
  remainingAmount: string;
  overspentAmount: string;
}

export interface BudgetUsageListResponse {
  periodMonth: string;
  summary: BudgetUsageSummaryResponse;
  budgets: BudgetUsageItemResponse[];
}

export interface BudgetUsageDetailGroupResponse {
  categoryId: string | null;
  subcategoryId: string | null;
  label: string;
  amount: string;
  percentageBasis: number;
}

export interface BudgetUsageDetailResponse {
  periodMonth: string;
  budget: BudgetResponse;
  usage: BudgetUsageItemResponse;
  groups: BudgetUsageDetailGroupResponse[];
}

export const toBudgetResponse = (budget: BudgetRecord): BudgetResponse => ({
  id: budget.id,
  categoryId: budget.categoryId,
  name: budget.name,
  limitAmount: budget.limitAmount,
  currency: budget.currency,
  periodMonth: budget.periodMonth,
  createdAt: budget.createdAt,
  updatedAt: budget.updatedAt,
  scopeRules: budget.scopeRules,
});

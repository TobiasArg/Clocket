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

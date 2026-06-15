import type { BudgetPlan, BudgetScopeRule } from "@/types";

export type BudgetPlanItem = BudgetPlan;
export type { BudgetScopeRule };

export interface CreateBudgetInput {
  name: string;
  limitAmount: number;
  month?: string;
  scopeRules: BudgetScopeRule[];
  categoryId?: string;
}

export interface UpdateBudgetPatch {
  categoryId?: string;
  name?: string;
  limitAmount?: number;
  month?: string;
  scopeRules?: BudgetScopeRule[];
}

export interface BudgetUsageSummaryItem {
  totalLimitAmount: number;
  totalSpentAmount: number;
  rawProgress: number;
  clampedProgress: number;
  remainingAmount: number;
  overspentAmount: number;
}

export interface BudgetUsageItem {
  budget: BudgetPlanItem;
  spentAmount: number;
  rawProgress: number;
  clampedProgress: number;
  remainingAmount: number;
  overspentAmount: number;
}

export interface BudgetUsageListResult {
  periodMonth: string;
  summary: BudgetUsageSummaryItem;
  budgets: BudgetUsageItem[];
}

export interface BudgetUsageDetailGroupItem {
  categoryId: string | null;
  subcategoryId: string | null;
  label: string;
  amount: number;
  percentageBasis: number;
}

export interface BudgetUsageDetailResult {
  periodMonth: string;
  budget: BudgetPlanItem;
  usage: BudgetUsageItem;
  groups: BudgetUsageDetailGroupItem[];
}

export interface BudgetsRepository {
  list: () => Promise<BudgetPlanItem[]>;
  getById: (id: string) => Promise<BudgetPlanItem | null>;
  listUsage: (periodMonth: string) => Promise<BudgetUsageListResult>;
  getUsageById: (id: string, periodMonth?: string) => Promise<BudgetUsageDetailResult | null>;
  create: (input: CreateBudgetInput) => Promise<BudgetPlanItem>;
  update: (id: string, patch: UpdateBudgetPatch) => Promise<BudgetPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

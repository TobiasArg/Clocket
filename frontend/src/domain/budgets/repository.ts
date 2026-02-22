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

export interface BudgetsRepository {
  list: () => Promise<BudgetPlanItem[]>;
  getById: (id: string) => Promise<BudgetPlanItem | null>;
  create: (input: CreateBudgetInput) => Promise<BudgetPlanItem>;
  update: (id: string, patch: UpdateBudgetPatch) => Promise<BudgetPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

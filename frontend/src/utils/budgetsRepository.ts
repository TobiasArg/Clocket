import type { BudgetPlan } from "@/types";

export type BudgetPlanItem = BudgetPlan;

export interface CreateBudgetInput {
  categoryId: string;
  name: string;
  limitAmount: number;
  month?: string;
}

export interface UpdateBudgetPatch {
  categoryId?: string;
  name?: string;
  limitAmount?: number;
  month?: string;
}

export interface BudgetsRepository {
  list: () => Promise<BudgetPlanItem[]>;
  getById: (id: string) => Promise<BudgetPlanItem | null>;
  create: (input: CreateBudgetInput) => Promise<BudgetPlanItem>;
  update: (id: string, patch: UpdateBudgetPatch) => Promise<BudgetPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

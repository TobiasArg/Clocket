import type { GoalColorKey, GoalPlan } from "@/types";

export type GoalPlanItem = GoalPlan;

export interface CreateGoalInput {
  colorKey: GoalColorKey;
  deadlineDate: string;
  description: string;
  icon: string;
  title: string;
  targetAmount: number;
}

export interface UpdateGoalPatch {
  colorKey?: GoalColorKey;
  deadlineDate?: string;
  description?: string;
  icon?: string;
  title?: string;
  targetAmount?: number;
  categoryId?: string;
}

export interface GoalsRepository {
  list: () => Promise<GoalPlanItem[]>;
  getById: (id: string) => Promise<GoalPlanItem | null>;
  create: (input: CreateGoalInput) => Promise<GoalPlanItem>;
  update: (id: string, patch: UpdateGoalPatch) => Promise<GoalPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

import type { GoalPlan } from "@/types";

export type GoalPlanItem = GoalPlan;

export interface CreateGoalInput {
  title: string;
  targetAmount: number;
  savedAmount?: number;
  targetMonth?: string;
}

export interface UpdateGoalPatch {
  title?: string;
  targetAmount?: number;
  savedAmount?: number;
  targetMonth?: string;
}

export interface GoalsRepository {
  list: () => Promise<GoalPlanItem[]>;
  getById: (id: string) => Promise<GoalPlanItem | null>;
  create: (input: CreateGoalInput) => Promise<GoalPlanItem>;
  update: (id: string, patch: UpdateGoalPatch) => Promise<GoalPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

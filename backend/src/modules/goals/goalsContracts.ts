import type { GoalRecord } from "./goalsRepository";

export type GoalResponse = Omit<GoalRecord, "deletedAt">;

export interface GoalListResponse {
  goals: GoalResponse[];
}

export interface DeleteGoalResponse {
  deleted: true;
}

export interface ClearGoalsResponse {
  deletedCount: number;
}

export const toGoalResponse = (goal: GoalRecord): GoalResponse => ({
  id: goal.id,
  title: goal.title,
  description: goal.description,
  targetAmount: goal.targetAmount,
  currency: goal.currency,
  deadlineDate: goal.deadlineDate,
  icon: goal.icon,
  colorKey: goal.colorKey,
  categoryId: goal.categoryId,
  subcategoryId: goal.subcategoryId,
  createdAt: goal.createdAt,
  updatedAt: goal.updatedAt,
});

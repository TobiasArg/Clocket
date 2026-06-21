import type { GoalDetailRecord, GoalEntryRecord, GoalProgressRecord, GoalsProgressSummaryRecord, GoalRecord } from "./goalsRepository";

export type GoalResponse = Omit<GoalRecord, "deletedAt">;

export type GoalEntryResponse = GoalEntryRecord;

export type GoalProgressResponse = Omit<GoalProgressRecord, "deletedAt">;

export type GoalDetailResponse = Omit<GoalDetailRecord, "deletedAt">;

export interface GoalListResponse {
  goals: GoalProgressResponse[];
  summary: GoalsProgressSummaryRecord;
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

export const toGoalProgressResponse = (goal: GoalProgressRecord): GoalProgressResponse => ({
  ...toGoalResponse(goal),
  savedAmount: goal.savedAmount,
  progressPercent: goal.progressPercent,
  entryCount: goal.entryCount,
});

export const toGoalDetailResponse = (goal: GoalDetailRecord): GoalDetailResponse => ({
  ...toGoalProgressResponse(goal),
  entries: goal.entries,
});

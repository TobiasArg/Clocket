import type { GoalColorKey, GoalPlan } from "@/types";

export type GoalPlanItem = GoalPlan;

export interface CreateGoalInput {
  colorKey: GoalColorKey;
  deadlineDate: string;
  description: string;
  icon: string;
  title: string;
  targetAmount: number;
  currency?: "USD" | "ARS";
}

export interface UpdateGoalPatch {
  colorKey?: GoalColorKey;
  deadlineDate?: string;
  description?: string;
  icon?: string;
  title?: string;
  targetAmount?: number;
  currency?: "USD" | "ARS";
  categoryId?: string;
}

export interface GoalProgressSummary {
  totalSaved: number;
  totalTarget: number;
  progressPercent: number;
}

export interface GoalEntryItem {
  id: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  goalId: string | null;
  transactionType: "regular" | "saving";
  name: string;
  amount: number;
  currency: "USD" | "ARS";
  date: string;
  notes: string | null;
  uiIcon: string | null;
  uiIconBg: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalDetailItem extends GoalPlanItem {
  savedAmount: number;
  progressPercent: number;
  entryCount: number;
  entries: GoalEntryItem[];
}

export type GoalDeleteResolutionInput =
  | { mode: "delete_entries" }
  | { mode: "redirect_goal"; targetGoalId: string }
  | { mode: "redirect_account"; targetAccountId: string };

export interface GoalDeleteResolutionResult {
  deleted: true;
  mode: GoalDeleteResolutionInput["mode"];
  resolvedEntriesCount: number;
}

export interface GoalsRepository {
  list: (currency?: "USD" | "ARS") => Promise<GoalPlanItem[]>;
  getById: (id: string, currency?: "USD" | "ARS") => Promise<GoalDetailItem | null>;
  create: (input: CreateGoalInput) => Promise<GoalPlanItem>;
  update: (id: string, patch: UpdateGoalPatch) => Promise<GoalPlanItem | null>;
  resolveDeletion: (id: string, input: GoalDeleteResolutionInput) => Promise<GoalDeleteResolutionResult | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

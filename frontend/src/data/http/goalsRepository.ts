import type { CreateGoalInput, GoalDeleteResolutionInput, GoalDeleteResolutionResult, GoalDetailItem, GoalEntryItem, GoalPlanItem, GoalsRepository, UpdateGoalPatch } from "@/domain/goals/repository";
import { coreFinanceHttpClient, isNotFoundError, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import { ensureFeatureBackendCleanStartCutover } from "./featureDomainCleanStart";

interface GoalResponse {
  id: string;
  title: string;
  description: string;
  targetAmount: string;
  deadlineDate: string;
  icon: string;
  colorKey: GoalPlanItem["colorKey"];
  categoryId: string | null;
  savedAmount?: string;
  progressPercent?: number;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
}
interface GoalEntryResponse {
  id: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  goalId: string | null;
  transactionType: "regular" | "saving";
  name: string;
  amount: string;
  currency: "USD" | "ARS";
  date: string;
  notes: string | null;
  uiIcon: string | null;
  uiIconBg: string | null;
  createdAt: string;
  updatedAt: string;
}
interface GoalDetailResponse extends GoalResponse { entries: GoalEntryResponse[] }
interface GoalListResponse { goals: GoalResponse[] }
interface DeleteResponse { deleted: true }
type ResolveGoalDeletionResponse = GoalDeleteResolutionResult;

const toNumber = (value: string | number | undefined): number => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toGoalItem = (goal: GoalResponse): GoalPlanItem => ({
  id: goal.id,
  title: goal.title,
  description: goal.description,
  targetAmount: toNumber(goal.targetAmount),
  deadlineDate: goal.deadlineDate,
  icon: goal.icon,
  colorKey: goal.colorKey,
  categoryId: goal.categoryId ?? "",
  ...(goal.savedAmount !== undefined ? { savedAmount: toNumber(goal.savedAmount) } : {}),
  ...(goal.progressPercent !== undefined ? { progressPercent: goal.progressPercent } : {}),
  ...(goal.entryCount !== undefined ? { entryCount: goal.entryCount } : {}),
  createdAt: goal.createdAt,
  updatedAt: goal.updatedAt,
});

const toGoalEntryItem = (entry: GoalEntryResponse): GoalEntryItem => ({
  ...entry,
  amount: toNumber(entry.amount),
});

const toGoalDetailItem = (goal: GoalDetailResponse): GoalDetailItem => ({
  ...toGoalItem(goal),
  savedAmount: toNumber(goal.savedAmount),
  progressPercent: goal.progressPercent ?? 0,
  entryCount: goal.entryCount ?? goal.entries.length,
  entries: goal.entries.map(toGoalEntryItem),
});

export class HttpGoalsRepository implements GoalsRepository {
  public constructor() { ensureFeatureBackendCleanStartCutover(); }

  public async list(): Promise<GoalPlanItem[]> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<GoalListResponse>("/api/goals")).data.goals.map(toGoalItem));
  }

  public async getById(id: string): Promise<GoalDetailItem | null> {
    try { return await withCoreFinanceErrors(async () => toGoalDetailItem((await coreFinanceHttpClient.get<GoalDetailResponse>(`/api/goals/${id}`)).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async create(input: CreateGoalInput): Promise<GoalPlanItem> {
    return withCoreFinanceErrors(async () => toGoalItem((await coreFinanceHttpClient.post<GoalResponse>("/api/goals", { ...input, syncGoalCategory: true })).data));
  }

  public async update(id: string, patch: UpdateGoalPatch): Promise<GoalPlanItem | null> {
    try { return await withCoreFinanceErrors(async () => toGoalItem((await coreFinanceHttpClient.patch<GoalResponse>(`/api/goals/${id}`, { ...patch, syncGoalCategory: true })).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async resolveDeletion(id: string, input: GoalDeleteResolutionInput): Promise<GoalDeleteResolutionResult | null> {
    try { return await withCoreFinanceErrors(async () => (await coreFinanceHttpClient.post<ResolveGoalDeletionResponse>(`/api/goals/${id}/resolve-deletion`, input)).data); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async remove(id: string): Promise<boolean> {
    try { return await withCoreFinanceErrors(async () => (await coreFinanceHttpClient.delete<DeleteResponse>(`/api/goals/${id}`)).data.deleted === true); }
    catch (error) { if (isNotFoundError(error)) return false; throw error; }
  }

  public async clearAll(): Promise<void> {
    await withCoreFinanceErrors(async () => { await coreFinanceHttpClient.delete("/api/goals"); });
  }
}

export const httpGoalsRepository: GoalsRepository = new HttpGoalsRepository();

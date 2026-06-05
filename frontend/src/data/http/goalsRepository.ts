import type { CreateGoalInput, GoalPlanItem, GoalsRepository, UpdateGoalPatch } from "@/domain/goals/repository";
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
  createdAt: string;
  updatedAt: string;
}
interface GoalListResponse { goals: GoalResponse[] }
interface DeleteResponse { deleted: true }

const toGoalItem = (goal: GoalResponse): GoalPlanItem => ({
  id: goal.id,
  title: goal.title,
  description: goal.description,
  targetAmount: Number(goal.targetAmount),
  deadlineDate: goal.deadlineDate,
  icon: goal.icon,
  colorKey: goal.colorKey,
  categoryId: goal.categoryId ?? "",
  createdAt: goal.createdAt,
  updatedAt: goal.updatedAt,
});

export class HttpGoalsRepository implements GoalsRepository {
  public constructor() { ensureFeatureBackendCleanStartCutover(); }

  public async list(): Promise<GoalPlanItem[]> {
    return withCoreFinanceErrors(async () => (await coreFinanceHttpClient.get<GoalListResponse>("/api/goals")).data.goals.map(toGoalItem));
  }

  public async getById(id: string): Promise<GoalPlanItem | null> {
    try { return await withCoreFinanceErrors(async () => toGoalItem((await coreFinanceHttpClient.get<GoalResponse>(`/api/goals/${id}`)).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async create(input: CreateGoalInput): Promise<GoalPlanItem> {
    return withCoreFinanceErrors(async () => toGoalItem((await coreFinanceHttpClient.post<GoalResponse>("/api/goals", { ...input, syncGoalCategory: true })).data));
  }

  public async update(id: string, patch: UpdateGoalPatch): Promise<GoalPlanItem | null> {
    try { return await withCoreFinanceErrors(async () => toGoalItem((await coreFinanceHttpClient.patch<GoalResponse>(`/api/goals/${id}`, { ...patch, syncGoalCategory: true })).data)); }
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

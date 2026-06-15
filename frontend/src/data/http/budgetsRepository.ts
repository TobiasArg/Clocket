import { BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN } from "@/domain/budgets/budgetScopeMatcher";
import type { BudgetPlanItem, BudgetScopeRule, BudgetUsageDetailResult, BudgetUsageItem, BudgetUsageListResult, BudgetUsageSummaryItem, BudgetsRepository, CreateBudgetInput, UpdateBudgetPatch } from "@/domain/budgets/repository";
import type { CategoryResponse } from "./categoriesRepository";
import { coreFinanceHttpClient, isNotFoundError, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import { ensureFeatureBackendCleanStartCutover } from "./featureDomainCleanStart";

interface BudgetScopeRuleResponse {
  id: string;
  categoryId: string;
  mode: "all_subcategories" | "selected_subcategories";
  selectedSubcategoryIds: string[];
  includeNoSubcategory: boolean;
}

interface BudgetResponse {
  id: string;
  categoryId: string | null;
  name: string;
  limitAmount: string;
  periodMonth: string;
  createdAt: string;
  updatedAt: string;
  scopeRules: BudgetScopeRuleResponse[];
}

interface BudgetListResponse { budgets: BudgetResponse[] }
interface DeleteResponse { deleted: true }
interface BudgetUsageSummaryResponse {
  totalLimitAmount: string;
  totalSpentAmount: string;
  rawProgress: number;
  clampedProgress: number;
  remainingAmount: string;
  overspentAmount: string;
}
interface BudgetUsageItemResponse {
  budget: BudgetResponse;
  spentAmount: string;
  rawProgress: number;
  clampedProgress: number;
  remainingAmount: string;
  overspentAmount: string;
}
interface BudgetUsageListResponse {
  periodMonth: string;
  summary: BudgetUsageSummaryResponse;
  budgets: BudgetUsageItemResponse[];
}
interface BudgetUsageDetailGroupResponse {
  categoryId: string | null;
  subcategoryId: string | null;
  label: string;
  amount: string;
  percentageBasis: number;
}
interface BudgetUsageDetailResponse {
  periodMonth: string;
  budget: BudgetResponse;
  usage: BudgetUsageItemResponse;
  groups: BudgetUsageDetailGroupResponse[];
}

const toNumber = (value: string): number => Number(value);

const currentYearMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const toScopePayload = (rule: BudgetScopeRule) => ({
  categoryId: rule.categoryId,
  mode: rule.mode,
  selectedSubcategoryNames: rule.subcategoryNames ?? [],
});

const buildSubcategoryNameResolver = async (): Promise<(categoryId: string, subcategoryIds: string[]) => string[]> => {
  const response = await coreFinanceHttpClient.get<{ categories: CategoryResponse[] }>("/api/categories");
  const namesByCategoryAndId = new Map<string, string>();
  response.data.categories.forEach((category) => {
    category.subcategories.forEach((subcategory) => {
      namesByCategoryAndId.set(`${category.id}:${subcategory.id}`, subcategory.name);
    });
  });

  return (categoryId, subcategoryIds) => subcategoryIds
    .map((subcategoryId) => namesByCategoryAndId.get(`${categoryId}:${subcategoryId}`))
    .filter((name): name is string => Boolean(name));
};

export class HttpBudgetsRepository implements BudgetsRepository {
  public constructor() {
    ensureFeatureBackendCleanStartCutover();
  }

  private mapBudgetWithResolver(budget: BudgetResponse, resolveNames: (categoryId: string, subcategoryIds: string[]) => string[]): BudgetPlanItem {
    return {
      id: budget.id,
      ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
      name: budget.name,
      limitAmount: toNumber(budget.limitAmount),
      month: budget.periodMonth,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
      scopeRules: budget.scopeRules.map((rule) => ({
        categoryId: rule.categoryId,
        mode: rule.mode,
        ...(rule.mode === "selected_subcategories"
          ? {
              subcategoryNames: [
                ...resolveNames(rule.categoryId, rule.selectedSubcategoryIds),
                ...(rule.includeNoSubcategory ? [BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN] : []),
              ],
            }
          : {}),
      })),
    };
  }

  private async mapBudget(budget: BudgetResponse): Promise<BudgetPlanItem> {
    const resolveNames = await buildSubcategoryNameResolver();
    return this.mapBudgetWithResolver(budget, resolveNames);
  }

  private mapUsageSummary(summary: BudgetUsageSummaryResponse): BudgetUsageSummaryItem {
    return {
      totalLimitAmount: toNumber(summary.totalLimitAmount),
      totalSpentAmount: toNumber(summary.totalSpentAmount),
      rawProgress: summary.rawProgress,
      clampedProgress: summary.clampedProgress,
      remainingAmount: toNumber(summary.remainingAmount),
      overspentAmount: toNumber(summary.overspentAmount),
    };
  }

  private mapUsageItem(item: BudgetUsageItemResponse, resolveNames: (categoryId: string, subcategoryIds: string[]) => string[]): BudgetUsageItem {
    return {
      budget: this.mapBudgetWithResolver(item.budget, resolveNames),
      spentAmount: toNumber(item.spentAmount),
      rawProgress: item.rawProgress,
      clampedProgress: item.clampedProgress,
      remainingAmount: toNumber(item.remainingAmount),
      overspentAmount: toNumber(item.overspentAmount),
    };
  }

  public async list(): Promise<BudgetPlanItem[]> {
    return withCoreFinanceErrors(async () => {
      const [response, resolveNames] = await Promise.all([
        coreFinanceHttpClient.get<BudgetListResponse>("/api/budgets"),
        buildSubcategoryNameResolver(),
      ]);
      return response.data.budgets.map((budget) => this.mapBudgetWithResolver(budget, resolveNames));
    });
  }

  public async getById(id: string): Promise<BudgetPlanItem | null> {
    try {
      return await withCoreFinanceErrors(async () => this.mapBudget((await coreFinanceHttpClient.get<BudgetResponse>(`/api/budgets/${id}`)).data));
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async listUsage(periodMonth: string): Promise<BudgetUsageListResult> {
    return withCoreFinanceErrors(async () => {
      const [response, resolveNames] = await Promise.all([
        coreFinanceHttpClient.get<BudgetUsageListResponse>("/api/budgets/usage", { params: { periodMonth } }),
        buildSubcategoryNameResolver(),
      ]);
      return {
        periodMonth: response.data.periodMonth,
        summary: this.mapUsageSummary(response.data.summary),
        budgets: response.data.budgets.map((item) => this.mapUsageItem(item, resolveNames)),
      };
    });
  }

  public async getUsageById(id: string, periodMonth?: string): Promise<BudgetUsageDetailResult | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const [response, resolveNames] = await Promise.all([
          coreFinanceHttpClient.get<BudgetUsageDetailResponse>(`/api/budgets/${id}/usage`, {
            params: periodMonth ? { periodMonth } : {},
          }),
          buildSubcategoryNameResolver(),
        ]);
        return {
          periodMonth: response.data.periodMonth,
          budget: this.mapBudgetWithResolver(response.data.budget, resolveNames),
          usage: this.mapUsageItem(response.data.usage, resolveNames),
          groups: response.data.groups.map((group) => ({
            categoryId: group.categoryId,
            subcategoryId: group.subcategoryId,
            label: group.label,
            amount: toNumber(group.amount),
            percentageBasis: group.percentageBasis,
          })),
        };
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async create(input: CreateBudgetInput): Promise<BudgetPlanItem> {
    return withCoreFinanceErrors(async () => this.mapBudget((await coreFinanceHttpClient.post<BudgetResponse>("/api/budgets", {
      name: input.name,
      limitAmount: input.limitAmount,
      periodMonth: input.month ?? currentYearMonth(),
      categoryId: input.categoryId,
      scopeRules: input.scopeRules.map(toScopePayload),
    })).data));
  }

  public async update(id: string, patch: UpdateBudgetPatch): Promise<BudgetPlanItem | null> {
    try {
      return await withCoreFinanceErrors(async () => this.mapBudget((await coreFinanceHttpClient.patch<BudgetResponse>(`/api/budgets/${id}`, {
        ...patch,
        ...(patch.month !== undefined ? { periodMonth: patch.month } : {}),
        ...(patch.scopeRules !== undefined ? { scopeRules: patch.scopeRules.map(toScopePayload) } : {}),
      })).data));
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async remove(id: string): Promise<boolean> {
    try {
      return await withCoreFinanceErrors(async () => (await coreFinanceHttpClient.delete<DeleteResponse>(`/api/budgets/${id}`)).data.deleted === true);
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
  }

  public async clearAll(): Promise<void> {
    await withCoreFinanceErrors(async () => { await coreFinanceHttpClient.delete("/api/budgets"); });
  }
}

export const httpBudgetsRepository: BudgetsRepository = new HttpBudgetsRepository();

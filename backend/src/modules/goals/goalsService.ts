import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { isValidCurrency, parseJsonObjectBody, readDateOnlyInput, readDecimalInput, readOptionalNullableString, readRequiredString } from "../core-finance/coreFinanceRequest";
import { getUsdArsExchangeRate } from "../exchange-rates/exchangeRateService";
import { parseDisplayCurrency } from "../exchange-rates/moneyConversion";
import type { ExchangeRateSuccessResponse } from "../exchange-rates/exchangeRateContracts";
import { toGoalDetailResponse, toGoalProgressResponse, toGoalResponse, type ClearGoalsResponse, type DeleteGoalResponse, type GoalDetailResponse, type GoalListResponse, type GoalResponse, type ResolveGoalDeletionResponse } from "./goalsContracts";
import { GoalsRepositoryError, type CreateGoalInput, type GoalColorKey, type GoalsRepository, type ResolveGoalDeletionInput, type UpdateGoalInput } from "./goalsRepository";

export interface GoalsService {
  listGoals: (query?: Record<string, string | string[] | undefined>) => Promise<GoalListResponse>;
  getGoal: (id: string, query?: Record<string, string | string[] | undefined>) => Promise<GoalDetailResponse>;
  createGoal: (body: unknown) => Promise<GoalResponse>;
  updateGoal: (id: string, body: unknown) => Promise<GoalResponse>;
  resolveGoalDeletion: (id: string, body: unknown) => Promise<ResolveGoalDeletionResponse>;
  deleteGoal: (id: string) => Promise<DeleteGoalResponse>;
  clearGoals: () => Promise<ClearGoalsResponse>;
}

const isGoalColorKey = (value: unknown): value is GoalColorKey => (
  value === "emerald" || value === "sky" || value === "indigo" || value === "violet" ||
  value === "rose" || value === "amber" || value === "cyan" || value === "lime"
);

const readBoolean = (body: Record<string, unknown>, key: string): boolean | undefined => {
  if (!(key in body)) return undefined;
  if (typeof body[key] === "boolean") return body[key];
  throw new CoreFinanceApiError(`Field '${key}' must be a boolean.`, { code: "INVALID_REQUEST", status: 400 });
};

export const createGoalsService = ({
  repository,
  exchangeRateProvider = getUsdArsExchangeRate,
}: {
  repository: GoalsRepository;
  exchangeRateProvider?: () => ExchangeRateSuccessResponse;
}): GoalsService => {
  const requireFound = <T>(record: T | null, id: string): T => {
    if (!record) throw new CoreFinanceApiError(`Goal '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
    return record;
  };

  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof GoalsRepositoryError) {
        throw new CoreFinanceApiError(error.message, { code: error.code, status: 400 });
      }
      throw error;
    }
  };

  const parseCreate = (body: unknown): CreateGoalInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const title = readRequiredString(parsedBody.value, "title");
    if (!title.ok) throw new CoreFinanceApiError(title.response.error, title.response);
    const description = readRequiredString(parsedBody.value, "description");
    if (!description.ok) throw new CoreFinanceApiError(description.response.error, description.response);
    const targetAmount = readDecimalInput(parsedBody.value, "targetAmount", true);
    if (!targetAmount.ok || targetAmount.value === undefined) throw new CoreFinanceApiError(targetAmount.ok ? "Goal targetAmount is required." : targetAmount.response.error, targetAmount.ok ? { code: "INVALID_REQUEST", status: 400 } : targetAmount.response);
    const deadlineDate = readDateOnlyInput(parsedBody.value, "deadlineDate", true);
    if (!deadlineDate.ok || deadlineDate.value === undefined) throw new CoreFinanceApiError(deadlineDate.ok ? "Goal deadlineDate is required." : deadlineDate.response.error, deadlineDate.ok ? { code: "INVALID_REQUEST", status: 400 } : deadlineDate.response);
    const icon = readRequiredString(parsedBody.value, "icon");
    if (!icon.ok) throw new CoreFinanceApiError(icon.response.error, icon.response);
    if (parsedBody.value.currency !== undefined && !isValidCurrency(parsedBody.value.currency)) throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
    if (parsedBody.value.colorKey !== undefined && !isGoalColorKey(parsedBody.value.colorKey)) throw new CoreFinanceApiError("Invalid goal color key.", { code: "INVALID_REQUEST", status: 400 });
    return {
      title: title.value,
      description: description.value,
      targetAmount: targetAmount.value,
      deadlineDate: deadlineDate.value,
      icon: icon.value,
      ...(parsedBody.value.currency !== undefined ? { currency: parsedBody.value.currency } : {}),
      ...(parsedBody.value.colorKey !== undefined ? { colorKey: parsedBody.value.colorKey } : {}),
      categoryId: readOptionalNullableString(parsedBody.value, "categoryId") ?? undefined,
      subcategoryId: readOptionalNullableString(parsedBody.value, "subcategoryId") ?? undefined,
      syncGoalCategory: readBoolean(parsedBody.value, "syncGoalCategory"),
    };
  };

  const parseUpdate = (body: unknown): UpdateGoalInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateGoalInput = {};
    if ("title" in parsedBody.value) {
      const title = readRequiredString(parsedBody.value, "title");
      if (!title.ok) throw new CoreFinanceApiError(title.response.error, title.response);
      patch.title = title.value;
    }
    if ("description" in parsedBody.value) {
      const description = readRequiredString(parsedBody.value, "description");
      if (!description.ok) throw new CoreFinanceApiError(description.response.error, description.response);
      patch.description = description.value;
    }
    if ("targetAmount" in parsedBody.value) {
      const targetAmount = readDecimalInput(parsedBody.value, "targetAmount", true);
      if (!targetAmount.ok || targetAmount.value === undefined) throw new CoreFinanceApiError(targetAmount.ok ? "Goal targetAmount is required." : targetAmount.response.error, targetAmount.ok ? { code: "INVALID_REQUEST", status: 400 } : targetAmount.response);
      patch.targetAmount = targetAmount.value;
    }
    if ("deadlineDate" in parsedBody.value) {
      const deadlineDate = readDateOnlyInput(parsedBody.value, "deadlineDate", true);
      if (!deadlineDate.ok || deadlineDate.value === undefined) throw new CoreFinanceApiError(deadlineDate.ok ? "Goal deadlineDate is required." : deadlineDate.response.error, deadlineDate.ok ? { code: "INVALID_REQUEST", status: 400 } : deadlineDate.response);
      patch.deadlineDate = deadlineDate.value;
    }
    if ("icon" in parsedBody.value) {
      const icon = readRequiredString(parsedBody.value, "icon");
      if (!icon.ok) throw new CoreFinanceApiError(icon.response.error, icon.response);
      patch.icon = icon.value;
    }
    if ("currency" in parsedBody.value) {
      if (!isValidCurrency(parsedBody.value.currency)) throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
      patch.currency = parsedBody.value.currency;
    }
    if ("colorKey" in parsedBody.value) {
      if (!isGoalColorKey(parsedBody.value.colorKey)) throw new CoreFinanceApiError("Invalid goal color key.", { code: "INVALID_REQUEST", status: 400 });
      patch.colorKey = parsedBody.value.colorKey;
    }
    for (const key of ["categoryId", "subcategoryId"] as const) {
      const value = readOptionalNullableString(parsedBody.value, key);
      if (value !== undefined) patch[key] = value;
    }
    const syncGoalCategory = readBoolean(parsedBody.value, "syncGoalCategory");
    if (syncGoalCategory !== undefined) patch.syncGoalCategory = syncGoalCategory;
    return patch;
  };

  const parseResolveDeletion = (body: unknown): ResolveGoalDeletionInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);

    const mode = parsedBody.value.mode;
    if (mode === "delete_entries") {
      return { mode };
    }
    if (mode === "redirect_goal") {
      const targetGoal = readRequiredString(parsedBody.value, "targetGoalId");
      if (!targetGoal.ok) throw new CoreFinanceApiError(targetGoal.response.error, targetGoal.response);
      return { mode, targetGoalId: targetGoal.value };
    }
    if (mode === "redirect_account") {
      const targetAccount = readRequiredString(parsedBody.value, "targetAccountId");
      if (!targetAccount.ok) throw new CoreFinanceApiError(targetAccount.response.error, targetAccount.response);
      return { mode, targetAccountId: targetAccount.value };
    }

    throw new CoreFinanceApiError("Field 'mode' must be one of 'delete_entries', 'redirect_goal', or 'redirect_account'.", { code: "INVALID_REQUEST", status: 400 });
  };

  return {
    async listGoals(query = {}) {
      const displayCurrency = parseDisplayCurrency(query);
      const conversionContext = displayCurrency
        ? { currency: displayCurrency, exchangeRate: exchangeRateProvider() }
        : null;
      const result = await repository.listActiveWithProgress(conversionContext);
      return {
        goals: result.goals.map(toGoalProgressResponse),
        summary: result.summary,
      };
    },
    async getGoal(id, query = {}) {
      const displayCurrency = parseDisplayCurrency(query);
      const conversionContext = displayCurrency
        ? { currency: displayCurrency, exchangeRate: exchangeRateProvider() }
        : null;
      return toGoalDetailResponse(requireFound(await repository.getByIdWithProgress(id, conversionContext), id));
    },
    async createGoal(body) {
      return toGoalResponse(await run(() => repository.create(parseCreate(body))));
    },
    async updateGoal(id, body) {
      return toGoalResponse(requireFound(await run(() => repository.update(id, parseUpdate(body))), id));
    },
    async resolveGoalDeletion(id, body) {
      return requireFound(await run(() => repository.resolveDeletion(id, parseResolveDeletion(body))), id);
    },
    async deleteGoal(id) {
      if (!await repository.softDelete(id)) throw new CoreFinanceApiError(`Goal '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
      return { deleted: true };
    },
    async clearGoals() {
      return { deletedCount: await repository.softDeleteAll() };
    },
  };
};

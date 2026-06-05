import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import {
  isValidCurrency,
  parseJsonObjectBody,
  readDecimalInput,
  readOptionalNullableString,
  readRequiredString,
  readYearMonthInput,
} from "../core-finance/coreFinanceRequest";
import { toBudgetResponse, type BudgetListResponse, type BudgetResponse, type ClearBudgetsResponse, type DeleteBudgetResponse } from "./budgetsContracts";
import { BudgetsRepositoryError, type BudgetScopeMode, type BudgetScopeRuleInput, type BudgetsRepository, type CreateBudgetInput, type UpdateBudgetInput } from "./budgetsRepository";

export interface BudgetsService {
  listBudgets: (query?: Record<string, string | string[] | undefined>) => Promise<BudgetListResponse>;
  getBudget: (id: string) => Promise<BudgetResponse>;
  createBudget: (body: unknown) => Promise<BudgetResponse>;
  updateBudget: (id: string, body: unknown) => Promise<BudgetResponse>;
  deleteBudget: (id: string) => Promise<DeleteBudgetResponse>;
  clearBudgets: () => Promise<ClearBudgetsResponse>;
}

const isBudgetScopeMode = (value: unknown): value is BudgetScopeMode => (
  value === "all_subcategories" || value === "selected_subcategories"
);

const readStringArray = (body: Record<string, unknown>, key: string): string[] | undefined => {
  const value = body[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new CoreFinanceApiError(`Field '${key}' must be an array of strings.`, { code: "INVALID_REQUEST", status: 400 });
  }
  return value;
};

const parseScopeRules = (body: Record<string, unknown>, required: boolean): BudgetScopeRuleInput[] | undefined => {
  const value = body.scopeRules;
  if (value === undefined && !required) return undefined;
  if (!Array.isArray(value)) {
    throw new CoreFinanceApiError("Field 'scopeRules' must be an array.", { code: "INVALID_REQUEST", status: 400 });
  }

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new CoreFinanceApiError(`Scope rule at index ${index} must be a JSON object.`, { code: "INVALID_REQUEST", status: 400 });
    }
    const scope = item as Record<string, unknown>;
    const categoryId = readRequiredString(scope, "categoryId");
    if (!categoryId.ok) throw new CoreFinanceApiError(categoryId.response.error, categoryId.response);
    if (!isBudgetScopeMode(scope.mode)) {
      throw new CoreFinanceApiError("Budget scope rule mode must be 'all_subcategories' or 'selected_subcategories'.", { code: "INVALID_REQUEST", status: 400 });
    }
    return {
      categoryId: categoryId.value,
      mode: scope.mode,
      selectedSubcategoryIds: readStringArray(scope, "selectedSubcategoryIds"),
      selectedSubcategoryNames: readStringArray(scope, "selectedSubcategoryNames"),
    };
  });
};

const mapBudgetsRepositoryError = (error: BudgetsRepositoryError): never => {
  const status = error.code === "OVERLAPPING_BUDGET" ? 409 : 400;
  throw new CoreFinanceApiError(error.message, { code: error.code, status });
};

export const createBudgetsService = ({ repository }: { repository: BudgetsRepository }): BudgetsService => {
  const requireFound = <T>(record: T | null, id: string): T => {
    if (!record) throw new CoreFinanceApiError(`Budget '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
    return record;
  };

  const parseCreate = (body: unknown): CreateBudgetInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const name = readRequiredString(parsedBody.value, "name");
    if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
    const limitAmount = readDecimalInput(parsedBody.value, "limitAmount", true);
    if (!limitAmount.ok || limitAmount.value === undefined) throw new CoreFinanceApiError(limitAmount.ok ? "Budget limitAmount is required." : limitAmount.response.error, limitAmount.ok ? { code: "INVALID_REQUEST", status: 400 } : limitAmount.response);
    const periodMonth = readYearMonthInput(parsedBody.value, "periodMonth", true);
    if (!periodMonth.ok || periodMonth.value === undefined) throw new CoreFinanceApiError(periodMonth.ok ? "Budget periodMonth is required." : periodMonth.response.error, periodMonth.ok ? { code: "INVALID_REQUEST", status: 400 } : periodMonth.response);
    if (parsedBody.value.currency !== undefined && !isValidCurrency(parsedBody.value.currency)) {
      throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
    }
    return {
      name: name.value,
      limitAmount: limitAmount.value,
      periodMonth: periodMonth.value,
      scopeRules: parseScopeRules(parsedBody.value, true) ?? [],
      ...(parsedBody.value.currency !== undefined ? { currency: parsedBody.value.currency } : {}),
    };
  };

  const parseUpdate = (body: unknown): UpdateBudgetInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateBudgetInput = {};
    if ("name" in parsedBody.value) {
      const name = readRequiredString(parsedBody.value, "name");
      if (!name.ok) throw new CoreFinanceApiError(name.response.error, name.response);
      patch.name = name.value;
    }
    if ("limitAmount" in parsedBody.value) {
      const limitAmount = readDecimalInput(parsedBody.value, "limitAmount", true);
      if (!limitAmount.ok || limitAmount.value === undefined) throw new CoreFinanceApiError(limitAmount.ok ? "Budget limitAmount is required." : limitAmount.response.error, limitAmount.ok ? { code: "INVALID_REQUEST", status: 400 } : limitAmount.response);
      patch.limitAmount = limitAmount.value;
    }
    if ("periodMonth" in parsedBody.value) {
      const periodMonth = readYearMonthInput(parsedBody.value, "periodMonth", true);
      if (!periodMonth.ok || periodMonth.value === undefined) throw new CoreFinanceApiError(periodMonth.ok ? "Budget periodMonth is required." : periodMonth.response.error, periodMonth.ok ? { code: "INVALID_REQUEST", status: 400 } : periodMonth.response);
      patch.periodMonth = periodMonth.value;
    }
    if ("currency" in parsedBody.value) {
      if (!isValidCurrency(parsedBody.value.currency)) throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
      patch.currency = parsedBody.value.currency;
    }
    if ("scopeRules" in parsedBody.value) patch.scopeRules = parseScopeRules(parsedBody.value, true) ?? [];
    const categoryId = readOptionalNullableString(parsedBody.value, "categoryId");
    if (categoryId !== undefined && !patch.scopeRules && categoryId) {
      patch.scopeRules = [{ categoryId, mode: "all_subcategories" }];
    }
    return patch;
  };

  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof BudgetsRepositoryError) mapBudgetsRepositoryError(error);
      throw error;
    }
  };

  return {
    async listBudgets(query = {}) {
      const month = typeof query.periodMonth === "string" ? query.periodMonth : typeof query.month === "string" ? query.month : undefined;
      const budgets = await run(() => repository.listActive(month));
      return { budgets: budgets.map(toBudgetResponse) };
    },
    async getBudget(id) {
      return toBudgetResponse(requireFound(await run(() => repository.getById(id)), id));
    },
    async createBudget(body) {
      return toBudgetResponse(await run(() => repository.create(parseCreate(body))));
    },
    async updateBudget(id, body) {
      return toBudgetResponse(requireFound(await run(() => repository.update(id, parseUpdate(body))), id));
    },
    async deleteBudget(id) {
      if (!await repository.softDelete(id)) throw new CoreFinanceApiError(`Budget '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
      return { deleted: true };
    },
    async clearBudgets() {
      return { deletedCount: await repository.softDeleteAll() };
    },
  };
};

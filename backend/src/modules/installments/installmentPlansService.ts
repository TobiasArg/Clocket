import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { isValidCurrency, parseJsonObjectBody, readDecimalInput, readIntegerInput, readOptionalNullableString, readRequiredString, readYearMonthInput } from "../core-finance/coreFinanceRequest";
import { toInstallmentPlanResponse, type ClearInstallmentPlansResponse, type DeleteInstallmentPlanResponse, type InstallmentPlanListResponse, type InstallmentPlanResponse } from "./installmentPlansContracts";
import { InstallmentPlansRepositoryError, type CreateInstallmentPlanInput, type InstallmentPlansRepository, type UpdateInstallmentPlanInput } from "./installmentPlansRepository";

export interface InstallmentPlansService {
  listInstallmentPlans: () => Promise<InstallmentPlanListResponse>;
  getInstallmentPlan: (id: string) => Promise<InstallmentPlanResponse>;
  createInstallmentPlan: (body: unknown) => Promise<InstallmentPlanResponse>;
  updateInstallmentPlan: (id: string, body: unknown) => Promise<InstallmentPlanResponse>;
  deleteInstallmentPlan: (id: string) => Promise<DeleteInstallmentPlanResponse>;
  clearInstallmentPlans: () => Promise<ClearInstallmentPlansResponse>;
}

const assertPositive = (value: string | number | undefined, key: string): string | number => {
  if (value === undefined || Number(value) <= 0) {
    throw new CoreFinanceApiError(`Field '${key}' must be greater than zero.`, { code: "INVALID_REQUEST", status: 400 });
  }
  return value;
};

const assertInstallmentCounts = (installmentsCount?: number, paidInstallmentsCount?: number): void => {
  if (installmentsCount !== undefined && installmentsCount <= 0) {
    throw new CoreFinanceApiError("Installments count must be greater than zero.", { code: "INVALID_REQUEST", status: 400 });
  }
  if (paidInstallmentsCount !== undefined && paidInstallmentsCount < 0) {
    throw new CoreFinanceApiError("Paid installments count cannot be negative.", { code: "INVALID_REQUEST", status: 400 });
  }
  if (installmentsCount !== undefined && paidInstallmentsCount !== undefined && paidInstallmentsCount > installmentsCount) {
    throw new CoreFinanceApiError("Paid installments count cannot be greater than total installments count.", { code: "INVALID_REQUEST", status: 400 });
  }
};

export const createInstallmentPlansService = ({ repository }: { repository: InstallmentPlansRepository }): InstallmentPlansService => {
  const requireFound = <T>(record: T | null, id: string): T => {
    if (!record) throw new CoreFinanceApiError(`Installment plan '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
    return record;
  };

  const run = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof InstallmentPlansRepositoryError) throw new CoreFinanceApiError(error.message, { code: error.code, status: 400 });
      throw error;
    }
  };

  const readNullable = (body: Record<string, unknown>, key: string): string | null | undefined => readOptionalNullableString(body, key);

  const parseCreate = (body: unknown): CreateInstallmentPlanInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const title = readRequiredString(parsedBody.value, "title");
    if (!title.ok) throw new CoreFinanceApiError(title.response.error, title.response);
    const totalAmount = readDecimalInput(parsedBody.value, "totalAmount", true);
    if (!totalAmount.ok) throw new CoreFinanceApiError(totalAmount.response.error, totalAmount.response);
    const installmentsCount = readIntegerInput(parsedBody.value, "installmentsCount", true);
    if (!installmentsCount.ok || installmentsCount.value === undefined) throw new CoreFinanceApiError(installmentsCount.ok ? "Installments count is required." : installmentsCount.response.error, installmentsCount.ok ? { code: "INVALID_REQUEST", status: 400 } : installmentsCount.response);
    const startMonth = readYearMonthInput(parsedBody.value, "startMonth", true);
    if (!startMonth.ok || startMonth.value === undefined) throw new CoreFinanceApiError(startMonth.ok ? "Start month is required." : startMonth.response.error, startMonth.ok ? { code: "INVALID_REQUEST", status: 400 } : startMonth.response);
    const paidInstallmentsCount = readIntegerInput(parsedBody.value, "paidInstallmentsCount", false);
    if (!paidInstallmentsCount.ok) throw new CoreFinanceApiError(paidInstallmentsCount.response.error, paidInstallmentsCount.response);
    const installmentAmount = readDecimalInput(parsedBody.value, "installmentAmount", false);
    if (!installmentAmount.ok) throw new CoreFinanceApiError(installmentAmount.response.error, installmentAmount.response);
    assertInstallmentCounts(installmentsCount.value, paidInstallmentsCount.value);
    if (parsedBody.value.currency !== undefined && !isValidCurrency(parsedBody.value.currency)) throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
    return {
      title: title.value,
      description: readNullable(parsedBody.value, "description"),
      totalAmount: assertPositive(totalAmount.value, "totalAmount"),
      installmentsCount: installmentsCount.value,
      startMonth: startMonth.value,
      paidInstallmentsCount: paidInstallmentsCount.value,
      ...(installmentAmount.value !== undefined ? { installmentAmount: assertPositive(installmentAmount.value, "installmentAmount") } : {}),
      ...(parsedBody.value.currency !== undefined ? { currency: parsedBody.value.currency } : {}),
      categoryId: readNullable(parsedBody.value, "categoryId"),
      subcategoryId: readNullable(parsedBody.value, "subcategoryId"),
      subcategoryName: readNullable(parsedBody.value, "subcategoryName"),
      generatedTransactionAccountId: readNullable(parsedBody.value, "generatedTransactionAccountId") ?? undefined,
    };
  };

  const parseUpdate = (body: unknown): UpdateInstallmentPlanInput => {
    const parsedBody = parseJsonObjectBody(body);
    if (!parsedBody.ok) throw new CoreFinanceApiError(parsedBody.response.error, parsedBody.response);
    const patch: UpdateInstallmentPlanInput = {};
    if ("title" in parsedBody.value) {
      const title = readRequiredString(parsedBody.value, "title");
      if (!title.ok) throw new CoreFinanceApiError(title.response.error, title.response);
      patch.title = title.value;
    }
    if ("description" in parsedBody.value) patch.description = readNullable(parsedBody.value, "description");
    if ("totalAmount" in parsedBody.value) {
      const totalAmount = readDecimalInput(parsedBody.value, "totalAmount", true);
      if (!totalAmount.ok) throw new CoreFinanceApiError(totalAmount.response.error, totalAmount.response);
      patch.totalAmount = assertPositive(totalAmount.value, "totalAmount");
    }
    if ("installmentAmount" in parsedBody.value) {
      const installmentAmount = readDecimalInput(parsedBody.value, "installmentAmount", true);
      if (!installmentAmount.ok) throw new CoreFinanceApiError(installmentAmount.response.error, installmentAmount.response);
      patch.installmentAmount = assertPositive(installmentAmount.value, "installmentAmount");
    }
    if ("installmentsCount" in parsedBody.value) {
      const count = readIntegerInput(parsedBody.value, "installmentsCount", true);
      if (!count.ok || count.value === undefined) throw new CoreFinanceApiError(count.ok ? "Installments count is required." : count.response.error, count.ok ? { code: "INVALID_REQUEST", status: 400 } : count.response);
      patch.installmentsCount = count.value;
    }
    if ("paidInstallmentsCount" in parsedBody.value) {
      const paid = readIntegerInput(parsedBody.value, "paidInstallmentsCount", true);
      if (!paid.ok || paid.value === undefined) throw new CoreFinanceApiError(paid.ok ? "Paid installments count is required." : paid.response.error, paid.ok ? { code: "INVALID_REQUEST", status: 400 } : paid.response);
      patch.paidInstallmentsCount = paid.value;
    }
    assertInstallmentCounts(patch.installmentsCount, patch.paidInstallmentsCount);
    if ("startMonth" in parsedBody.value) {
      const startMonth = readYearMonthInput(parsedBody.value, "startMonth", true);
      if (!startMonth.ok || startMonth.value === undefined) throw new CoreFinanceApiError(startMonth.ok ? "Start month is required." : startMonth.response.error, startMonth.ok ? { code: "INVALID_REQUEST", status: 400 } : startMonth.response);
      patch.startMonth = startMonth.value;
    }
    if ("currency" in parsedBody.value) {
      if (!isValidCurrency(parsedBody.value.currency)) throw new CoreFinanceApiError("Field 'currency' must be 'USD' or 'ARS'.", { code: "INVALID_REQUEST", status: 400 });
      patch.currency = parsedBody.value.currency;
    }
    for (const key of ["categoryId", "subcategoryId", "subcategoryName", "generatedTransactionAccountId"] as const) {
      const value = readNullable(parsedBody.value, key);
      if (value !== undefined) patch[key] = value ?? undefined;
    }
    return patch;
  };

  return {
    async listInstallmentPlans() {
      return { installmentPlans: (await repository.listActive()).map(toInstallmentPlanResponse) };
    },
    async getInstallmentPlan(id) {
      return toInstallmentPlanResponse(requireFound(await repository.getById(id), id));
    },
    async createInstallmentPlan(body) {
      return toInstallmentPlanResponse(await run(() => repository.create(parseCreate(body))));
    },
    async updateInstallmentPlan(id, body) {
      return toInstallmentPlanResponse(requireFound(await run(() => repository.update(id, parseUpdate(body))), id));
    },
    async deleteInstallmentPlan(id) {
      if (!await repository.softDelete(id)) throw new CoreFinanceApiError(`Installment plan '${id}' was not found.`, { code: "NOT_FOUND", status: 404 });
      return { deleted: true };
    },
    async clearInstallmentPlans() {
      return { deletedCount: await repository.softDeleteAll() };
    },
  };
};

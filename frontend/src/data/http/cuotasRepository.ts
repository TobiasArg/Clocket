import type { CreateCuotaInput, CuotaPlanItem, CuotasRepository, UpdateCuotaPatch } from "@/domain/cuotas/repository";
import type { CategoryResponse } from "./categoriesRepository";
import { coreFinanceHttpClient, isNotFoundError, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import { ensureFeatureBackendCleanStartCutover } from "./featureDomainCleanStart";

interface InstallmentPlanResponse {
  id: string;
  title: string;
  description: string | null;
  totalAmount: string;
  installmentsCount: number;
  installmentAmount: string;
  startMonth: string;
  paidInstallmentsCount: number;
  categoryId: string | null;
  subcategoryId: string | null;
  createdAt: string;
  updatedAt: string;
}
interface InstallmentPlanListResponse { installmentPlans: InstallmentPlanResponse[] }
interface DeleteResponse { deleted: true }

const currentYearMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const resolveSubcategoryName = async (categoryId: string | null, subcategoryId: string | null): Promise<string | undefined> => {
  if (!categoryId || !subcategoryId) return undefined;
  const response = await coreFinanceHttpClient.get<{ categories: CategoryResponse[] }>("/api/categories");
  const category = response.data.categories.find((item) => item.id === categoryId);
  return category?.subcategories.find((subcategory) => subcategory.id === subcategoryId)?.name;
};

const toPayload = (input: CreateCuotaInput | UpdateCuotaPatch) => ({
  ...input,
  ...(input.title !== undefined ? { title: input.title } : {}),
  ...(input.description !== undefined ? { description: input.description } : {}),
  ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
  ...(input.installmentsCount !== undefined ? { installmentsCount: input.installmentsCount } : {}),
  ...(input.totalAmount !== undefined && input.installmentsCount !== undefined
    ? { installmentAmount: Math.round((input.totalAmount / input.installmentsCount) * 100) / 100 }
    : {}),
  ...(input.startMonth !== undefined ? { startMonth: input.startMonth } : {}),
  ...(input.paidInstallmentsCount !== undefined ? { paidInstallmentsCount: input.paidInstallmentsCount } : {}),
  ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
  ...(input.subcategoryName !== undefined ? { subcategoryName: input.subcategoryName } : {}),
});

export class HttpCuotasRepository implements CuotasRepository {
  public constructor() { ensureFeatureBackendCleanStartCutover(); }

  private async mapPlan(plan: InstallmentPlanResponse): Promise<CuotaPlanItem> {
    return {
      id: plan.id,
      title: plan.title,
      ...(plan.description ? { description: plan.description } : {}),
      totalAmount: Number(plan.totalAmount),
      installmentsCount: plan.installmentsCount,
      installmentAmount: Number(plan.installmentAmount),
      startMonth: plan.startMonth,
      paidInstallmentsCount: plan.paidInstallmentsCount,
      ...(plan.categoryId ? { categoryId: plan.categoryId } : {}),
      ...(await resolveSubcategoryName(plan.categoryId, plan.subcategoryId) ? { subcategoryName: await resolveSubcategoryName(plan.categoryId, plan.subcategoryId) } : {}),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  public async list(): Promise<CuotaPlanItem[]> {
    return withCoreFinanceErrors(async () => Promise.all((await coreFinanceHttpClient.get<InstallmentPlanListResponse>("/api/installments")).data.installmentPlans.map((plan) => this.mapPlan(plan))));
  }

  public async getById(id: string): Promise<CuotaPlanItem | null> {
    try { return await withCoreFinanceErrors(async () => this.mapPlan((await coreFinanceHttpClient.get<InstallmentPlanResponse>(`/api/installments/${id}`)).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async create(input: CreateCuotaInput): Promise<CuotaPlanItem> {
    return withCoreFinanceErrors(async () => this.mapPlan((await coreFinanceHttpClient.post<InstallmentPlanResponse>("/api/installments", {
      title: input.title ?? "Nueva cuota",
      startMonth: input.startMonth ?? currentYearMonth(),
      paidInstallmentsCount: input.paidInstallmentsCount ?? 0,
      ...toPayload(input),
    })).data));
  }

  public async update(id: string, patch: UpdateCuotaPatch): Promise<CuotaPlanItem | null> {
    try { return await withCoreFinanceErrors(async () => this.mapPlan((await coreFinanceHttpClient.patch<InstallmentPlanResponse>(`/api/installments/${id}`, toPayload(patch))).data)); }
    catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async remove(id: string): Promise<boolean> {
    try { return await withCoreFinanceErrors(async () => (await coreFinanceHttpClient.delete<DeleteResponse>(`/api/installments/${id}`)).data.deleted === true); }
    catch (error) { if (isNotFoundError(error)) return false; throw error; }
  }

  public async clearAll(): Promise<void> {
    await withCoreFinanceErrors(async () => { await coreFinanceHttpClient.delete("/api/installments"); });
  }
}

export const httpCuotasRepository: CuotasRepository = new HttpCuotasRepository();

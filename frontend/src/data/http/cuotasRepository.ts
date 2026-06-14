import type { CreateCuotaInput, CuotaPlanItem, CuotasRepository, MarkCuotaPaidResult, ReconcileDueCuotasResult, ReconciledCuotaPlanResult, UpdateCuotaPatch } from "@/domain/cuotas/repository";
import { TRANSACTIONS_CHANGED_EVENT } from "@/domain/transactions/repository";
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
interface MarkInstallmentPaidResponse {
  plan: InstallmentPlanResponse;
  status: "paid" | "already_finished" | "blocked_future";
  installmentIndex: number | null;
  dueDate: string | null;
  blockedReason?: "future_installment";
  effects: Array<{ planId: string; installmentIndex: number; status: "created" | "already_exists" }>;
}
interface ReconciledInstallmentPlanResponse {
  plan: InstallmentPlanResponse;
  status: "reconciled" | "noop";
  fromPaidInstallmentsCount: number;
  toPaidInstallmentsCount: number;
  effects: Array<{ planId: string; installmentIndex: number; status: "created" | "already_exists" }>;
}
interface ReconcileDueInstallmentsResponse {
  updatedPlanCount: number;
  createdTransactionCount: number;
  results: ReconciledInstallmentPlanResponse[];
}

const dispatchTransactionsChanged = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
};

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
    const subcategoryName = await resolveSubcategoryName(plan.categoryId, plan.subcategoryId);
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
      ...(subcategoryName ? { subcategoryName } : {}),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private async mapMarkPaidResult(response: MarkInstallmentPaidResponse): Promise<MarkCuotaPaidResult> {
    return {
      plan: await this.mapPlan(response.plan),
      status: response.status,
      installmentIndex: response.installmentIndex,
      dueDate: response.dueDate,
      ...(response.blockedReason ? { blockedReason: response.blockedReason } : {}),
      effects: response.effects,
    };
  }

  private async mapReconciledResult(response: ReconciledInstallmentPlanResponse): Promise<ReconciledCuotaPlanResult> {
    return {
      plan: await this.mapPlan(response.plan),
      status: response.status,
      fromPaidInstallmentsCount: response.fromPaidInstallmentsCount,
      toPaidInstallmentsCount: response.toPaidInstallmentsCount,
      effects: response.effects,
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

  public async markPaid(id: string): Promise<MarkCuotaPaidResult | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const result = await this.mapMarkPaidResult(
          (await coreFinanceHttpClient.post<MarkInstallmentPaidResponse>(`/api/installments/${id}/mark-paid`, {})).data,
        );
        if (result.effects.some((effect) => effect.status === "created")) {
          dispatchTransactionsChanged();
        }
        return result;
      });
    } catch (error) { if (isNotFoundError(error)) return null; throw error; }
  }

  public async reconcileDue(): Promise<ReconcileDueCuotasResult> {
    return withCoreFinanceErrors(async () => {
      const response = (await coreFinanceHttpClient.post<ReconcileDueInstallmentsResponse>("/api/installments/reconcile-due", {})).data;
      const results = await Promise.all(response.results.map((result) => this.mapReconciledResult(result)));
      if (response.createdTransactionCount > 0) {
        dispatchTransactionsChanged();
      }
      return {
        updatedPlanCount: response.updatedPlanCount,
        createdTransactionCount: response.createdTransactionCount,
        results,
      };
    });
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

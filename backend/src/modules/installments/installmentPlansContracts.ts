import type { InstallmentPlanRecord } from "./installmentPlansRepository";

export type InstallmentPlanResponse = Omit<InstallmentPlanRecord, "deletedAt">;

export interface InstallmentPlanListResponse {
  installmentPlans: InstallmentPlanResponse[];
}

export interface DeleteInstallmentPlanResponse {
  deleted: true;
}

export interface ClearInstallmentPlansResponse {
  deletedCount: number;
}

export const toInstallmentPlanResponse = (plan: InstallmentPlanRecord): InstallmentPlanResponse => ({
  id: plan.id,
  title: plan.title,
  description: plan.description,
  totalAmount: plan.totalAmount,
  currency: plan.currency,
  installmentsCount: plan.installmentsCount,
  installmentAmount: plan.installmentAmount,
  startMonth: plan.startMonth,
  paidInstallmentsCount: plan.paidInstallmentsCount,
  categoryId: plan.categoryId,
  subcategoryId: plan.subcategoryId,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

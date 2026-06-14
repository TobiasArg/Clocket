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

export type InstallmentLedgerEffectStatus = "created" | "already_exists";

export type MarkInstallmentPaidStatus = "paid" | "already_finished" | "blocked_future";

export type ReconcileDueInstallmentsStatus = "reconciled" | "noop";

export interface GeneratedInstallmentTransactionEffectResponse {
  planId: string;
  installmentIndex: number;
  status: InstallmentLedgerEffectStatus;
}

export interface MarkInstallmentPaidResponse {
  plan: InstallmentPlanResponse;
  status: MarkInstallmentPaidStatus;
  installmentIndex: number | null;
  dueDate: string | null;
  blockedReason?: "future_installment";
  effects: GeneratedInstallmentTransactionEffectResponse[];
}

export interface ReconciledInstallmentPlanResponse {
  plan: InstallmentPlanResponse;
  status: ReconcileDueInstallmentsStatus;
  fromPaidInstallmentsCount: number;
  toPaidInstallmentsCount: number;
  effects: GeneratedInstallmentTransactionEffectResponse[];
}

export interface ReconcileDueInstallmentsResponse {
  updatedPlanCount: number;
  createdTransactionCount: number;
  results: ReconciledInstallmentPlanResponse[];
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

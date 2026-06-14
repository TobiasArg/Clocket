import type { CuotaPlan } from "@/types";

export type CuotaPlanItem = CuotaPlan;

export interface CreateCuotaInput {
  title?: string;
  description?: string;
  totalAmount: number;
  installmentsCount: number;
  startMonth?: string;
  createdAt?: string;
  paidInstallmentsCount?: number;
  categoryId?: string;
  subcategoryName?: string;
}

export interface UpdateCuotaPatch {
  title?: string;
  description?: string;
  totalAmount?: number;
  installmentsCount?: number;
  startMonth?: string;
  paidInstallmentsCount?: number;
  categoryId?: string;
  subcategoryName?: string;
}

export type CuotaLedgerEffectStatus = "created" | "already_exists";

export type MarkCuotaPaidStatus = "paid" | "already_finished" | "blocked_future";

export interface CuotaLedgerEffectItem {
  planId: string;
  installmentIndex: number;
  status: CuotaLedgerEffectStatus;
}

export interface MarkCuotaPaidResult {
  plan: CuotaPlanItem;
  status: MarkCuotaPaidStatus;
  installmentIndex: number | null;
  dueDate: string | null;
  blockedReason?: "future_installment";
  effects: CuotaLedgerEffectItem[];
}

export interface ReconciledCuotaPlanResult {
  plan: CuotaPlanItem;
  status: "reconciled" | "noop";
  fromPaidInstallmentsCount: number;
  toPaidInstallmentsCount: number;
  effects: CuotaLedgerEffectItem[];
}

export interface ReconcileDueCuotasResult {
  updatedPlanCount: number;
  createdTransactionCount: number;
  results: ReconciledCuotaPlanResult[];
}

export interface CuotasRepository {
  list: () => Promise<CuotaPlanItem[]>;
  getById: (id: string) => Promise<CuotaPlanItem | null>;
  create: (input: CreateCuotaInput) => Promise<CuotaPlanItem>;
  update: (id: string, patch: UpdateCuotaPatch) => Promise<CuotaPlanItem | null>;
  markPaid: (id: string) => Promise<MarkCuotaPaidResult | null>;
  reconcileDue: () => Promise<ReconcileDueCuotasResult>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

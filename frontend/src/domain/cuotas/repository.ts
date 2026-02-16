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

export interface CuotasRepository {
  list: () => Promise<CuotaPlanItem[]>;
  getById: (id: string) => Promise<CuotaPlanItem | null>;
  create: (input: CreateCuotaInput) => Promise<CuotaPlanItem>;
  update: (id: string, patch: UpdateCuotaPatch) => Promise<CuotaPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

import { describe, expect, it, vi } from "vitest";
import { createInstallmentPlansService } from "./installmentPlansService";
import type { InstallmentPlanRecord, InstallmentPlansRepository } from "./installmentPlansRepository";

const plan = (overrides: Partial<InstallmentPlanRecord> = {}): InstallmentPlanRecord => ({
  id: "plan-1",
  title: "Laptop",
  description: null,
  totalAmount: "1200.00",
  currency: "USD",
  installmentsCount: 12,
  installmentAmount: "100.00",
  startMonth: "2026-06",
  paidInstallmentsCount: 0,
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const createRepository = (): InstallmentPlansRepository => ({
  listActive: vi.fn().mockResolvedValue([plan()]),
  getById: vi.fn().mockResolvedValue(plan()),
  create: vi.fn().mockResolvedValue(plan({ id: "created" })),
  update: vi.fn().mockResolvedValue(plan({ title: "Updated" })),
  markNextDuePaid: vi.fn(),
  reconcileDue: vi.fn(),
  softDelete: vi.fn().mockResolvedValue(true),
  softDeleteAll: vi.fn().mockResolvedValue(1),
});

describe("installment plans service", () => {
  it("requires ledger materialization when creating plans with paid installments", async () => {
    const repository = createRepository();

    await expect(createInstallmentPlansService({ repository }).createInstallmentPlan({
      title: "Laptop",
      totalAmount: "1200.00",
      installmentsCount: 12,
      startMonth: "2026-06",
      paidInstallmentsCount: 1,
    })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("prevents direct paid-count updates from bypassing ledger effect endpoints", async () => {
    const repository = createRepository();

    await expect(createInstallmentPlansService({ repository }).updateInstallmentPlan("plan-1", {
      paidInstallmentsCount: 2,
    })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    expect(repository.update).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import { createInstallmentLedgerEffectsService } from "./installmentLedgerEffectsService";
import type { InstallmentPlanRecord } from "./installmentPlansRepository";

const plan: InstallmentPlanRecord = {
  id: "plan-1",
  title: "Laptop",
  description: null,
  totalAmount: "1200.00",
  currency: "USD",
  installmentsCount: 12,
  installmentAmount: "100.00",
  startMonth: "2026-06",
  paidInstallmentsCount: 1,
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
};

describe("createInstallmentLedgerEffectsService", () => {
  it("maps mark-paid success responses", async () => {
    const repository = {
      markNextDuePaid: vi.fn().mockResolvedValue({
        plan: { ...plan, paidInstallmentsCount: 2 },
        status: "paid",
        installmentIndex: 2,
        dueDate: "2026-07-01",
        effects: [{ planId: plan.id, installmentIndex: 2, status: "created" }],
      }),
      reconcileDue: vi.fn(),
    };
    const service = createInstallmentLedgerEffectsService({ repository });

    await expect(service.markInstallmentPaid(plan.id)).resolves.toEqual({
      plan: expect.objectContaining({ id: plan.id, paidInstallmentsCount: 2 }),
      status: "paid",
      installmentIndex: 2,
      dueDate: "2026-07-01",
      effects: [{ planId: plan.id, installmentIndex: 2, status: "created" }],
    });
  });

  it("maps future installment blocked responses without throwing", async () => {
    const repository = {
      markNextDuePaid: vi.fn().mockResolvedValue({
        plan,
        status: "blocked_future",
        installmentIndex: 2,
        dueDate: "2026-07-01",
        effects: [],
      }),
      reconcileDue: vi.fn(),
    };
    const service = createInstallmentLedgerEffectsService({ repository });

    await expect(service.markInstallmentPaid(plan.id)).resolves.toMatchObject({
      status: "blocked_future",
      blockedReason: "future_installment",
      effects: [],
    });
  });

  it("throws controlled not found errors for missing plans", async () => {
    const repository = {
      markNextDuePaid: vi.fn().mockResolvedValue(null),
      reconcileDue: vi.fn(),
    };
    const service = createInstallmentLedgerEffectsService({ repository });

    await expect(service.markInstallmentPaid("missing-plan")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("summarizes reconcile-due effects and updated plans", async () => {
    const repository = {
      markNextDuePaid: vi.fn(),
      reconcileDue: vi.fn().mockResolvedValue([
        {
          plan: { ...plan, paidInstallmentsCount: 3 },
          fromPaidInstallmentsCount: 1,
          toPaidInstallmentsCount: 3,
          effects: [
            { planId: plan.id, installmentIndex: 1, status: "already_exists" },
            { planId: plan.id, installmentIndex: 2, status: "created" },
            { planId: plan.id, installmentIndex: 3, status: "created" },
          ],
        },
      ]),
    };
    const service = createInstallmentLedgerEffectsService({ repository });

    await expect(service.reconcileDueInstallments()).resolves.toMatchObject({
      updatedPlanCount: 1,
      createdTransactionCount: 2,
      results: [{ status: "reconciled", toPaidInstallmentsCount: 3 }],
    });
  });
});

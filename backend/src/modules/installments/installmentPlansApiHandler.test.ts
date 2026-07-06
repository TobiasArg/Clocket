import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { createInstallmentPlanItemHandler, createMarkInstallmentPaidHandler, createReconcileDueInstallmentsHandler } from "./installmentPlansApiHandler";
import type { InstallmentLedgerEffectsService } from "./installmentLedgerEffectsService";
import type { InstallmentPlansService } from "./installmentPlansService";

const planResponse = {
  id: "plan-1",
  title: "Laptop",
  description: null,
  totalAmount: "1200.00",
  currency: "USD" as const,
  installmentsCount: 12,
  installmentAmount: "100.00",
  startMonth: "2026-06",
  paidInstallmentsCount: 2,
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const createService = (): InstallmentLedgerEffectsService => ({
  markInstallmentPaid: vi.fn().mockResolvedValue({
    plan: planResponse,
    status: "paid",
    installmentIndex: 2,
    dueDate: "2026-07-01",
    effects: [{ planId: "plan-1", installmentIndex: 2, status: "created" }],
  }),
  reconcileDueInstallments: vi.fn().mockResolvedValue({
    updatedPlanCount: 1,
    createdTransactionCount: 1,
    results: [{
      plan: planResponse,
      status: "reconciled",
      fromPaidInstallmentsCount: 1,
      toPaidInstallmentsCount: 2,
      effects: [{ planId: "plan-1", installmentIndex: 2, status: "created" }],
    }],
  }),
});

const createPlansService = (): InstallmentPlansService => ({
  listInstallmentPlans: vi.fn().mockResolvedValue({ installmentPlans: [planResponse] }),
  getInstallmentPlan: vi.fn().mockResolvedValue(planResponse),
  createInstallmentPlan: vi.fn().mockResolvedValue(planResponse),
  updateInstallmentPlan: vi.fn().mockResolvedValue(planResponse),
  deleteInstallmentPlan: vi.fn().mockResolvedValue({ deleted: true }),
  clearInstallmentPlans: vi.fn().mockResolvedValue({ deletedCount: 1 }),
});

describe("installment ledger effect API handlers", () => {
  it("handles mark-paid action requests", async () => {
    const service = createService();
    const handler = createMarkInstallmentPaidHandler({ service });
    const response = createMockResponse();

    await handler(createMockRequest({ method: "POST", query: { id: "plan-1" } }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ status: "paid", installmentIndex: 2 });
    expect(service.markInstallmentPaid).toHaveBeenCalledWith("plan-1");
  });

  it("handles reconcile-due action requests", async () => {
    const service = createService();
    const handler = createReconcileDueInstallmentsHandler({ service });
    const response = createMockResponse();

    await handler(createMockRequest({ method: "POST" }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({ updatedPlanCount: 1, createdTransactionCount: 1 });
    expect(service.reconcileDueInstallments).toHaveBeenCalled();
  });

  it("maps service errors and unsupported methods", async () => {
    const service = createService();
    vi.mocked(service.markInstallmentPaid).mockRejectedValue(new CoreFinanceApiError("Missing.", {
      code: "NOT_FOUND",
      status: 404,
    }));
    const handler = createMarkInstallmentPaidHandler({ service });
    const missingResponse = createMockResponse();
    const methodResponse = createMockResponse();

    await handler(createMockRequest({ method: "POST", query: { id: "missing" } }), missingResponse);
    await handler(createMockRequest({ method: "GET", query: { id: "plan-1" } }), methodResponse);

    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.payload).toMatchObject({ code: "NOT_FOUND" });
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get("Allow")).toBe("POST");
  });

  it("returns structured validation errors for direct paid-count updates", async () => {
    const service = createPlansService();
    vi.mocked(service.updateInstallmentPlan).mockRejectedValue(new CoreFinanceApiError(
      "Paid installments count can only be changed through installment ledger effect endpoints.",
      { code: "INVALID_REQUEST", status: 400 },
    ));
    const response = createMockResponse();

    await createInstallmentPlanItemHandler({ service })(
      createMockRequest({ method: "PATCH", query: { id: "plan-1" }, body: { paidInstallmentsCount: 2 } }),
      response,
    );

    expect(response.statusCode).toBe(400);
    expect(response.payload).toMatchObject({ code: "INVALID_REQUEST", retryable: false });
  });
});

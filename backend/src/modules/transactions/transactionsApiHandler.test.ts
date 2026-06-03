import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { TransactionRepositoryError } from "./transactionsRepository";
import { createTransactionItemHandler, createTransactionsCollectionHandler } from "./transactionsApiHandler";
import type { TransactionsService } from "./transactionsService";

const transactionResponse = {
  id: "transaction-1",
  accountId: "account-1",
  categoryId: null,
  subcategoryId: null,
  goalId: null,
  installmentPlanId: null,
  transactionType: "regular" as const,
  name: "Groceries",
  amount: "42.25",
  currency: "USD" as const,
  date: "2026-06-01",
  notes: null,
  uiIcon: null,
  uiIconBg: null,
  cuotaInstallmentIndex: null,
  cuotaInstallmentsCount: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const createService = (): TransactionsService => ({
  listTransactions: vi.fn().mockResolvedValue({ transactions: [transactionResponse] }),
  getTransaction: vi.fn().mockResolvedValue(transactionResponse),
  createTransaction: vi.fn().mockResolvedValue({ ...transactionResponse, id: "created" }),
  updateTransaction: vi.fn().mockResolvedValue({ ...transactionResponse, name: "Updated" }),
  deleteTransaction: vi.fn().mockResolvedValue({ deleted: true }),
});

describe("transactions API handlers", () => {
  it("handles collection list and create", async () => {
    const service = createService();
    const handler = createTransactionsCollectionHandler({ service });
    const listResponse = createMockResponse();
    const createResponse = createMockResponse();

    await handler(createMockRequest({ method: "GET", query: { accountId: "account-1" } }), listResponse);
    await handler(createMockRequest({ method: "POST", body: { accountId: "account-1" } }), createResponse);

    expect(listResponse.statusCode).toBe(200);
    expect(createResponse.statusCode).toBe(201);
    expect(service.listTransactions).toHaveBeenCalledWith({ accountId: "account-1" });
    expect(service.createTransaction).toHaveBeenCalledWith({ accountId: "account-1" });
  });

  it("handles item get, patch, and delete", async () => {
    const service = createService();
    const handler = createTransactionItemHandler({ service });

    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const response = createMockResponse();
      await handler(createMockRequest({ method, query: { id: "transaction-1" }, body: { name: "Updated" } }), response);
      expect(response.statusCode).toBe(200);
    }

    expect(service.getTransaction).toHaveBeenCalledWith("transaction-1");
    expect(service.updateTransaction).toHaveBeenCalledWith("transaction-1", { name: "Updated" });
    expect(service.deleteTransaction).toHaveBeenCalledWith("transaction-1");
  });

  it("maps repository validation errors", async () => {
    const service = createService();
    vi.mocked(service.createTransaction).mockRejectedValue(new TransactionRepositoryError(
      "SAVING_REQUIRES_GOAL",
      "Saving transactions require an active goal reference.",
    ));
    const response = createMockResponse();

    await createTransactionsCollectionHandler({ service })(
      createMockRequest({ method: "POST", body: { transactionType: "saving" } }),
      response,
    );

    expect(response.statusCode).toBe(422);
    expect(response.payload).toMatchObject({ code: "SAVING_REQUIRES_GOAL" });
  });
});

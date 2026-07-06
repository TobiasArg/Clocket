import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { createAccountItemHandler, createAccountsCollectionHandler } from "./accountsApiHandler";
import type { AccountsService } from "./accountsService";

const accountResponse = {
  id: "account-1",
  name: "Cash",
  balance: "100.00",
  currency: "USD" as const,
  icon: "wallet",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const createService = (): AccountsService => ({
  listAccounts: vi.fn().mockResolvedValue({ accounts: [accountResponse] }),
  getAccount: vi.fn().mockResolvedValue(accountResponse),
  createAccount: vi.fn().mockResolvedValue({ ...accountResponse, id: "created" }),
  updateAccount: vi.fn().mockResolvedValue({ ...accountResponse, name: "Updated" }),
  deleteAccount: vi.fn().mockResolvedValue({ deleted: true }),
});

describe("accounts API handlers", () => {
  it("handles collection list and create", async () => {
    const service = createService();
    const handler = createAccountsCollectionHandler({ service });
    const listResponse = createMockResponse();
    const createResponse = createMockResponse();

    await handler(createMockRequest({ method: "GET" }), listResponse);
    await handler(createMockRequest({ method: "POST", body: { name: "Bank" } }), createResponse);

    expect(listResponse.statusCode).toBe(200);
    expect(createResponse.statusCode).toBe(201);
    expect(service.listAccounts).toHaveBeenCalled();
    expect(service.createAccount).toHaveBeenCalledWith({ name: "Bank" });
  });

  it("handles item get, patch, and delete", async () => {
    const service = createService();
    const handler = createAccountItemHandler({ service });

    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const response = createMockResponse();
      await handler(createMockRequest({ method, query: { id: "account-1" }, body: { name: "Updated" } }), response);
      expect(response.statusCode).toBe(200);
    }

    expect(service.getAccount).toHaveBeenCalledWith("account-1");
    expect(service.updateAccount).toHaveBeenCalledWith("account-1", { name: "Updated" });
    expect(service.deleteAccount).toHaveBeenCalledWith("account-1");
  });

  it("maps service errors and unsupported methods", async () => {
    const service = createService();
    vi.mocked(service.getAccount).mockRejectedValue(new CoreFinanceApiError("Missing.", {
      code: "NOT_FOUND",
      status: 404,
    }));
    const handler = createAccountItemHandler({ service });
    const missingResponse = createMockResponse();
    const methodResponse = createMockResponse();

    await handler(createMockRequest({ method: "GET", query: { id: "missing" } }), missingResponse);
    await handler(createMockRequest({ method: "PUT", query: { id: "account-1" } }), methodResponse);

    expect(missingResponse.statusCode).toBe(404);
    expect(missingResponse.payload).toMatchObject({ code: "NOT_FOUND" });
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get("Allow")).toBe("GET, PATCH, DELETE");
  });

  it("returns structured conflicts for protected account deletes", async () => {
    const service = createService();
    vi.mocked(service.deleteAccount).mockRejectedValue(new CoreFinanceApiError("Account has active transactions.", {
      code: "ACCOUNT_IN_USE",
      status: 409,
    }));
    const response = createMockResponse();

    await createAccountItemHandler({ service })(
      createMockRequest({ method: "DELETE", query: { id: "account-1" } }),
      response,
    );

    expect(response.statusCode).toBe(409);
    expect(response.payload).toMatchObject({ code: "ACCOUNT_IN_USE", retryable: false });
  });
});

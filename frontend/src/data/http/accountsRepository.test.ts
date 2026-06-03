import { beforeEach, describe, expect, it, vi } from "vitest";

const { httpDeleteMock, httpGetMock, httpPatchMock, httpPostMock } = vi.hoisted(() => ({
  httpDeleteMock: vi.fn(),
  httpGetMock: vi.fn(),
  httpPatchMock: vi.fn(),
  httpPostMock: vi.fn(),
}));

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    delete: httpDeleteMock,
    get: httpGetMock,
    patch: httpPatchMock,
    post: httpPostMock,
  }));
  const isAxiosError = (error: unknown): boolean => (
    typeof error === "object" && error !== null && "isAxiosError" in error
  );
  return { default: { create, isAxiosError }, create, isAxiosError };
});

import { HttpAccountsRepository } from "./accountsRepository";

const accountPayload = {
  id: "account-1",
  name: "Cash",
  balance: "100.50",
  currency: "USD",
  icon: "wallet",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("HttpAccountsRepository", () => {
  beforeEach(() => {
    httpDeleteMock.mockReset();
    httpGetMock.mockReset();
    httpPatchMock.mockReset();
    httpPostMock.mockReset();
  });

  it("lists accounts and maps decimal balances to numbers", async () => {
    httpGetMock.mockResolvedValue({ data: { accounts: [accountPayload] } });

    await expect(new HttpAccountsRepository().list()).resolves.toEqual([{
      id: "account-1",
      name: "Cash",
      balance: 100.5,
      icon: "wallet",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    }]);
    expect(httpGetMock).toHaveBeenCalledWith("/api/accounts");
  });

  it("returns null/false for not-found account operations", async () => {
    const notFound = {
      isAxiosError: true,
      response: { status: 404, data: { error: "Missing.", code: "NOT_FOUND", status: 404, retryable: false } },
    };
    httpGetMock.mockRejectedValueOnce(notFound);
    httpPatchMock.mockRejectedValueOnce(notFound);
    httpDeleteMock.mockRejectedValueOnce(notFound);

    const repository = new HttpAccountsRepository();
    await expect(repository.getById("missing")).resolves.toBeNull();
    await expect(repository.update("missing", { name: "Nope" })).resolves.toBeNull();
    await expect(repository.remove("missing")).resolves.toBe(false);
  });

  it("creates, updates, removes, and clears accounts through the API", async () => {
    httpPostMock.mockResolvedValue({ data: accountPayload });
    httpPatchMock.mockResolvedValue({ data: { ...accountPayload, name: "Updated" } });
    httpDeleteMock.mockResolvedValue({ data: { deleted: true } });
    httpGetMock.mockResolvedValue({ data: { accounts: [accountPayload, { ...accountPayload, id: "account-2" }] } });

    const repository = new HttpAccountsRepository();
    await repository.create({ name: "Cash", balance: 100.5, icon: "wallet" });
    await repository.update("account-1", { name: "Updated" });
    await expect(repository.remove("account-1")).resolves.toBe(true);
    await repository.clearAll();

    expect(httpPostMock).toHaveBeenCalledWith("/api/accounts", { name: "Cash", balance: 100.5, icon: "wallet" });
    expect(httpPatchMock).toHaveBeenCalledWith("/api/accounts/account-1", { name: "Updated" });
    expect(httpDeleteMock).toHaveBeenCalledWith("/api/accounts/account-1");
    expect(httpDeleteMock).toHaveBeenCalledWith("/api/accounts/account-2");
  });
});

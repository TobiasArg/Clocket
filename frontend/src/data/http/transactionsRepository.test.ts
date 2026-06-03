import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRANSACTIONS_CHANGED_EVENT } from "@/domain/transactions/repository";

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

import { HttpTransactionsRepository } from "./transactionsRepository";

const categoryPayload = {
  id: "category-1",
  name: "Food",
  icon: "fork",
  iconBg: "bg-red-500",
  subcategoryCount: 1,
  subcategories: [{
    id: "subcategory-1",
    categoryId: "category-1",
    name: "Groceries",
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const transactionPayload = {
  id: "transaction-1",
  accountId: "account-1",
  categoryId: "category-1",
  subcategoryId: "subcategory-1",
  goalId: null,
  installmentPlanId: null,
  transactionType: "regular",
  name: "Groceries",
  amount: "-120.50",
  currency: "ARS",
  date: "2026-06-01",
  notes: "Market",
  uiIcon: null,
  uiIconBg: null,
  cuotaInstallmentIndex: null,
  cuotaInstallmentsCount: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const mockCategories = () => {
  httpGetMock.mockImplementation((url: string) => {
    if (url === "/api/categories") {
      return Promise.resolve({ data: { categories: [categoryPayload] } });
    }
    return Promise.resolve({ data: { transactions: [transactionPayload] } });
  });
};

describe("HttpTransactionsRepository", () => {
  beforeEach(() => {
    httpDeleteMock.mockReset();
    httpGetMock.mockReset();
    httpPatchMock.mockReset();
    httpPostMock.mockReset();
  });

  it("lists transactions and maps category display fields", async () => {
    mockCategories();

    await expect(new HttpTransactionsRepository().list()).resolves.toEqual([expect.objectContaining({
      id: "transaction-1",
      category: "Food",
      subcategoryName: "Groceries",
      icon: "fork",
      iconBg: "bg-red-500",
      amount: "-120.50",
      meta: "2026-06-01 • Market",
    })]);
  });

  it("creates transactions with backend canonical fields and dispatches change event", async () => {
    mockCategories();
    httpPostMock.mockResolvedValue({ data: transactionPayload });
    const listener = vi.fn();
    const eventTarget = new EventTarget();
    vi.stubGlobal("window", eventTarget);
    eventTarget.addEventListener(TRANSACTIONS_CHANGED_EVENT, listener);

    await new HttpTransactionsRepository().create({
      accountId: "account-1",
      category: "Food",
      categoryId: "category-1",
      subcategoryName: "Groceries",
      icon: "fork",
      iconBg: "bg-red-500",
      name: "Groceries",
      amount: "-ARS 120.50",
      amountColor: "text-[var(--text-primary)]",
      meta: "2026-06-01 • Market",
      date: "2026-06-01",
    });

    expect(httpPostMock).toHaveBeenCalledWith("/api/transactions", expect.objectContaining({
      accountId: "account-1",
      categoryId: "category-1",
      subcategoryId: "subcategory-1",
      amount: -120.5,
      currency: "ARS",
      notes: "Market",
      uiIcon: "fork",
      uiIconBg: "bg-red-500",
    }));
    expect(listener).toHaveBeenCalledTimes(1);
    eventTarget.removeEventListener(TRANSACTIONS_CHANGED_EVENT, listener);
    vi.unstubAllGlobals();
  });

  it("updates, removes, and returns false for missing transactions", async () => {
    mockCategories();
    httpPatchMock.mockResolvedValue({ data: { ...transactionPayload, name: "Updated" } });
    httpDeleteMock.mockResolvedValueOnce({ data: { deleted: true } });
    httpDeleteMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { error: "Missing.", code: "NOT_FOUND", status: 404, retryable: false } },
    });

    const repository = new HttpTransactionsRepository();
    await repository.update("transaction-1", { name: "Updated", categoryId: "category-1", subcategoryName: "Groceries" });
    await expect(repository.remove("transaction-1")).resolves.toBe(true);
    await expect(repository.remove("missing")).resolves.toBe(false);

    expect(httpPatchMock).toHaveBeenCalledWith("/api/transactions/transaction-1", expect.objectContaining({
      name: "Updated",
      subcategoryId: "subcategory-1",
    }));
  });
});

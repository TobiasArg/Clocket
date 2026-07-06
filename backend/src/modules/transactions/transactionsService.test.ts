import { describe, expect, it, vi } from "vitest";
import { TransactionRepositoryError, type TransactionRecord, type TransactionsRepository } from "./transactionsRepository";
import { createTransactionsService } from "./transactionsService";

const transaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "transaction-1",
  accountId: "account-1",
  categoryId: "category-1",
  subcategoryId: "subcategory-1",
  goalId: null,
  installmentPlanId: null,
  transactionType: "regular",
  name: "Groceries",
  amount: "42.25",
  currency: "USD",
  date: "2026-06-01",
  notes: null,
  uiIcon: "cart",
  uiIconBg: "bg-orange-500",
  cuotaInstallmentIndex: null,
  cuotaInstallmentsCount: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const createRepository = (): TransactionsRepository => ({
  listActive: vi.fn().mockResolvedValue([transaction()]),
  getById: vi.fn().mockResolvedValue(transaction()),
  create: vi.fn().mockResolvedValue(transaction({ id: "created" })),
  update: vi.fn().mockResolvedValue(transaction({ name: "Updated" })),
  softDelete: vi.fn().mockResolvedValue(true),
});

describe("transactions service", () => {
  it("parses list filters", async () => {
    const repository = createRepository();
    await createTransactionsService({ repository }).listTransactions({
      accountId: "account-1",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    });

    expect(repository.listActive).toHaveBeenCalledWith({
      accountId: "account-1",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    });
  });

  it("validates create body and passes canonical input", async () => {
    const repository = createRepository();
    await createTransactionsService({ repository }).createTransaction({
      accountId: "account-1",
      name: "Groceries",
      amount: "42.25",
      date: "2026-06-01",
      categoryId: "category-1",
      subcategoryId: "subcategory-1",
      uiIcon: "cart",
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      accountId: "account-1",
      name: "Groceries",
      amount: "42.25",
      date: "2026-06-01",
      transactionType: "regular",
      categoryId: "category-1",
      subcategoryId: "subcategory-1",
      uiIcon: "cart",
    }));
  });

  it("surfaces repository validation errors as controlled errors", async () => {
    const repository = createRepository();
    vi.mocked(repository.create).mockRejectedValue(new TransactionRepositoryError(
      "MISSING_ACCOUNT",
      "Active account was not found.",
    ));

    await expect(createTransactionsService({ repository }).createTransaction({
      accountId: "missing",
      name: "Bad",
      amount: "10.00",
      date: "2026-06-01",
    })).rejects.toMatchObject({ code: "MISSING_ACCOUNT" });
  });

  it("rejects zero, overflow, and excess-scale amounts before persistence", async () => {
    const repository = createRepository();
    const service = createTransactionsService({ repository });

    for (const amount of ["0", "10.123", "10000000000000000.00"]) {
      await expect(service.createTransaction({
        accountId: "account-1",
        name: "Invalid",
        amount,
        date: "2026-06-01",
      })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    }
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("returns not found for missing transactions", async () => {
    const repository = createRepository();
    vi.mocked(repository.getById).mockResolvedValue(null);

    await expect(createTransactionsService({ repository }).getTransaction("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });
});

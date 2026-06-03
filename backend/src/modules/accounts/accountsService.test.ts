import { describe, expect, it, vi } from "vitest";
import { createAccountsService } from "./accountsService";
import type { AccountRecord, AccountsRepository } from "./accountsRepository";

const account = (overrides: Partial<AccountRecord> = {}): AccountRecord => ({
  id: "account-1",
  name: "Cash",
  balance: "100.00",
  currency: "USD",
  icon: "wallet",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const createRepository = (): AccountsRepository => ({
  listActive: vi.fn().mockResolvedValue([account()]),
  getById: vi.fn().mockResolvedValue(account()),
  create: vi.fn().mockResolvedValue(account({ id: "created" })),
  update: vi.fn().mockResolvedValue(account({ name: "Updated" })),
  softDelete: vi.fn().mockResolvedValue(true),
});

describe("accounts service", () => {
  it("lists active accounts", async () => {
    const repository = createRepository();
    await expect(createAccountsService({ repository }).listAccounts()).resolves.toEqual({
      accounts: [expect.objectContaining({ id: "account-1", balance: "100.00" })],
    });
  });

  it("validates and creates accounts", async () => {
    const repository = createRepository();
    await createAccountsService({ repository }).createAccount({
      name: "Bank",
      balance: "25.50",
      currency: "ARS",
      icon: "banknote",
    });

    expect(repository.create).toHaveBeenCalledWith({
      name: "Bank",
      balance: "25.50",
      currency: "ARS",
      icon: "banknote",
    });
  });

  it("returns not found for missing updates/deletes", async () => {
    const repository = createRepository();
    vi.mocked(repository.update).mockResolvedValue(null);
    vi.mocked(repository.softDelete).mockResolvedValue(false);
    const service = createAccountsService({ repository });

    await expect(service.updateAccount("missing", { name: "Nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    await expect(service.deleteAccount("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });
});

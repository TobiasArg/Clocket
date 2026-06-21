import { describe, expect, it, vi } from "vitest";
import {
  httpAccountsRepository,
  httpAppSettingsRepository,
  httpBudgetsRepository,
  httpCategoriesRepository,
  httpCuotasRepository,
  httpGoalsRepository,
  httpInvestmentsRepository,
  httpTransactionsRepository,
} from "@/data/http";
import type { SettingsExportRepositories } from "./settingsExport";
import { buildExportSnapshot, buildTransactionsCsv, defaultSettingsExportRepositories } from "./settingsExport";

const createExportRepositories = (): SettingsExportRepositories => ({
  accountsRepository: {
    list: vi.fn().mockResolvedValue([{ id: "account-1", name: "Cuenta", balance: "$100", icon: "wallet" }]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
  },
  appSettingsRepository: {
    get: vi.fn().mockResolvedValue({
      currency: "USD",
      language: "es",
      notificationsEnabled: true,
      theme: "light",
      profile: { name: "Usuario", email: "usuario@email.com", avatarIcon: "user" },
      security: { pinHash: null },
    }),
    update: vi.fn(),
    reset: vi.fn(),
  },
  budgetsRepository: {
    list: vi.fn().mockResolvedValue([{ id: "budget-1", name: "Food", limitAmount: 120, month: "2026-06", scopeRules: [] }]),
    getById: vi.fn(),
    listUsage: vi.fn(),
    getUsageById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
  },
  categoriesRepository: {
    list: vi.fn().mockResolvedValue([{ id: "category-1", name: "General", icon: "wallet", iconBg: "bg", subcategoryCount: 0 }]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
  },
  cuotasRepository: {
    list: vi.fn().mockResolvedValue([{ id: "cuota-1", title: "Laptop", totalAmount: 1200, installmentsCount: 12, installmentAmount: 100, paidInstallmentsCount: 1 }]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    markPaid: vi.fn(),
    reconcileDue: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
  },
  goalsRepository: {
    list: vi.fn().mockResolvedValue([{ id: "goal-1", title: "Viaje", description: "Ahorro", targetAmount: 500, deadlineDate: "2026-12-01", icon: "plane", colorKey: "sky" }]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    resolveDeletion: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
  },
  investmentsRepository: {
    listPositions: vi.fn().mockResolvedValue([{ id: "position-1", assetType: "stock", ticker: "AAPL", usd_gastado: 100, buy_price: 10, amount: 10, createdAt: "2026-06-01T00:00:00.000Z" }]),
    getPositionById: vi.fn(),
    listEntriesByPosition: vi.fn(),
    listEntriesByAsset: vi.fn(),
    addEntry: vi.fn(),
    deleteEntry: vi.fn(),
    addPosition: vi.fn(),
    editPosition: vi.fn(),
    deletePosition: vi.fn(),
    addSnapshot: vi.fn(),
    listSnapshotsByAsset: vi.fn(),
    getLatestSnapshotByAsset: vi.fn(),
    getOrInitRefs: vi.fn(),
    updateDailyRefIfNeeded: vi.fn(),
    updateMonthRefIfNeeded: vi.fn(),
    getRefsMap: vi.fn().mockResolvedValue({ "stock:AAPL": { dailyRefPrice: 10, dailyRefTimestamp: "2026-06-01T00:00:00.000Z", monthRefPrice: 10, monthRefTimestamp: "2026-06-01T00:00:00.000Z" } }),
    refreshPositions: vi.fn(),
    clearAll: vi.fn(),
  },
  transactionsRepository: {
    list: vi.fn().mockResolvedValue([{ id: "transaction-1", icon: "wallet", iconBg: "bg-[#09090B]", name: "Compra", category: "General", amount: "-$1200", amountColor: "text-[#DC2626]", meta: "2026-01-10 • smoke", accountId: "account-1", transactionType: "regular", date: "2026-01-10" }]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clearAll: vi.fn(),
  },
});

describe("settingsExport", () => {
  it("uses HTTP repositories as the default export source after backend cutover", () => {
    expect(defaultSettingsExportRepositories).toMatchObject({
      accountsRepository: httpAccountsRepository,
      appSettingsRepository: httpAppSettingsRepository,
      budgetsRepository: httpBudgetsRepository,
      categoriesRepository: httpCategoriesRepository,
      cuotasRepository: httpCuotasRepository,
      goalsRepository: httpGoalsRepository,
      investmentsRepository: httpInvestmentsRepository,
      transactionsRepository: httpTransactionsRepository,
    });
  });

  it("builds export snapshot from the active repository set", async () => {
    const repositories = createExportRepositories();

    const snapshot = await buildExportSnapshot(repositories);

    expect(snapshot.version).toBe(1);
    expect(snapshot.exportedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(snapshot.data.settings).toHaveProperty("currency", "USD");
    expect(snapshot.data.accounts).toHaveLength(1);
    expect(snapshot.data.budgets).toHaveLength(1);
    expect(snapshot.data.goals).toHaveLength(1);
    expect(snapshot.data.cuotas).toHaveLength(1);
    expect(snapshot.data.transactions).toHaveLength(1);
    expect(snapshot.data.investments.positions).toHaveLength(1);
    expect(snapshot.data.investments.refs).toHaveProperty("stock:AAPL");
  });

  it("builds CSV with headers and transaction rows", () => {
    const csv = buildTransactionsCsv([{
      id: "transaction-1",
      icon: "wallet",
      iconBg: "bg-[#09090B]",
      name: "Compra",
      category: "General",
      amount: "-$1200",
      amountColor: "text-[#DC2626]",
      meta: "2026-01-10 • smoke",
      accountId: "account_test",
      transactionType: "regular",
      date: "2026-01-10",
    }]);

    expect(csv).toContain("id,date,name,category,amount,accountId,transactionType,goalId,meta");
    expect(csv).toContain("Compra");
    expect(csv).toContain("2026-01-10");
  });
});

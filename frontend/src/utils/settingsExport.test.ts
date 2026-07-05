import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import {
  buildExportSnapshot,
  buildTransactionsCsv,
  defaultSettingsExportRepositories,
  formatSettingsExportErrorMessage,
  SETTINGS_EXPORT_REQUIRED_DOMAINS,
  SettingsExportError,
} from "./settingsExport";

const createExportRepositories = (): SettingsExportRepositories => ({
  accountsRepository: {
    list: vi.fn().mockResolvedValue([{ id: "account-1", name: "Cuenta", balance: 100, icon: "wallet", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }]),
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
      security: { hasPin: false },
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
    listTransactionEditorOptions: vi.fn().mockResolvedValue({ classifications: [], categories: [] }),
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(globalThis, "localStorage");
  });

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
    expect(snapshot.exportedAt).toBe("2026-06-30T12:00:00.000Z");
    expect(snapshot.complete).toBe(true);
    expect(snapshot.manifest).toEqual({
      name: "clocket-settings-export",
      requiredDomains: SETTINGS_EXPORT_REQUIRED_DOMAINS,
      includedDomains: SETTINGS_EXPORT_REQUIRED_DOMAINS,
    });
    expect(snapshot.counts).toEqual({
      settings: 1,
      accounts: 1,
      categories: 1,
      budgets: 1,
      goals: 1,
      cuotas: 1,
      transactions: 1,
      investmentPositions: 1,
      investmentRefs: 1,
    });
    expect(snapshot.integrity.algorithm).toMatch(/^(SHA-256|FALLBACK-DJB2)$/);
    expect(snapshot.integrity.checksum).toEqual(expect.any(String));
    expect(snapshot.integrity.checksum.length).toBeGreaterThan(8);
    expect(snapshot.scope).toEqual({
      importRestore: "out_of_scope",
      localStorageImport: "out_of_scope",
      auth: "out_of_scope",
      userOwnership: "out_of_scope",
    });
    expect(snapshot.data.settings).toHaveProperty("currency", "USD");
    expect(snapshot.data.settings.security).toEqual({ hasPin: false });
    expect(snapshot.data.accounts).toHaveLength(1);
    expect(snapshot.data.budgets).toHaveLength(1);
    expect(snapshot.data.goals).toHaveLength(1);
    expect(snapshot.data.cuotas).toHaveLength(1);
    expect(snapshot.data.transactions).toHaveLength(1);
    expect(snapshot.data.investments.positions).toHaveLength(1);
    expect(snapshot.data.investments.refs).toHaveProperty("stock:AAPL");
  });

  it("redacts PIN verifier material from JSON backup settings", async () => {
    const repositories = createExportRepositories();
    vi.mocked(repositories.appSettingsRepository.get).mockResolvedValue({
      currency: "USD",
      language: "es",
      notificationsEnabled: true,
      theme: "light",
      profile: { name: "Usuario", email: "usuario@email.com", avatarIcon: "user" },
      security: { pinHash: "legacy-secret-pin-hash" },
    } as unknown as Awaited<ReturnType<typeof repositories.appSettingsRepository.get>>);

    const snapshot = await buildExportSnapshot(repositories);
    const payload = JSON.stringify(snapshot);

    expect(snapshot.data.settings.security).toEqual({ hasPin: true });
    expect(payload).not.toContain("pinHash");
    expect(payload).not.toContain("legacy-secret-pin-hash");
  });

  it("keeps checksum stable for identical payloads and changes it when data changes", async () => {
    const firstSnapshot = await buildExportSnapshot(createExportRepositories());
    const secondSnapshot = await buildExportSnapshot(createExportRepositories());
    const changedRepositories = createExportRepositories();
    vi.mocked(changedRepositories.accountsRepository.list).mockResolvedValue([
      { id: "account-2", name: "Cuenta 2", balance: 200, icon: "wallet", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
    ]);

    const changedSnapshot = await buildExportSnapshot(changedRepositories);

    expect(secondSnapshot.integrity).toEqual(firstSnapshot.integrity);
    expect(changedSnapshot.integrity.checksum).not.toBe(firstSnapshot.integrity.checksum);
  });

  it("treats empty backend domains as complete with zero counts", async () => {
    const repositories = createExportRepositories();
    vi.mocked(repositories.accountsRepository.list).mockResolvedValue([]);
    vi.mocked(repositories.categoriesRepository.list).mockResolvedValue([]);
    vi.mocked(repositories.budgetsRepository.list).mockResolvedValue([]);
    vi.mocked(repositories.goalsRepository.list).mockResolvedValue([]);
    vi.mocked(repositories.cuotasRepository.list).mockResolvedValue([]);
    vi.mocked(repositories.transactionsRepository.list).mockResolvedValue([]);
    vi.mocked(repositories.investmentsRepository.listPositions).mockResolvedValue([]);
    vi.mocked(repositories.investmentsRepository.getRefsMap).mockResolvedValue({});

    const snapshot = await buildExportSnapshot(repositories);

    expect(snapshot.complete).toBe(true);
    expect(snapshot.counts).toMatchObject({
      accounts: 0,
      categories: 0,
      budgets: 0,
      goals: 0,
      cuotas: 0,
      transactions: 0,
      investmentPositions: 0,
      investmentRefs: 0,
    });
  });

  it("does not merge legacy localStorage records into the full JSON export", async () => {
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(JSON.stringify([{ id: "legacy-account" }])),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
    const repositories = createExportRepositories();

    const snapshot = await buildExportSnapshot(repositories);

    expect(snapshot.data.accounts).toEqual([{ id: "account-1", name: "Cuenta", balance: 100, icon: "wallet", createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" }]);
    expect(JSON.stringify(snapshot)).not.toContain("legacy-account");
    expect(localStorageMock.getItem).not.toHaveBeenCalled();
  });

  it("fails with a controlled domain error when a required domain cannot be read", async () => {
    const repositories = createExportRepositories();
    const cause = new Error("backend unavailable");
    vi.mocked(repositories.budgetsRepository.list).mockRejectedValue(cause);

    await expect(buildExportSnapshot(repositories)).rejects.toMatchObject({
      name: "SettingsExportError",
      code: "SETTINGS_EXPORT_DOMAIN_READ_FAILED",
      domain: "budgets",
      cause,
    });
    await expect(buildExportSnapshot(repositories)).rejects.toBeInstanceOf(SettingsExportError);
  });

  it("formats domain-aware export failures without leaking technical causes", () => {
    const error = new SettingsExportError("budgets", new Error("database password leaked in stack"));

    expect(formatSettingsExportErrorMessage(error)).toBe(
      "No pudimos leer Presupuestos para generar el backup. No se descargó ningún archivo; intenta nuevamente.",
    );
    expect(formatSettingsExportErrorMessage(error)).not.toContain("database password");
    expect(formatSettingsExportErrorMessage(new Error("network failed"))).toBe(
      "No pudimos generar el backup JSON. No se descargó ningún archivo; intenta nuevamente.",
    );
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
    expect(csv).not.toContain("manifest");
    expect(csv).not.toContain("counts");
    expect(csv).not.toContain("checksum");
    expect(csv).not.toContain("complete");
  });
});

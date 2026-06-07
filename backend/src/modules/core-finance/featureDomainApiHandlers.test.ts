import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { createBudgetsCollectionHandler, createBudgetItemHandler } from "../budgets/budgetsApiHandler";
import type { BudgetsService } from "../budgets/budgetsService";
import { CoreFinanceApiError } from "./coreFinanceApiErrors";
import { createGoalsCollectionHandler, createGoalItemHandler } from "../goals/goalsApiHandler";
import type { GoalsService } from "../goals/goalsService";
import { createInstallmentPlanItemHandler, createInstallmentPlansCollectionHandler } from "../installments/installmentPlansApiHandler";
import type { InstallmentPlansService } from "../installments/installmentPlansService";
import {
  createInvestmentDailyRefsHandler,
  createInvestmentEntriesCollectionHandler,
  createInvestmentEntryItemHandler,
  createInvestmentLatestSnapshotHandler,
  createInvestmentMonthlyRefsHandler,
  createInvestmentPositionEntriesHandler,
  createInvestmentPositionItemHandler,
  createInvestmentPositionsCollectionHandler,
  createInvestmentRefsHandler,
  createInvestmentSnapshotsCollectionHandler,
} from "../investments/investmentsApiHandler";
import type { InvestmentsService } from "../investments/investmentsService";
import { createAppSettingsHandler } from "../settings/settingsApiHandler";
import type { AppSettingsService } from "../settings/settingsService";

const budget = {
  id: "budget-1",
  categoryId: "category-1",
  name: "Food",
  limitAmount: "120.00",
  currency: "USD" as const,
  periodMonth: "2026-06",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  scopeRules: [],
};

const goal = {
  id: "goal-1",
  title: "Trip",
  description: "Save",
  targetAmount: "500.00",
  deadlineDate: "2026-12-01",
  icon: "plane",
  colorKey: "sky",
  categoryId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
};

const installmentPlan = {
  id: "plan-1",
  title: "Laptop",
  description: null,
  totalAmount: "1200.00",
  installmentsCount: 12,
  installmentAmount: "100.00",
  startMonth: "2026-06",
  paidInstallmentsCount: 2,
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
};

const position = {
  id: "position-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  displayName: null,
  usd_gastado: "100.00",
  buy_price: "10.0000000000",
  amount: "10.0000000000",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
};

const entry = {
  id: "entry-1",
  positionId: "position-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  entryType: "ingreso" as const,
  usd_gastado: "100.00",
  buy_price: "10.0000000000",
  amount: "10.0000000000",
  transactionId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const snapshot = {
  id: "snapshot-1",
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  timestamp: "2026-06-01T00:00:00.000Z",
  price: "10.0000000000",
  source: "GLOBAL_QUOTE" as const,
  bid: null,
  ask: null,
  providerAsOf: null,
  fetchedAt: "2026-06-01T00:00:00.000Z",
};

const refs = {
  assetId: "asset-1",
  assetType: "stock" as const,
  ticker: "AAPL",
  dailyRefPrice: "10.0000000000",
  dailyRefTimestamp: "2026-06-01T00:00:00.000Z",
  monthRefPrice: "10.0000000000",
  monthRefTimestamp: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const settings = {
  currency: "USD" as const,
  language: "es" as const,
  notificationsEnabled: true,
  theme: "light" as const,
  profile: { name: "Usuario", email: "usuario@email.com", avatarIcon: "user" },
  security: { pinHash: null },
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const createBudgetsService = (): BudgetsService => ({
  listBudgets: vi.fn().mockResolvedValue({ budgets: [budget] }),
  getBudget: vi.fn().mockResolvedValue(budget),
  createBudget: vi.fn().mockResolvedValue(budget),
  updateBudget: vi.fn().mockResolvedValue(budget),
  deleteBudget: vi.fn().mockResolvedValue({ deleted: true }),
  clearBudgets: vi.fn().mockResolvedValue({ deleted: true }),
});

const createGoalsService = (): GoalsService => ({
  listGoals: vi.fn().mockResolvedValue({ goals: [goal] }),
  getGoal: vi.fn().mockResolvedValue(goal),
  createGoal: vi.fn().mockResolvedValue(goal),
  updateGoal: vi.fn().mockResolvedValue(goal),
  deleteGoal: vi.fn().mockResolvedValue({ deleted: true }),
  clearGoals: vi.fn().mockResolvedValue({ deleted: true }),
});

const createInstallmentPlansService = (): InstallmentPlansService => ({
  listInstallmentPlans: vi.fn().mockResolvedValue({ installmentPlans: [installmentPlan] }),
  getInstallmentPlan: vi.fn().mockResolvedValue(installmentPlan),
  createInstallmentPlan: vi.fn().mockResolvedValue(installmentPlan),
  updateInstallmentPlan: vi.fn().mockResolvedValue(installmentPlan),
  deleteInstallmentPlan: vi.fn().mockResolvedValue({ deleted: true }),
  clearInstallmentPlans: vi.fn().mockResolvedValue({ deleted: true }),
});

const createInvestmentsService = (): InvestmentsService => ({
  listPositions: vi.fn().mockResolvedValue({ positions: [position] }),
  getPosition: vi.fn().mockResolvedValue(position),
  addPosition: vi.fn().mockResolvedValue(position),
  editPosition: vi.fn().mockResolvedValue(position),
  deletePosition: vi.fn().mockResolvedValue({ deleted: true }),
  listEntriesByPosition: vi.fn().mockResolvedValue({ entries: [entry] }),
  listEntriesByAsset: vi.fn().mockResolvedValue({ entries: [entry] }),
  addEntry: vi.fn().mockResolvedValue({ position, entry }),
  deleteEntry: vi.fn().mockResolvedValue({ deleted: true }),
  addSnapshot: vi.fn().mockResolvedValue(snapshot),
  listSnapshotsByAsset: vi.fn().mockResolvedValue({ snapshots: [snapshot] }),
  getLatestSnapshotByAsset: vi.fn().mockResolvedValue(null),
  getRefs: vi.fn().mockResolvedValue({ refs: { "stock:AAPL": refs } }),
  updateDailyRef: vi.fn().mockResolvedValue(refs),
  updateMonthRef: vi.fn().mockResolvedValue(refs),
  clearAll: vi.fn().mockResolvedValue({ deleted: true }),
});

const createSettingsService = (): AppSettingsService => ({
  getSettings: vi.fn().mockResolvedValue(settings),
  updateSettings: vi.fn().mockResolvedValue({ ...settings, theme: "dark" }),
  resetSettings: vi.fn().mockResolvedValue(settings),
});

describe("migrated feature-domain API handlers", () => {
  it("routes budgets collection and item CRUD methods", async () => {
    const service = createBudgetsService();
    const collectionHandler = createBudgetsCollectionHandler({ service });
    const itemHandler = createBudgetItemHandler({ service });

    for (const [method, expectedStatus] of [["GET", 200], ["POST", 201], ["DELETE", 200]] as const) {
      const response = createMockResponse();
      await collectionHandler(createMockRequest({ method, query: { month: "2026-06" }, body: { name: "Food" } }), response);
      expect(response.statusCode).toBe(expectedStatus);
    }

    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const response = createMockResponse();
      await itemHandler(createMockRequest({ method, query: { id: "budget-1" }, body: { name: "Updated" } }), response);
      expect(response.statusCode).toBe(200);
    }

    expect(service.listBudgets).toHaveBeenCalledWith({ month: "2026-06" });
    expect(service.createBudget).toHaveBeenCalledWith({ name: "Food" });
    expect(service.updateBudget).toHaveBeenCalledWith("budget-1", { name: "Updated" });
  });

  it("routes goals collection and item CRUD methods", async () => {
    const service = createGoalsService();
    const collectionHandler = createGoalsCollectionHandler({ service });
    const itemHandler = createGoalItemHandler({ service });

    for (const [method, expectedStatus] of [["GET", 200], ["POST", 201], ["DELETE", 200]] as const) {
      const response = createMockResponse();
      await collectionHandler(createMockRequest({ method, body: { title: "Trip" } }), response);
      expect(response.statusCode).toBe(expectedStatus);
    }

    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const response = createMockResponse();
      await itemHandler(createMockRequest({ method, query: { id: "goal-1" }, body: { title: "Updated" } }), response);
      expect(response.statusCode).toBe(200);
    }

    expect(service.createGoal).toHaveBeenCalledWith({ title: "Trip" });
    expect(service.updateGoal).toHaveBeenCalledWith("goal-1", { title: "Updated" });
  });

  it("routes installment collection and item CRUD methods", async () => {
    const service = createInstallmentPlansService();
    const collectionHandler = createInstallmentPlansCollectionHandler({ service });
    const itemHandler = createInstallmentPlanItemHandler({ service });

    for (const [method, expectedStatus] of [["GET", 200], ["POST", 201], ["DELETE", 200]] as const) {
      const response = createMockResponse();
      await collectionHandler(createMockRequest({ method, body: { title: "Laptop" } }), response);
      expect(response.statusCode).toBe(expectedStatus);
    }

    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const response = createMockResponse();
      await itemHandler(createMockRequest({ method, query: { id: "plan-1" }, body: { paidInstallmentsCount: 3 } }), response);
      expect(response.statusCode).toBe(200);
    }

    expect(service.createInstallmentPlan).toHaveBeenCalledWith({ title: "Laptop" });
    expect(service.updateInstallmentPlan).toHaveBeenCalledWith("plan-1", { paidInstallmentsCount: 3 });
  });

  it("routes settings get, update, reset, and legacy post reset methods", async () => {
    const service = createSettingsService();
    const handler = createAppSettingsHandler({ service });

    for (const [method, body] of [["GET", undefined], ["PATCH", { theme: "dark" }], ["DELETE", undefined], ["POST", undefined]] as const) {
      const response = createMockResponse();
      await handler(createMockRequest({ method, body }), response);
      expect(response.statusCode).toBe(200);
    }

    expect(service.getSettings).toHaveBeenCalled();
    expect(service.updateSettings).toHaveBeenCalledWith({ theme: "dark" });
    expect(service.resetSettings).toHaveBeenCalledTimes(2);
  });

  it("routes investment positions, entries, snapshots, and refs methods", async () => {
    const service = createInvestmentsService();
    const positionsHandler = createInvestmentPositionsCollectionHandler({ service });
    const positionHandler = createInvestmentPositionItemHandler({ service });
    const positionEntriesHandler = createInvestmentPositionEntriesHandler({ service });
    const entriesHandler = createInvestmentEntriesCollectionHandler({ service });
    const entryHandler = createInvestmentEntryItemHandler({ service });
    const snapshotsHandler = createInvestmentSnapshotsCollectionHandler({ service });
    const latestSnapshotHandler = createInvestmentLatestSnapshotHandler({ service });
    const refsHandler = createInvestmentRefsHandler({ service });
    const dailyRefsHandler = createInvestmentDailyRefsHandler({ service });
    const monthlyRefsHandler = createInvestmentMonthlyRefsHandler({ service });

    for (const [method, expectedStatus] of [["GET", 200], ["POST", 201], ["DELETE", 200]] as const) {
      const response = createMockResponse();
      await positionsHandler(createMockRequest({ method, body: { assetType: "stock", ticker: "AAPL" } }), response);
      expect(response.statusCode).toBe(expectedStatus);
    }

    for (const method of ["GET", "PATCH", "DELETE"] as const) {
      const response = createMockResponse();
      await positionHandler(createMockRequest({ method, query: { id: "position-1" }, body: { ticker: "AAPL" } }), response);
      expect(response.statusCode).toBe(200);
    }

    const positionEntriesResponse = createMockResponse();
    const entriesListResponse = createMockResponse();
    const entriesCreateResponse = createMockResponse();
    const entryDeleteResponse = createMockResponse();
    const snapshotsListResponse = createMockResponse();
    const snapshotsCreateResponse = createMockResponse();
    const latestSnapshotResponse = createMockResponse();
    const refsResponse = createMockResponse();
    const dailyRefsResponse = createMockResponse();
    const monthlyRefsResponse = createMockResponse();

    await positionEntriesHandler(createMockRequest({ method: "GET", query: { id: "position-1" } }), positionEntriesResponse);
    await entriesHandler(createMockRequest({ method: "GET", query: { assetType: "stock", ticker: "AAPL" } }), entriesListResponse);
    await entriesHandler(createMockRequest({ method: "POST", body: { assetType: "stock", ticker: "AAPL" } }), entriesCreateResponse);
    await entryHandler(createMockRequest({ method: "DELETE", query: { id: "entry-1" } }), entryDeleteResponse);
    await snapshotsHandler(createMockRequest({ method: "GET", query: { assetType: "stock", ticker: "AAPL" } }), snapshotsListResponse);
    await snapshotsHandler(createMockRequest({ method: "POST", body: { assetType: "stock", ticker: "AAPL" } }), snapshotsCreateResponse);
    await latestSnapshotHandler(createMockRequest({ method: "GET", query: { assetType: "stock", ticker: "AAPL" } }), latestSnapshotResponse);
    await refsHandler(createMockRequest({ method: "GET", query: { assetType: "stock", ticker: "AAPL" } }), refsResponse);
    await dailyRefsHandler(createMockRequest({ method: "PATCH", body: { assetType: "stock", ticker: "AAPL" } }), dailyRefsResponse);
    await monthlyRefsHandler(createMockRequest({ method: "PATCH", body: { assetType: "stock", ticker: "AAPL" } }), monthlyRefsResponse);

    expect(positionEntriesResponse.statusCode).toBe(200);
    expect(entriesListResponse.statusCode).toBe(200);
    expect(entriesCreateResponse.statusCode).toBe(201);
    expect(entryDeleteResponse.statusCode).toBe(200);
    expect(snapshotsListResponse.statusCode).toBe(200);
    expect(snapshotsCreateResponse.statusCode).toBe(201);
    expect(latestSnapshotResponse.statusCode).toBe(200);
    expect(refsResponse.statusCode).toBe(200);
    expect(dailyRefsResponse.statusCode).toBe(200);
    expect(monthlyRefsResponse.statusCode).toBe(200);
  });

  it("maps controlled validation errors and unsupported methods", async () => {
    const service = createBudgetsService();
    vi.mocked(service.createBudget).mockRejectedValue(new CoreFinanceApiError("Invalid budget.", {
      code: "INVALID_REQUEST",
      status: 400,
    }));
    const collectionHandler = createBudgetsCollectionHandler({ service });
    const validationResponse = createMockResponse();
    const methodResponse = createMockResponse();

    await collectionHandler(createMockRequest({ method: "POST", body: { limitAmount: -1 } }), validationResponse);
    await collectionHandler(createMockRequest({ method: "PATCH" }), methodResponse);

    expect(validationResponse.statusCode).toBe(400);
    expect(validationResponse.payload).toMatchObject({ code: "INVALID_REQUEST", retryable: false });
    expect(methodResponse.statusCode).toBe(405);
    expect(methodResponse.headers.get("Allow")).toBe("GET, POST, DELETE");
  });
});

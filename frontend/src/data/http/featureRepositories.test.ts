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

import { HttpAppSettingsRepository } from "./appSettingsRepository";
import { HttpBudgetsRepository } from "./budgetsRepository";
import { HttpCuotasRepository } from "./cuotasRepository";
import { HttpGoalsRepository } from "./goalsRepository";
import { HttpInvestmentsRepository } from "./investmentsRepository";

describe("feature-domain HTTP repositories", () => {
  beforeEach(() => {
    httpDeleteMock.mockReset();
    httpGetMock.mockReset();
    httpPatchMock.mockReset();
    httpPostMock.mockReset();
  });

  it("maps budget payloads and resolves selected subcategory names", async () => {
    httpGetMock.mockImplementation((url: string) => {
      if (url === "/api/budgets") {
        return Promise.resolve({ data: { budgets: [{
          id: "budget-1",
          categoryId: "cat-1",
          name: "Food",
          limitAmount: "120.50",
          periodMonth: "2026-06",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z",
          scopeRules: [{ id: "scope-1", categoryId: "cat-1", mode: "selected_subcategories", selectedSubcategoryIds: ["sub-1"] }],
        }] } });
      }
      return Promise.resolve({ data: { categories: [{
        id: "cat-1",
        name: "Food",
        icon: "utensils",
        iconBg: "bg",
        subcategoryCount: 1,
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
        subcategories: [{ id: "sub-1", categoryId: "cat-1", name: "Groceries", sortOrder: 0, createdAt: "", updatedAt: "" }],
      }] } });
    });

    await expect(new HttpBudgetsRepository().list()).resolves.toEqual([expect.objectContaining({
      limitAmount: 120.5,
      month: "2026-06",
      scopeRules: [expect.objectContaining({ subcategoryNames: ["Groceries"] })],
    })]);
  });

  it("maps goal, cuota, investment, and settings payloads", async () => {
    httpGetMock.mockImplementation((url: string) => {
      if (url === "/api/goals") return Promise.resolve({ data: { goals: [{ id: "goal-1", title: "Trip", description: "Save", targetAmount: "500.00", deadlineDate: "2026-12-01", icon: "plane", colorKey: "sky", categoryId: "cat-goal", createdAt: "now", updatedAt: "now" }] } });
      if (url === "/api/installments") return Promise.resolve({ data: { installmentPlans: [{ id: "plan-1", title: "Laptop", description: null, totalAmount: "1200.00", installmentsCount: 12, installmentAmount: "100.00", startMonth: "2026-06", paidInstallmentsCount: 2, categoryId: null, subcategoryId: null, createdAt: "now", updatedAt: "now" }] } });
      if (url === "/api/investments/positions") return Promise.resolve({ data: { positions: [{ id: "pos-1", assetType: "stock", ticker: "AAPL", usd_gastado: "100.00", buy_price: "10.0000000000", amount: "10.0000000000", createdAt: "now" }] } });
      if (url === "/api/settings") return Promise.resolve({ data: { currency: "USD", language: "es", notificationsEnabled: true, theme: "light", profile: { name: "Usuario", email: "usuario@email.com", avatarIcon: "user" }, security: { pinHash: null }, updatedAt: "now" } });
      return Promise.resolve({ data: { categories: [] } });
    });

    await expect(new HttpGoalsRepository().list()).resolves.toEqual([expect.objectContaining({ targetAmount: 500 })]);
    await expect(new HttpCuotasRepository().list()).resolves.toEqual([expect.objectContaining({ totalAmount: 1200, installmentAmount: 100 })]);
    await expect(new HttpInvestmentsRepository().listPositions()).resolves.toEqual([expect.objectContaining({ usd_gastado: 100, buy_price: 10, amount: 10 })]);
    await expect(new HttpAppSettingsRepository().get()).resolves.toMatchObject({ currency: "USD", profile: { name: "Usuario" } });
  });

  it("returns null or false for feature-domain not-found responses", async () => {
    const notFound = { isAxiosError: true, response: { status: 404, data: { error: "Missing.", code: "NOT_FOUND", status: 404, retryable: false } } };
    httpGetMock.mockRejectedValueOnce(notFound);
    httpDeleteMock.mockRejectedValueOnce(notFound);

    await expect(new HttpGoalsRepository().getById("missing")).resolves.toBeNull();
    await expect(new HttpInvestmentsRepository().deleteEntry("missing")).resolves.toBe(false);
  });

  it("posts investment refresh requests and maps backend decimal payloads", async () => {
    httpPostMock.mockResolvedValue({ data: {
      refreshedAt: "2026-06-12T10:00:00.000Z",
      results: [{
        positionId: "pos-1",
        assetType: "stock",
        ticker: "AAPL",
        currentPrice: "230.0000000000",
        lastUpdatedTimestamp: "2026-06-12T10:00:00.000Z",
        status: "refreshed",
        staleWarning: null,
        refreshError: null,
        errorCode: null,
        latestSnapshot: { id: "snap-1", assetType: "stock", ticker: "AAPL", timestamp: "2026-06-12T10:00:00.000Z", price: "230.0000000000", source: "GLOBAL_QUOTE", bid: null, ask: null },
        refs: { dailyRefPrice: "210.0000000000", dailyRefTimestamp: "2026-06-12T00:00:00.000Z", monthRefPrice: "200.0000000000", monthRefTimestamp: "2026-06-01T00:00:00.000Z" },
        snapshots: [{ id: "snap-1", assetType: "stock", ticker: "AAPL", timestamp: "2026-06-12T10:00:00.000Z", price: "230.0000000000", source: "GLOBAL_QUOTE", bid: "229.5000000000", ask: "230.5000000000" }],
      }],
    } });

    await expect(new HttpInvestmentsRepository().refreshPositions({ positionIds: ["pos-1"], force: true })).resolves.toEqual({
      refreshedAt: "2026-06-12T10:00:00.000Z",
      results: [expect.objectContaining({
        positionId: "pos-1",
        currentPrice: 230,
        latestSnapshot: expect.objectContaining({ price: 230 }),
        refs: expect.objectContaining({ dailyRefPrice: 210, monthRefPrice: 200 }),
        snapshots: [expect.objectContaining({ price: 230, bid: 229.5, ask: 230.5 })],
      })],
    });
    expect(httpPostMock).toHaveBeenCalledWith("/api/investments/positions/refresh", { positionIds: ["pos-1"], force: true });
  });
});

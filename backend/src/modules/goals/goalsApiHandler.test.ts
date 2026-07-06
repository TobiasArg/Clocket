import { describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse } from "../../api/testUtils";
import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import { createGoalDeletionResolutionHandler, createGoalItemHandler, createGoalsCollectionHandler } from "./goalsApiHandler";
import type { GoalsService } from "./goalsService";

const goalResponse = {
  id: "goal-1",
  title: "Trip",
  description: "Summer trip",
  targetAmount: "1200.00",
  currency: "USD" as const,
  deadlineDate: "2026-12-31",
  icon: "airplane-tilt",
  colorKey: "sky" as const,
  categoryId: "category-1",
  subcategoryId: "subcategory-1",
  createdAt: "2026-06-02T10:00:00.000Z",
  updatedAt: "2026-06-02T10:00:00.000Z",
};

const createService = (): GoalsService => ({
  listGoals: vi.fn().mockResolvedValue({
    goals: [{ ...goalResponse, savedAmount: "0.00", progressPercent: 0, entryCount: 0 }],
    summary: { totalSaved: "0.00", totalTarget: "1200.00", progressPercent: 0 },
  }),
  getGoal: vi.fn().mockResolvedValue({ ...goalResponse, savedAmount: "0.00", progressPercent: 0, entryCount: 0, entries: [] }),
  createGoal: vi.fn().mockResolvedValue(goalResponse),
  updateGoal: vi.fn().mockResolvedValue(goalResponse),
  resolveGoalDeletion: vi.fn().mockResolvedValue({ deleted: true, mode: "delete_entries", resolvedEntriesCount: 2 }),
  deleteGoal: vi.fn().mockResolvedValue({ deleted: true }),
  clearGoals: vi.fn().mockResolvedValue({ deletedCount: 1 }),
});

describe("goals API handlers", () => {
  it("handles goal deletion resolution commands", async () => {
    const service = createService();
    const handler = createGoalDeletionResolutionHandler({ service });
    const response = createMockResponse();
    const body = { mode: "redirect_goal", targetGoalId: "goal-2" };

    await handler(createMockRequest({ method: "POST", query: { id: "goal-1" }, body }), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ deleted: true, mode: "delete_entries", resolvedEntriesCount: 2 });
    expect(service.resolveGoalDeletion).toHaveBeenCalledWith("goal-1", body);
  });

  it("rejects unsupported deletion resolution methods", async () => {
    const service = createService();
    const response = createMockResponse();

    await createGoalDeletionResolutionHandler({ service })(
      createMockRequest({ method: "GET", query: { id: "goal-1" } }),
      response,
    );

    expect(response.statusCode).toBe(405);
    expect(response.payload).toMatchObject({ code: "INVALID_REQUEST" });
    expect(service.resolveGoalDeletion).not.toHaveBeenCalled();
  });

  it("returns structured conflicts for protected direct goal deletes", async () => {
    const service = createService();
    vi.mocked(service.deleteGoal).mockRejectedValue(new CoreFinanceApiError("Goal has active linked transactions.", {
      code: "GOAL_IN_USE",
      status: 409,
    }));
    const response = createMockResponse();

    await createGoalItemHandler({ service })(
      createMockRequest({ method: "DELETE", query: { id: "goal-1" } }),
      response,
    );

    expect(response.statusCode).toBe(409);
    expect(response.payload).toMatchObject({ code: "GOAL_IN_USE", retryable: false });
  });

  it("returns structured conflicts for protected bulk goal deletes", async () => {
    const service = createService();
    vi.mocked(service.clearGoals).mockRejectedValue(new CoreFinanceApiError("Goals require explicit deletion resolution.", {
      code: "GOAL_IN_USE",
      status: 409,
    }));
    const response = createMockResponse();

    await createGoalsCollectionHandler({ service })(createMockRequest({ method: "DELETE" }), response);

    expect(response.statusCode).toBe(409);
    expect(response.payload).toMatchObject({ code: "GOAL_IN_USE" });
  });
});

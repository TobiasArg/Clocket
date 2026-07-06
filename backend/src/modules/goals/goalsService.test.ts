import { describe, expect, it, vi } from "vitest";
import { createGoalsService } from "./goalsService";
import type { GoalListWithProgressRecord, GoalRecord, GoalsRepository } from "./goalsRepository";

const goal = (overrides: Partial<GoalRecord> = {}): GoalRecord => ({
  id: "goal-1",
  title: "Trip",
  description: "Summer trip",
  targetAmount: "1200.00",
  currency: "USD",
  deadlineDate: "2026-12-31",
  icon: "airplane-tilt",
  colorKey: "sky",
  categoryId: null,
  subcategoryId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  deletedAt: null,
  ...overrides,
});

const goalsWithProgress = (): GoalListWithProgressRecord => ({
  goals: [{ ...goal(), savedAmount: "0.00", progressPercent: 0, entryCount: 0 }],
  summary: { totalSaved: "0.00", totalTarget: "1200.00", progressPercent: 0 },
});

const createRepository = (): GoalsRepository => ({
  listActive: vi.fn().mockResolvedValue([goal()]),
  listActiveWithProgress: vi.fn().mockResolvedValue(goalsWithProgress()),
  getById: vi.fn().mockResolvedValue(goal()),
  getByIdWithProgress: vi.fn().mockResolvedValue({ ...goalsWithProgress().goals[0], entries: [] }),
  create: vi.fn().mockResolvedValue(goal({ id: "created" })),
  update: vi.fn().mockResolvedValue(goal({ title: "Updated" })),
  resolveDeletion: vi.fn().mockResolvedValue({ deleted: true, mode: "delete_entries", resolvedEntriesCount: 0 }),
  softDelete: vi.fn().mockResolvedValue(true),
  softDeleteAll: vi.fn().mockResolvedValue(1),
});

describe("goals service", () => {
  it("rejects invalid target amounts before persistence", async () => {
    const repository = createRepository();
    const service = createGoalsService({ repository });

    for (const targetAmount of ["0", "-1", "10.123", "10000000000000000.00"]) {
      await expect(service.createGoal({
        title: "Trip",
        description: "Summer trip",
        targetAmount,
        deadlineDate: "2026-12-31",
        icon: "airplane-tilt",
      })).rejects.toMatchObject({ code: "INVALID_REQUEST", status: 400 });
    }
    expect(repository.create).not.toHaveBeenCalled();
  });
});

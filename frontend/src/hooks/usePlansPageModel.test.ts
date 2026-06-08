import { describe, expect, it } from "vitest";
import { getPlansNeedingPaidInstallmentsAutoSync } from "./usePlansPageModel";

describe("usePlansPageModel helpers", () => {
  it("does not auto-sync plans when the paid count is already current", () => {
    expect(
      getPlansNeedingPaidInstallmentsAutoSync([
        {
          id: "plan-without-category-metadata",
          installmentsCount: 12,
          paidInstallmentsCount: 12,
          createdAt: "2020-01-01T12:00:00.000Z",
        },
      ]),
    ).toEqual([]);
  });

  it("auto-syncs only plans whose elapsed installment count increased", () => {
    expect(
      getPlansNeedingPaidInstallmentsAutoSync([
        {
          id: "stale-plan",
          installmentsCount: 12,
          paidInstallmentsCount: 0,
          createdAt: "2020-01-01T12:00:00.000Z",
        },
      ]),
    ).toEqual([
      {
        id: "stale-plan",
        nextPaidInstallmentsCount: 12,
      },
    ]);
  });
});

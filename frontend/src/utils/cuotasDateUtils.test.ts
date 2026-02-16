import { describe, expect, it } from "vitest";
import {
  compareDateParts,
  getInstallmentDateParts,
  getTodayDatePartsLocal,
  isFutureDateParts,
  parseDateParts,
} from "@/domain/cuotas/cuotasDateUtils";

describe("cuotasDateUtils", () => {
  it("parses valid date parts", () => {
    expect(parseDateParts("2026-05-15")).toEqual({
      year: 2026,
      month: 5,
      day: 15,
    });
  });

  it("returns null for invalid date parts", () => {
    expect(parseDateParts("2026-02-31")).toBeNull();
  });

  it("calculates installment date using one-month offset for installment 1", () => {
    expect(getInstallmentDateParts("2026-04-15", 1)).toEqual({
      year: 2026,
      month: 5,
      day: 15,
    });
  });

  it("detects future installment date by local today", () => {
    const today = getTodayDatePartsLocal(new Date(2026, 4, 15, 9, 0, 0, 0));
    const candidate = getInstallmentDateParts("2026-04-20", 1);
    expect(candidate).not.toBeNull();
    expect(isFutureDateParts(candidate!, today)).toBe(true);
    expect(compareDateParts(candidate!, today)).toBeGreaterThan(0);
  });
});

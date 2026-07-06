import { describe, expect, it } from "vitest";
import { readDecimalInput, readYearMonthInput } from "./coreFinanceRequest";

describe("core finance request validation", () => {
  it("validates strict year-month input", () => {
    expect(readYearMonthInput({ periodMonth: "2026-06" }, "periodMonth", true)).toMatchObject({
      ok: true,
      value: "2026-06",
    });
    expect(readYearMonthInput({ periodMonth: "2026-00" }, "periodMonth", true)).toMatchObject({
      ok: false,
      response: { code: "INVALID_REQUEST", status: 400 },
    });
    expect(readYearMonthInput({ periodMonth: "bad" }, "periodMonth", true)).toMatchObject({
      ok: false,
      response: { code: "INVALID_REQUEST", status: 400 },
    });
  });

  it("validates decimal precision, scale, and positive semantics", () => {
    expect(readDecimalInput({ amount: "9999999999999999.99" }, "amount", true, {
      precision: 18,
      scale: 2,
      positive: true,
    })).toMatchObject({ ok: true });
    expect(readDecimalInput({ amount: "0" }, "amount", true, { positive: true })).toMatchObject({
      ok: false,
      response: { code: "INVALID_REQUEST", status: 400 },
    });
    expect(readDecimalInput({ amount: "10.123" }, "amount", true, { precision: 18, scale: 2 })).toMatchObject({
      ok: false,
      response: { code: "INVALID_REQUEST", status: 400 },
    });
    expect(readDecimalInput({ amount: "10000000000000000.00" }, "amount", true, { precision: 18, scale: 2 })).toMatchObject({
      ok: false,
      response: { code: "INVALID_REQUEST", status: 400 },
    });
  });
});

import { describe, expect, it } from "vitest";
import { buildAnalyticsVersionKey, buildExchangeRateVersionKey } from "./analyticsFreshness";

describe("analytics freshness keys", () => {
  it("changes when a transaction amount changes without changing collection length", () => {
    const before = buildAnalyticsVersionKey([["tx-1", "100.00", "cat-food"]]);
    const after = buildAnalyticsVersionKey([["tx-1", "150.00", "cat-food"]]);

    expect(after).not.toBe(before);
  });

  it("changes when a transaction category changes without changing collection length", () => {
    const before = buildAnalyticsVersionKey([["tx-1", "100.00", "cat-food"]]);
    const after = buildAnalyticsVersionKey([["tx-1", "100.00", "cat-rent"]]);

    expect(after).not.toBe(before);
  });

  it("changes when exchange-rate state changes", () => {
    const base = {
      baseCurrency: "USD" as const,
      quoteCurrency: "ARS" as const,
      rate: 1500,
      source: "BACKEND_CONFIG" as const,
      asOf: "2026-06-18T12:00:00.000Z",
      isStale: false,
      isDefault: false,
      isUnavailable: false,
      fallbackReason: null,
    };

    expect(buildExchangeRateVersionKey({ ...base, rate: 1600 })).not.toBe(buildExchangeRateVersionKey(base));
  });
});

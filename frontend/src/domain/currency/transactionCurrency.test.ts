import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_USD_RATE,
  getUsdArsExchangeRateState,
  getUsdRate,
  convertCurrencyAmount,
  resetUsdArsExchangeRateStateForTests,
  setUsdArsExchangeRateState,
  toArsTransactionAmount,
} from "./transactionCurrency";

describe("transactionCurrency exchange-rate state", () => {
  beforeEach(() => {
    resetUsdArsExchangeRateStateForTests();
  });

  it("treats the fixed frontend rate as fallback-only before backend state is loaded", () => {
    expect(getUsdRate()).toBe(DEFAULT_USD_RATE);
    expect(getUsdArsExchangeRateState()).toMatchObject({
      source: "FRONTEND_FALLBACK",
      isDefault: true,
      isUnavailable: true,
    });
  });

  it("uses backend-provided rate state for USD to ARS conversions", () => {
    setUsdArsExchangeRateState({
      baseCurrency: "USD",
      quoteCurrency: "ARS",
      rate: 1200,
      source: "BACKEND_CONFIG",
      asOf: "2026-06-30T12:00:00.000Z",
      isStale: false,
      isDefault: false,
      isUnavailable: false,
      fallbackReason: null,
    });

    expect(toArsTransactionAmount(2, "USD")).toBe(2400);
    expect(convertCurrencyAmount(2400, "ARS", "USD")).toBe(2);
    expect(convertCurrencyAmount(2, "USD", "ARS")).toBe(2400);
    expect(toArsTransactionAmount(2400, "ARS")).toBe(2400);
    expect(getUsdArsExchangeRateState()).toMatchObject({
      source: "BACKEND_CONFIG",
      isDefault: false,
    });
  });
});

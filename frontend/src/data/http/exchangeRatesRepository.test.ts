import { beforeEach, describe, expect, it, vi } from "vitest";

const { httpGetMock } = vi.hoisted(() => ({
  httpGetMock: vi.fn(),
}));

vi.mock("axios", () => {
  const create = vi.fn(() => ({
    get: httpGetMock,
  }));
  const isAxiosError = (error: unknown): boolean => (
    typeof error === "object" && error !== null && "isAxiosError" in error
  );
  return { default: { create, isAxiosError }, create, isAxiosError };
});

import { getUsdArsExchangeRateState, resetUsdArsExchangeRateStateForTests } from "@/domain/currency/transactionCurrency";
import { fetchUsdArsExchangeRate, refreshUsdArsExchangeRate } from "./exchangeRatesRepository";

describe("exchangeRatesRepository", () => {
  beforeEach(() => {
    httpGetMock.mockReset();
    resetUsdArsExchangeRateStateForTests();
  });

  it("fetches and maps backend USD to ARS exchange-rate metadata", async () => {
    httpGetMock.mockResolvedValue({ data: {
      baseCurrency: "USD",
      quoteCurrency: "ARS",
      rate: "1234.56",
      source: "BACKEND_CONFIG",
      asOf: "2026-06-30T12:00:00.000Z",
      isStale: false,
      isDefault: false,
      isUnavailable: false,
      fallbackReason: null,
    } });

    await expect(fetchUsdArsExchangeRate()).resolves.toEqual({
      baseCurrency: "USD",
      quoteCurrency: "ARS",
      rate: 1234.56,
      source: "BACKEND_CONFIG",
      asOf: "2026-06-30T12:00:00.000Z",
      isStale: false,
      isDefault: false,
      isUnavailable: false,
      fallbackReason: null,
    });
    expect(httpGetMock).toHaveBeenCalledWith("/api/exchange-rates", {
      params: { baseCurrency: "USD", quoteCurrency: "ARS" },
    });
  });

  it("updates the UI-safe cached conversion rate from backend state", async () => {
    const backendRateState = {
      baseCurrency: "USD" as const,
      quoteCurrency: "ARS" as const,
      rate: 1300,
      source: "BACKEND_DEFAULT" as const,
      asOf: "2026-06-30T12:00:00.000Z",
      isStale: false,
      isDefault: true,
      isUnavailable: true,
      fallbackReason: "source unavailable",
    };

    await expect(refreshUsdArsExchangeRate(() => Promise.resolve(backendRateState))).resolves.toEqual(backendRateState);
    expect(getUsdArsExchangeRateState()).toEqual(backendRateState);
  });
});

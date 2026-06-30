import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it, vi } from "vitest";
import { createExchangeRateHandler } from "./exchangeRateHandler";
import type { ExchangeRateResponse } from "./exchangeRateContracts";

const createMockResponse = () => {
  const response = {
    headers: new Map<string, string>(),
    statusCode: 0,
    payload: undefined as ExchangeRateResponse | undefined,
    setHeader: vi.fn((name: string, value: string) => {
      response.headers.set(name, value);
    }),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((payload: ExchangeRateResponse) => {
      response.payload = payload;
      return response;
    }),
  };

  return response as unknown as NextApiResponse<ExchangeRateResponse> & typeof response;
};

const createRequest = (overrides: Partial<NextApiRequest>): NextApiRequest => ({
  method: "GET",
  query: { baseCurrency: "USD", quoteCurrency: "ARS" },
  ...overrides,
} as NextApiRequest);

describe("createExchangeRateHandler", () => {
  it("returns the configured USD to ARS exchange rate", () => {
    const response = createMockResponse();
    const handler = createExchangeRateHandler({
      env: { USD_ARS_EXCHANGE_RATE: "1234.56" },
      now: () => new Date("2026-06-30T12:00:00.000Z"),
    });

    handler(createRequest({}), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
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
  });

  it("returns 400 for unsupported pairs without returning a default rate", () => {
    const response = createMockResponse();
    const handler = createExchangeRateHandler({ env: { USD_ARS_EXCHANGE_RATE: "1234.56" } });

    handler(createRequest({ query: { baseCurrency: "EUR", quoteCurrency: "ARS" } }), response);

    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual({
      error: "Unsupported exchange-rate pair.",
      code: "UNSUPPORTED_PAIR",
      status: 400,
      retryable: false,
    });
  });

  it("returns explicit default fallback state when source config is unavailable", () => {
    const response = createMockResponse();
    const handler = createExchangeRateHandler({
      env: {},
      now: () => new Date("2026-06-30T12:00:00.000Z"),
    });

    handler(createRequest({}), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({
      baseCurrency: "USD",
      quoteCurrency: "ARS",
      rate: 1500,
      source: "BACKEND_DEFAULT",
      isDefault: true,
      isUnavailable: true,
      fallbackReason: "USD_ARS_EXCHANGE_RATE is not configured with a positive numeric value.",
    });
  });

  it("returns explicit default fallback state when configured source is invalid", () => {
    const response = createMockResponse();
    const handler = createExchangeRateHandler({ env: { USD_ARS_EXCHANGE_RATE: "not-a-rate" } });

    handler(createRequest({}), response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({
      rate: 1500,
      source: "BACKEND_DEFAULT",
      isDefault: true,
      isUnavailable: true,
    });
  });

  it("returns 405 for unsupported methods", () => {
    const response = createMockResponse();
    const handler = createExchangeRateHandler({ env: { USD_ARS_EXCHANGE_RATE: "1234.56" } });

    handler(createRequest({ method: "POST" }), response);

    expect(response.statusCode).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    expect(response.payload).toMatchObject({ code: "INVALID_REQUEST", status: 405 });
  });
});

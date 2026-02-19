import { afterEach, describe, expect, it, vi } from "vitest";
import { AlpacaQuotesHttpRepository } from "./alpacaQuotesClient";

describe("AlpacaQuotesHttpRepository", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes and deduplicates symbols before requesting quotes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        asOf: "2026-01-01T00:00:00.000Z",
        feed: "iex",
        quotes: [],
        unavailable: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const repository = new AlpacaQuotesHttpRepository("/api/market/quotes");
    await repository.getQuotes([" aapl ", "AAPL", "msft"]);

    const firstCallUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");
    expect(firstCallUrl).toContain("symbols=AAPL%2CMSFT");
  });

  it("throws on non-200 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => "provider failure",
    });
    vi.stubGlobal("fetch", fetchMock);

    const repository = new AlpacaQuotesHttpRepository("/api/market/quotes");

    await expect(repository.getQuotes(["AAPL"])).rejects.toThrow("provider failure");
  });
});

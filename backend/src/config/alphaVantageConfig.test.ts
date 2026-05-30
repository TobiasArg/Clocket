import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALPHA_VANTAGE_TIMEOUT_MS,
  getAlphaVantageConfig,
} from "./alphaVantageConfig";

describe("getAlphaVantageConfig", () => {
  it("returns trimmed API key and configured timeout", () => {
    expect(getAlphaVantageConfig({
      ALPHA_VANTAGE_API_KEY: "  demo-key  ",
      ALPHA_VANTAGE_TIMEOUT_MS: "25000",
    })).toEqual({
      apiKey: "demo-key",
      timeoutMs: 25_000,
    });
  });

  it("falls back to the default timeout when env timeout is missing or invalid", () => {
    expect(getAlphaVantageConfig({ ALPHA_VANTAGE_API_KEY: "demo" }).timeoutMs)
      .toBe(DEFAULT_ALPHA_VANTAGE_TIMEOUT_MS);

    expect(getAlphaVantageConfig({
      ALPHA_VANTAGE_API_KEY: "demo",
      ALPHA_VANTAGE_TIMEOUT_MS: "not-a-number",
    }).timeoutMs).toBe(DEFAULT_ALPHA_VANTAGE_TIMEOUT_MS);
  });

  it("omits blank API keys", () => {
    expect(getAlphaVantageConfig({ ALPHA_VANTAGE_API_KEY: "   " }).apiKey).toBeUndefined();
  });
});

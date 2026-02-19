// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketQuotesRepository } from "@/utils";
import { useMarketQuotes } from "./useMarketQuotes";

interface HarnessProps {
  repository: MarketQuotesRepository;
  symbols: string[];
}

function Harness({ repository, symbols }: HarnessProps) {
  useMarketQuotes({
    repository,
    symbols,
    pollingMs: 1000,
  });

  return null;
}

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("useMarketQuotes polling", () => {
  let container: HTMLDivElement;
  let root: Root;
  let visibilityState = "visible";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    visibilityState = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("polls every interval only when tab is visible", async () => {
    const repository: MarketQuotesRepository = {
      getQuotes: vi.fn(async () => ({
        asOf: new Date().toISOString(),
        feed: "iex",
        quotes: [],
        unavailable: [],
      })),
    };

    await act(async () => {
      root.render(<Harness repository={repository} symbols={["AAPL"]} />);
      await flushPromises();
    });

    expect(repository.getQuotes).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await flushPromises();
    });

    expect(repository.getQuotes).toHaveBeenCalledTimes(2);

    visibilityState = "hidden";
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
      await flushPromises();
    });

    expect(repository.getQuotes).toHaveBeenCalledTimes(2);
  });
});

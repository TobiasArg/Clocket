// @vitest-environment jsdom

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketQuotesRepository } from "@/domain/market/quotesRepository";
import { useMarketQuotes } from "./useMarketQuotes";

interface HarnessProps {
  repository: MarketQuotesRepository;
  symbols: string[];
  onSymbolsChange?: (symbols: string[]) => void;
}

function Harness({ repository, symbols, onSymbolsChange }: HarnessProps) {
  const { quoteBySymbol } = useMarketQuotes({
    repository,
    symbols,
    pollingMs: 1000,
  });

  useEffect(() => {
    onSymbolsChange?.(Array.from(quoteBySymbol.keys()));
  }, [onSymbolsChange, quoteBySymbol]);

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

  it("ignores stale responses when symbols change quickly", async () => {
    let resolveFirst: ((value: Awaited<ReturnType<MarketQuotesRepository["getQuotes"]>>) => void) | null = null;
    let resolveSecond: ((value: Awaited<ReturnType<MarketQuotesRepository["getQuotes"]>>) => void) | null = null;

    const repository: MarketQuotesRepository = {
      getQuotes: vi.fn((symbols) => {
        return new Promise((resolve) => {
          if (symbols[0] === "AAPL") {
            resolveFirst = resolve;
            return;
          }

          resolveSecond = resolve;
        });
      }),
    };
    const onSymbolsChange = vi.fn();

    await act(async () => {
      root.render(
        <Harness repository={repository} symbols={["AAPL"]} onSymbolsChange={onSymbolsChange} />,
      );
      await flushPromises();
    });

    await act(async () => {
      root.render(
        <Harness repository={repository} symbols={["MSFT"]} onSymbolsChange={onSymbolsChange} />,
      );
      await flushPromises();
    });

    expect(resolveFirst).not.toBeNull();
    expect(resolveSecond).not.toBeNull();

    await act(async () => {
      resolveSecond?.({
        asOf: "2026-02-19T00:00:00.000Z",
        feed: "iex",
        quotes: [{
          symbol: "MSFT",
          price: 100,
          previousClose: 99,
          changePercent: 1.01,
          currency: "USD",
          status: "ok",
          source: "alpaca",
        }],
        unavailable: [],
      });
      await flushPromises();
    });

    await act(async () => {
      resolveFirst?.({
        asOf: "2026-02-19T00:00:00.000Z",
        feed: "iex",
        quotes: [{
          symbol: "AAPL",
          price: 200,
          previousClose: 198,
          changePercent: 1.01,
          currency: "USD",
          status: "ok",
          source: "alpaca",
        }],
        unavailable: [],
      });
      await flushPromises();
    });

    const latestSymbols = onSymbolsChange.mock.calls.at(-1)?.[0] as string[] | undefined;
    expect(latestSymbols).toEqual(["MSFT"]);
  });
});

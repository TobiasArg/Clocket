import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { marketQuotesRepository } from "@/data/http/alpacaQuotesClient";
import type {
  MarketQuote,
  MarketQuotesRepository,
  MarketQuotesResult,
} from "@/domain/market/quotesRepository";

const DEFAULT_POLLING_MS = 30_000;

const normalizeSymbol = (value: string): string => value.trim().toUpperCase();

const normalizeSymbols = (symbols: string[]): string[] =>
  Array.from(new Set(symbols.map(normalizeSymbol).filter((symbol) => symbol.length > 0)));

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "No pudimos actualizar cotizaciones de mercado.";
};

const isDocumentVisible = (): boolean => {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState === "visible";
};

interface FetchQuotesOptions {
  silent?: boolean;
}

export interface UseMarketQuotesOptions {
  pollingMs?: number;
  repository?: MarketQuotesRepository;
  symbols: string[];
}

export interface UseMarketQuotesResult {
  asOf: string | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: string | null;
  quoteBySymbol: Map<string, MarketQuote>;
  refresh: () => Promise<void>;
  unavailableBySymbol: Map<string, string>;
}

export const useMarketQuotes = (
  options: UseMarketQuotesOptions,
): UseMarketQuotesResult => {
  const repository = useMemo(
    () => options.repository ?? marketQuotesRepository,
    [options.repository],
  );
  const pollingMs = options.pollingMs ?? DEFAULT_POLLING_MS;
  const symbols = useMemo(() => normalizeSymbols(options.symbols), [options.symbols]);
  const symbolsKey = symbols.join(",");

  const [asOf, setAsOf] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [unavailableBySymbol, setUnavailableBySymbol] = useState<Map<string, string>>(
    () => new Map<string, string>(),
  );
  const activeRequestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyResult = useCallback((result: MarketQuotesResult) => {
    setAsOf(result.asOf);
    setLastUpdatedAt(new Date().toISOString());
    setQuotes(result.quotes);
    setUnavailableBySymbol(
      new Map<string, string>(
        result.unavailable.map((item) => [item.symbol.toUpperCase(), item.reason]),
      ),
    );
  }, []);

  const fetchQuotes = useCallback(
    async (requestedSymbols: string[], optionsArg: FetchQuotesOptions = {}) => {
      const requestId = ++activeRequestIdRef.current;

      if (requestedSymbols.length === 0) {
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        setAsOf(null);
        setLastUpdatedAt(null);
        setQuotes([]);
        setUnavailableBySymbol(new Map<string, string>());
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const shouldShowLoading = !optionsArg.silent;
      if (shouldShowLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const result = await repository.getQuotes(requestedSymbols);
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        applyResult(result);
      } catch (fetchError) {
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        setError(getErrorMessage(fetchError));
      } finally {
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [applyResult, repository],
  );

  const refresh = useCallback(async () => {
    await fetchQuotes(symbols, { silent: true });
  }, [fetchQuotes, symbols]);

  useEffect(() => {
    if (!isDocumentVisible()) {
      return;
    }

    void fetchQuotes(symbols);
  }, [fetchQuotes, symbolsKey, symbols]);

  useEffect(() => {
    if (symbols.length === 0) {
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!isDocumentVisible()) {
        return;
      }

      void fetchQuotes(symbols, { silent: true });
    }, pollingMs);

    const handleVisibilityChange = () => {
      if (!isDocumentVisible()) {
        return;
      }

      void fetchQuotes(symbols, { silent: true });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchQuotes, pollingMs, symbolsKey, symbols]);

  const quoteBySymbol = useMemo(
    () => new Map<string, MarketQuote>(quotes.map((quote) => [quote.symbol.toUpperCase(), quote])),
    [quotes],
  );

  return {
    asOf,
    error,
    isLoading,
    isRefreshing,
    lastUpdatedAt,
    quoteBySymbol,
    refresh,
    unavailableBySymbol,
  };
};

import axios from "axios";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 1;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const parsePositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseOptionalNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePercent = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = value.replace("%", "").trim();
  return parseOptionalNumber(sanitized);
};

const isTransientAxiosError = (error) => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return RETRYABLE_STATUSES.has(error.response.status);
};

const toErrorDetails = (data) => {
  if (typeof data === "string") {
    return data.slice(0, 240);
  }

  if (typeof data === "object" && data !== null) {
    try {
      return JSON.stringify(data).slice(0, 240);
    } catch {
      return "Provider payload could not be serialized.";
    }
  }

  return "No details available.";
};

export class AlphaVantageClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "AlphaVantageClientError";
    this.code = options.code ?? "UNKNOWN";
    this.status = options.status ?? 502;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

const alphaVantageClient = axios.create({
  baseURL: ALPHA_VANTAGE_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

const requestAlphaVantage = async (params) => {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const response = await alphaVantageClient.get("", { params });
      const payload = response.data;

      if (payload && typeof payload === "object") {
        if (typeof payload.Note === "string" && payload.Note.trim().length > 0) {
          throw new AlphaVantageClientError("Alpha Vantage rate limit exceeded.", {
            code: "THROTTLED",
            status: 429,
            retryable: false,
            details: payload.Note,
          });
        }

        if (
          typeof payload["Error Message"] === "string" &&
          payload["Error Message"].trim().length > 0
        ) {
          throw new AlphaVantageClientError("Alpha Vantage rejected the request.", {
            code: "INVALID_SYMBOL",
            status: 422,
            retryable: false,
            details: payload["Error Message"],
          });
        }
      }

      return payload;
    } catch (error) {
      if (error instanceof AlphaVantageClientError) {
        throw error;
      }

      const canRetry = attempt < MAX_RETRIES && isTransientAxiosError(error);
      if (canRetry) {
        await wait(300 * (attempt + 1));
        attempt += 1;
        continue;
      }

      if (axios.isAxiosError(error)) {
        throw new AlphaVantageClientError("Alpha Vantage request failed.", {
          code: error.response ? "HTTP_ERROR" : "NETWORK_ERROR",
          status: error.response?.status ?? 502,
          retryable: isTransientAxiosError(error),
          details: toErrorDetails(error.response?.data ?? error.message),
        });
      }

      throw new AlphaVantageClientError("Unknown Alpha Vantage client error.", {
        code: "UNKNOWN",
        status: 502,
      });
    }
  }

  throw new AlphaVantageClientError("Retry budget exceeded for Alpha Vantage request.", {
    code: "RETRY_EXHAUSTED",
    status: 502,
  });
};

export const fetchStockQuote = async (ticker, apiKey) => {
  const normalizedTicker = String(ticker ?? "").trim().toUpperCase();
  const payload = await requestAlphaVantage({
    function: "GLOBAL_QUOTE",
    symbol: normalizedTicker,
    apikey: apiKey,
  });

  const quote = payload?.["Global Quote"];
  if (!quote || typeof quote !== "object") {
    throw new AlphaVantageClientError("Global Quote payload is missing.", {
      code: "PARSE_ERROR",
      status: 502,
    });
  }

  const currentPrice = parsePositiveNumber(quote["05. price"]);
  if (currentPrice === null) {
    throw new AlphaVantageClientError("Global Quote price is invalid.", {
      code: "PARSE_ERROR",
      status: 502,
      details: toErrorDetails(quote),
    });
  }

  return {
    assetType: "stock",
    ticker: normalizedTicker,
    currentPrice,
    source: "GLOBAL_QUOTE",
    dailyPctFromProvider: normalizePercent(quote["10. change percent"]),
    lastRefreshed: typeof quote["07. latest trading day"] === "string"
      ? quote["07. latest trading day"]
      : null,
    timezone: null,
    bid: null,
    ask: null,
  };
};

export const fetchCryptoRate = async (ticker, apiKey) => {
  const normalizedTicker = String(ticker ?? "").trim().toUpperCase();
  const payload = await requestAlphaVantage({
    function: "CURRENCY_EXCHANGE_RATE",
    from_currency: normalizedTicker,
    to_currency: "USD",
    apikey: apiKey,
  });

  const rate = payload?.["Realtime Currency Exchange Rate"];
  if (!rate || typeof rate !== "object") {
    throw new AlphaVantageClientError("Exchange rate payload is missing.", {
      code: "PARSE_ERROR",
      status: 502,
    });
  }

  const currentPrice = parsePositiveNumber(rate["5. Exchange Rate"]);
  if (currentPrice === null) {
    throw new AlphaVantageClientError("Exchange rate price is invalid.", {
      code: "PARSE_ERROR",
      status: 502,
      details: toErrorDetails(rate),
    });
  }

  return {
    assetType: "crypto",
    ticker: normalizedTicker,
    currentPrice,
    source: "CURRENCY_EXCHANGE_RATE",
    dailyPctFromProvider: null,
    lastRefreshed: typeof rate["6. Last Refreshed"] === "string"
      ? rate["6. Last Refreshed"]
      : null,
    timezone: typeof rate["7. Time Zone"] === "string"
      ? rate["7. Time Zone"]
      : null,
    bid: parseOptionalNumber(rate["8. Bid Price"]),
    ask: parseOptionalNumber(rate["9. Ask Price"]),
  };
};

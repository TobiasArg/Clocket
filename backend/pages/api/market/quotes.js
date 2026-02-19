const MAX_SYMBOLS_PER_REQUEST = 50;
const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;
const DEFAULT_TTL_MS = 15_000;
const DEFAULT_ALPACA_FEED = "iex";
const ALPACA_BASE_URL = "https://data.alpaca.markets";

const cache = new Map();

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const normalizeSymbols = (symbolsValue) => {
  const rawSymbols = Array.isArray(symbolsValue)
    ? symbolsValue.join(",")
    : symbolsValue;
  if (typeof rawSymbols !== "string") {
    return [];
  }

  const deduped = new Set();
  rawSymbols
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .forEach((symbol) => deduped.add(symbol));

  return Array.from(deduped);
};

const buildValidationError = (symbols) => {
  if (symbols.length === 0) {
    return "Query parameter 'symbols' is required.";
  }

  if (symbols.length > MAX_SYMBOLS_PER_REQUEST) {
    return `A maximum of ${MAX_SYMBOLS_PER_REQUEST} symbols is allowed.`;
  }

  const invalidSymbol = symbols.find((symbol) => !SYMBOL_PATTERN.test(symbol));
  if (invalidSymbol) {
    return `Invalid symbol '${invalidSymbol}'.`;
  }

  return null;
};

const getCacheEntry = (key) => {
  const found = cache.get(key);
  if (!found) {
    return null;
  }

  if (found.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return found.payload;
};

const setCacheEntry = (key, payload, ttlMs) => {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    payload,
  });
};

const readSnapshotPrice = (snapshot) => {
  const tradePrice = snapshot?.latestTrade?.p;
  if (typeof tradePrice === "number" && Number.isFinite(tradePrice) && tradePrice > 0) {
    return tradePrice;
  }

  const minuteClosePrice = snapshot?.minuteBar?.c;
  if (
    typeof minuteClosePrice === "number" &&
    Number.isFinite(minuteClosePrice) &&
    minuteClosePrice > 0
  ) {
    return minuteClosePrice;
  }

  const dailyClosePrice = snapshot?.dailyBar?.c;
  if (typeof dailyClosePrice === "number" && Number.isFinite(dailyClosePrice) && dailyClosePrice > 0) {
    return dailyClosePrice;
  }

  return null;
};

const buildQuote = (symbol, snapshot) => {
  const price = readSnapshotPrice(snapshot);
  if (price === null) {
    return null;
  }

  const previousClose = snapshot?.prevDailyBar?.c;
  const hasPreviousClose = (
    typeof previousClose === "number" &&
    Number.isFinite(previousClose) &&
    previousClose > 0
  );
  const changePercent = hasPreviousClose
    ? ((price - previousClose) / previousClose) * 100
    : null;

  return {
    symbol,
    price,
    previousClose: hasPreviousClose ? previousClose : null,
    changePercent,
    currency: "USD",
    status: "ok",
    source: "alpaca",
  };
};

const toUnknownError = (error) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown market provider error";
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const symbols = normalizeSymbols(req.query.symbols);
  const validationError = buildValidationError(symbols);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const apiKey = process.env.APCA_API_KEY_ID;
  const apiSecret = process.env.APCA_API_SECRET_KEY;
  if (!apiKey || !apiSecret) {
    res.status(500).json({
      error: "Missing Alpaca credentials. Set APCA_API_KEY_ID and APCA_API_SECRET_KEY.",
    });
    return;
  }

  const ttlMs = toPositiveInt(process.env.MARKET_QUOTES_TTL_MS, DEFAULT_TTL_MS);
  const feed = (process.env.ALPACA_FEED ?? DEFAULT_ALPACA_FEED).trim() || DEFAULT_ALPACA_FEED;
  const cacheKey = `${feed}:${symbols.slice().sort().join(",")}`;
  const cached = getCacheEntry(cacheKey);
  if (cached) {
    res.status(200).json({ ...cached, cache: "hit" });
    return;
  }

  const quotesUrl = new URL(`${ALPACA_BASE_URL}/v2/stocks/snapshots`);
  quotesUrl.searchParams.set("symbols", symbols.join(","));
  quotesUrl.searchParams.set("feed", feed);

  let providerResponse;
  try {
    providerResponse = await fetch(quotesUrl.toString(), {
      method: "GET",
      headers: {
        "APCA-API-KEY-ID": apiKey,
        "APCA-API-SECRET-KEY": apiSecret,
      },
    });
  } catch (error) {
    res.status(502).json({
      error: "Failed to connect to market provider.",
      details: toUnknownError(error),
    });
    return;
  }

  if (!providerResponse.ok) {
    const body = await providerResponse.text();
    res.status(502).json({
      error: "Market provider request failed.",
      details: body.slice(0, 300),
    });
    return;
  }

  const payload = await providerResponse.json();
  const snapshots = payload?.snapshots ?? {};

  const quotes = [];
  const unavailable = [];

  symbols.forEach((symbol) => {
    const snapshot = snapshots[symbol];
    if (!snapshot) {
      unavailable.push({
        symbol,
        reason: "No snapshot returned by provider.",
      });
      return;
    }

    const quote = buildQuote(symbol, snapshot);
    if (!quote) {
      unavailable.push({
        symbol,
        reason: "Ticker has no valid price in current snapshot.",
      });
      return;
    }

    quotes.push(quote);
  });

  const normalizedResponse = {
    asOf: new Date().toISOString(),
    quotes,
    unavailable,
    feed,
  };

  setCacheEntry(cacheKey, normalizedResponse, ttlMs);

  res.status(200).json({ ...normalizedResponse, cache: "miss" });
}

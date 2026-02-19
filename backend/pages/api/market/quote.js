import {
  AlphaVantageClientError,
  fetchCryptoRate,
  fetchStockQuote,
} from "../../../lib/alphaVantageClient";

const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,14}$/;

const normalizeTicker = (value) => String(value ?? "").trim().toUpperCase();

const isValidAssetType = (value) => value === "stock" || value === "crypto";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const assetType = String(req.query.assetType ?? "").trim().toLowerCase();
  const ticker = normalizeTicker(req.query.ticker);

  if (!isValidAssetType(assetType)) {
    res.status(400).json({
      error: "Query parameter 'assetType' must be 'stock' or 'crypto'.",
    });
    return;
  }

  if (!TICKER_PATTERN.test(ticker)) {
    res.status(400).json({
      error: "Query parameter 'ticker' is invalid.",
    });
    return;
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Missing ALPHA_VANTAGE_API_KEY environment variable.",
    });
    return;
  }

  try {
    const quote = assetType === "stock"
      ? await fetchStockQuote(ticker, apiKey)
      : await fetchCryptoRate(ticker, apiKey);

    res.status(200).json({
      ...quote,
      asOf: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AlphaVantageClientError) {
      res.status(error.status).json({
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return;
    }

    res.status(502).json({
      error: "Unexpected quote provider failure.",
    });
  }
}

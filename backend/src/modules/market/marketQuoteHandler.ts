import type { NextApiRequest, NextApiResponse } from "next";
import { getAlphaVantageConfig, type RuntimeEnv } from "../../config/alphaVantageConfig";
import {
  AlphaVantageClientError,
  createAlphaVantageClient,
  type MarketQuoteProvider,
} from "../../providers/alpha-vantage/alphaVantageClient";
import {
  createMarketQuoteErrorResponse,
  isValidAssetType,
  isValidTicker,
  normalizeTicker,
  withMarketQuoteAsOf,
  type MarketAssetType,
  type MarketQuoteErrorResponse,
  type MarketQuoteSuccessResponse,
} from "./marketQuoteContracts";

type MarketQuoteResponse = MarketQuoteSuccessResponse | MarketQuoteErrorResponse;

interface MarketQuoteHandlerDependencies {
  env?: RuntimeEnv;
  alphaVantageClient?: MarketQuoteProvider;
  now?: () => Date;
}

const readSingleQueryParam = (value: string | string[] | undefined): string => {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

const parseMarketQuoteQuery = (query: NextApiRequest["query"]):
  | { ok: true; assetType: MarketAssetType; ticker: string }
  | { ok: false; response: MarketQuoteErrorResponse } => {
  const assetType = readSingleQueryParam(query.assetType).trim().toLowerCase();
  const ticker = normalizeTicker(readSingleQueryParam(query.ticker));

  if (!isValidAssetType(assetType)) {
    return {
      ok: false,
      response: createMarketQuoteErrorResponse({
        error: "Query parameter 'assetType' must be 'stock' or 'crypto'.",
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  if (!isValidTicker(ticker)) {
    return {
      ok: false,
      response: createMarketQuoteErrorResponse({
        error: "Query parameter 'ticker' is invalid.",
        code: "INVALID_REQUEST",
        status: 400,
      }),
    };
  }

  return {
    ok: true,
    assetType,
    ticker,
  };
};

export const createMarketQuoteHandler = (
  dependencies: MarketQuoteHandlerDependencies = {},
) => {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MarketQuoteResponse>,
  ): Promise<void> {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      res.status(405).json(createMarketQuoteErrorResponse({
        error: "Method not allowed.",
        code: "INVALID_REQUEST",
        status: 405,
      }));
      return;
    }

    const parsedQuery = parseMarketQuoteQuery(req.query);
    if (!parsedQuery.ok) {
      res.status(parsedQuery.response.status).json(parsedQuery.response);
      return;
    }

    const config = getAlphaVantageConfig(dependencies.env);
    if (!config.apiKey) {
      const response = createMarketQuoteErrorResponse({
        error: "Missing ALPHA_VANTAGE_API_KEY environment variable.",
        code: "MISSING_API_KEY",
        status: 500,
      });
      res.status(response.status).json(response);
      return;
    }

    const alphaVantageClient = dependencies.alphaVantageClient ?? createAlphaVantageClient({
      timeoutMs: config.timeoutMs,
    });

    try {
      const quote = parsedQuery.assetType === "stock"
        ? await alphaVantageClient.fetchStockQuote(parsedQuery.ticker, config.apiKey)
        : await alphaVantageClient.fetchCryptoRate(parsedQuery.ticker, config.apiKey);

      res.status(200).json(withMarketQuoteAsOf(quote, dependencies.now?.() ?? new Date()));
    } catch (error) {
      if (error instanceof AlphaVantageClientError) {
        const response = createMarketQuoteErrorResponse({
          error: error.message,
          code: error.code,
          status: error.status,
          retryable: error.retryable,
          details: error.details,
        });
        res.status(response.status).json(response);
        return;
      }

      const response = createMarketQuoteErrorResponse({
        error: "Unexpected quote provider failure.",
        code: "UNKNOWN",
        status: 502,
        retryable: true,
      });
      res.status(response.status).json(response);
    }
  };
};

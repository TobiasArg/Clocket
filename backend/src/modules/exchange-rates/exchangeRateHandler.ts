import type { NextApiRequest, NextApiResponse } from "next";
import type { RuntimeEnv } from "../../config/alphaVantageConfig";
import {
  createExchangeRateErrorResponse,
  normalizeCurrency,
  SUPPORTED_EXCHANGE_RATE_PAIR,
  type ExchangeRateResponse,
} from "./exchangeRateContracts";
import { getUsdArsExchangeRate } from "./exchangeRateService";

interface ExchangeRateHandlerDependencies {
  env?: RuntimeEnv;
  now?: () => Date;
}

const readSingleQueryParam = (value: string | string[] | undefined): string => (
  Array.isArray(value) ? value[0] ?? "" : value ?? ""
);

export const createExchangeRateHandler = (
  dependencies: ExchangeRateHandlerDependencies = {},
) => {
  return function handler(
    req: NextApiRequest,
    res: NextApiResponse<ExchangeRateResponse>,
  ): void {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      res.status(405).json(createExchangeRateErrorResponse({
        error: "Method not allowed.",
        code: "INVALID_REQUEST",
        status: 405,
      }));
      return;
    }

    const baseCurrency = normalizeCurrency(readSingleQueryParam(req.query.baseCurrency));
    const quoteCurrency = normalizeCurrency(readSingleQueryParam(req.query.quoteCurrency));

    if (!baseCurrency || !quoteCurrency) {
      res.status(400).json(createExchangeRateErrorResponse({
        error: "Query parameters 'baseCurrency' and 'quoteCurrency' are required.",
        code: "INVALID_REQUEST",
        status: 400,
      }));
      return;
    }

    if (
      baseCurrency !== SUPPORTED_EXCHANGE_RATE_PAIR.baseCurrency ||
      quoteCurrency !== SUPPORTED_EXCHANGE_RATE_PAIR.quoteCurrency
    ) {
      res.status(400).json(createExchangeRateErrorResponse({
        error: "Unsupported exchange-rate pair.",
        code: "UNSUPPORTED_PAIR",
        status: 400,
      }));
      return;
    }

    res.status(200).json(getUsdArsExchangeRate({
      env: dependencies.env ?? process.env,
      now: dependencies.now,
    }));
  };
};

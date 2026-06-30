import type { RuntimeEnv } from "../../config/alphaVantageConfig";
import {
  DEFAULT_USD_ARS_RATE,
  type ExchangeRateSuccessResponse,
} from "./exchangeRateContracts";

const parsePositiveRate = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export interface ExchangeRateServiceDependencies {
  env?: RuntimeEnv;
  now?: () => Date;
}

export const getUsdArsExchangeRate = (
  dependencies: ExchangeRateServiceDependencies = {},
): ExchangeRateSuccessResponse => {
  const configuredRate = parsePositiveRate(dependencies.env?.USD_ARS_EXCHANGE_RATE);
  const now = dependencies.now?.() ?? new Date();

  if (configuredRate !== null) {
    return {
      baseCurrency: "USD",
      quoteCurrency: "ARS",
      rate: configuredRate,
      source: "BACKEND_CONFIG",
      asOf: now.toISOString(),
      isStale: false,
      isDefault: false,
      isUnavailable: false,
      fallbackReason: null,
    };
  }

  return {
    baseCurrency: "USD",
    quoteCurrency: "ARS",
    rate: DEFAULT_USD_ARS_RATE,
    source: "BACKEND_DEFAULT",
    asOf: now.toISOString(),
    isStale: false,
    isDefault: true,
    isUnavailable: true,
    fallbackReason: "USD_ARS_EXCHANGE_RATE is not configured with a positive numeric value.",
  };
};

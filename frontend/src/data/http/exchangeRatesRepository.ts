import { coreFinanceHttpClient, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import {
  setUsdArsExchangeRateState,
  type UsdArsExchangeRateState,
} from "@/domain/currency/transactionCurrency";

export interface ExchangeRateResponse {
  baseCurrency: "USD";
  quoteCurrency: "ARS";
  rate: number | string;
  source: "BACKEND_CONFIG" | "BACKEND_DEFAULT";
  asOf: string;
  isStale: boolean;
  isDefault: boolean;
  isUnavailable: boolean;
  fallbackReason: string | null;
}

const normalizeExchangeRatePayload = (payload: ExchangeRateResponse): UsdArsExchangeRateState => ({
  baseCurrency: "USD",
  quoteCurrency: "ARS",
  rate: Number(payload.rate),
  source: payload.source,
  asOf: payload.asOf,
  isStale: payload.isStale,
  isDefault: payload.isDefault,
  isUnavailable: payload.isUnavailable,
  fallbackReason: payload.fallbackReason,
});

export const fetchUsdArsExchangeRate = async (): Promise<UsdArsExchangeRateState> => {
  return withCoreFinanceErrors(async () => {
    const response = await coreFinanceHttpClient.get<ExchangeRateResponse>("/api/exchange-rates", {
      params: {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
      },
    });

    return normalizeExchangeRatePayload(response.data);
  });
};

export const refreshUsdArsExchangeRate = async (
  fetchRate: () => Promise<UsdArsExchangeRateState> = fetchUsdArsExchangeRate,
): Promise<UsdArsExchangeRateState> => {
  const rateState = await fetchRate();
  return setUsdArsExchangeRateState(rateState);
};

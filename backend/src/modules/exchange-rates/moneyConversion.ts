import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import type { ExchangeRateSuccessResponse } from "./exchangeRateContracts";

export type MoneyCurrency = "USD" | "ARS";

export interface MoneyConversionContext {
  currency: MoneyCurrency;
  exchangeRate: ExchangeRateSuccessResponse;
}

export const parseDisplayCurrency = (
  query: Record<string, string | string[] | undefined> | undefined,
): MoneyCurrency | undefined => {
  const value = query?.currency ?? query?.displayCurrency;
  if (value === undefined) {
    return undefined;
  }

  if (value === "USD" || value === "ARS") {
    return value;
  }

  throw new CoreFinanceApiError("Query parameter 'currency' must be 'USD' or 'ARS'.", {
    code: "INVALID_REQUEST",
    status: 400,
  });
};

export const toFiniteMoneyNumber = (value: string | number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const convertMoneyAmount = (
  amount: string | number,
  sourceCurrency: MoneyCurrency,
  targetCurrency: MoneyCurrency,
  usdArsRate: number,
): number => {
  const value = toFiniteMoneyNumber(amount);
  const normalizedRate = Number.isFinite(usdArsRate) && usdArsRate > 0 ? usdArsRate : 1;

  if (sourceCurrency === targetCurrency) {
    return value;
  }

  if (sourceCurrency === "USD" && targetCurrency === "ARS") {
    return value * normalizedRate;
  }

  return value / normalizedRate;
};

export const convertToDisplayCurrency = (
  amount: string | number,
  sourceCurrency: MoneyCurrency,
  context: MoneyConversionContext | null,
): number => {
  if (!context) {
    return toFiniteMoneyNumber(amount);
  }

  return convertMoneyAmount(amount, sourceCurrency, context.currency, context.exchangeRate.rate);
};

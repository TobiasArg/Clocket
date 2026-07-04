export type TransactionInputCurrency = "ARS" | "USD";

export const DEFAULT_USD_RATE = 1500;

export interface UsdArsExchangeRateState {
  baseCurrency: "USD";
  quoteCurrency: "ARS";
  rate: number;
  source: "BACKEND_CONFIG" | "BACKEND_DEFAULT" | "FRONTEND_FALLBACK";
  asOf: string | null;
  isStale: boolean;
  isDefault: boolean;
  isUnavailable: boolean;
  fallbackReason: string | null;
}

const createFallbackUsdArsRateState = (fallbackReason: string): UsdArsExchangeRateState => ({
  baseCurrency: "USD",
  quoteCurrency: "ARS",
  rate: DEFAULT_USD_RATE,
  source: "FRONTEND_FALLBACK",
  asOf: null,
  isStale: false,
  isDefault: true,
  isUnavailable: true,
  fallbackReason,
});

let usdArsRateState: UsdArsExchangeRateState = createFallbackUsdArsRateState(
  "Backend exchange-rate state has not been loaded yet.",
);

export const normalizeUsdRate = (value: number | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_USD_RATE;
  }

  return value;
};

export const getUsdArsExchangeRateState = (): UsdArsExchangeRateState => usdArsRateState;

export const setUsdArsExchangeRateState = (
  nextState: UsdArsExchangeRateState,
): UsdArsExchangeRateState => {
  usdArsRateState = {
    ...nextState,
    rate: normalizeUsdRate(nextState.rate),
  };
  return usdArsRateState;
};

export const resetUsdArsExchangeRateStateForTests = (): UsdArsExchangeRateState => {
  usdArsRateState = createFallbackUsdArsRateState(
    "Backend exchange-rate state has not been loaded yet.",
  );
  return usdArsRateState;
};

export const getUsdRate = (): number => usdArsRateState.rate;

export const convertCurrencyAmount = (
  amount: number,
  sourceCurrency: TransactionInputCurrency,
  targetCurrency: TransactionInputCurrency,
  usdRate: number = getUsdRate(),
): number => {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  const normalizedRate = normalizeUsdRate(usdRate);
  if (sourceCurrency === targetCurrency) {
    return amount;
  }

  if (sourceCurrency === "USD" && targetCurrency === "ARS") {
    return amount * normalizedRate;
  }

  return amount / normalizedRate;
};

export const toArsTransactionAmount = (
  amount: number,
  currency: TransactionInputCurrency,
  usdRate: number = getUsdRate(),
): number => {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (currency === "USD") {
    return convertCurrencyAmount(amount, "USD", "ARS", usdRate);
  }

  return amount;
};

export type TransactionInputCurrency = "ARS" | "USD";

export const DEFAULT_USD_RATE = 1500;

export const normalizeUsdRate = (value: number | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_USD_RATE;
  }

  return value;
};

// TODO: replace with API value when exchange-rate integration is ready.
export const getUsdRate = (): number => DEFAULT_USD_RATE;

export const toArsTransactionAmount = (
  amount: number,
  currency: TransactionInputCurrency,
  usdRate: number = getUsdRate(),
): number => {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (currency === "USD") {
    return amount * normalizeUsdRate(usdRate);
  }

  return amount;
};

import type { UsdArsExchangeRateState } from "@/domain/currency/transactionCurrency";

export const buildAnalyticsVersionKey = (
  rows: Array<Array<string | number | boolean | undefined | null>>,
): string => rows.map((parts) => parts.join(":")).join("|");

export const buildExchangeRateVersionKey = (rateState: UsdArsExchangeRateState): string => buildAnalyticsVersionKey([[
  rateState.rate,
  rateState.source,
  rateState.asOf,
  rateState.isDefault,
  rateState.isUnavailable,
]]);

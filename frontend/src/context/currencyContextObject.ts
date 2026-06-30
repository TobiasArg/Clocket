import { createContext } from "react";
import type { SupportedCurrency, UsdArsExchangeRateState } from "@/utils";

export interface CurrencyContextValue {
  currency: SupportedCurrency;
  isLoading: boolean;
  locale: string;
  usdArsRateState: UsdArsExchangeRateState;
  formatMoney: (value: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);

import { createContext } from "react";
import type { SupportedCurrency } from "@/utils";

export interface CurrencyContextValue {
  currency: SupportedCurrency;
  isLoading: boolean;
  locale: string;
  formatMoney: (value: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);

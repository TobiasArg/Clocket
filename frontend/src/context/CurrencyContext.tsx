import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  formatCurrency,
  resolveLocaleForCurrency,
  setGlobalCurrency,
  type SupportedCurrency,
} from "@/utils";

export interface CurrencyContextValue {
  currency: SupportedCurrency;
  isLoading: boolean;
  locale: string;
  formatMoney: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const FALLBACK_CURRENCY: SupportedCurrency = "ARS";
const FALLBACK_LOCALE = resolveLocaleForCurrency(FALLBACK_CURRENCY);

export interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { settings, isLoading } = useAppSettings();
  const currency: SupportedCurrency = settings?.currency === "USD" ? "USD" : "ARS";
  const locale = resolveLocaleForCurrency(currency);

  useEffect(() => {
    setGlobalCurrency(currency);
  }, [currency]);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    isLoading,
    locale,
    formatMoney: (amount: number) => formatCurrency(amount, { currency, locale }),
  }), [currency, isLoading, locale]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (context) {
    return context;
  }

  return {
    currency: FALLBACK_CURRENCY,
    isLoading: false,
    locale: FALLBACK_LOCALE,
    formatMoney: (amount: number) => formatCurrency(amount, {
      currency: FALLBACK_CURRENCY,
      locale: FALLBACK_LOCALE,
    }),
  };
};

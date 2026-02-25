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
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider.");
  }

  return context;
};

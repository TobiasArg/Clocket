import { useEffect, useMemo, type ReactNode } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  formatCurrency,
  resolveLocaleForCurrency,
  setGlobalCurrency,
  type SupportedCurrency,
} from "@/utils";
import { CurrencyContext, type CurrencyContextValue } from "./currencyContextObject";

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

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      isLoading,
      locale,
      formatMoney: (amount: number) => formatCurrency(amount, { currency, locale }),
    }),
    [currency, isLoading, locale],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

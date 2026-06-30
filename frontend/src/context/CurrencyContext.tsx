import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  applyTheme,
  formatCurrency,
  getUsdArsExchangeRateState,
  refreshUsdArsExchangeRate,
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
  const theme = settings?.theme;
  const [usdArsRateState, setUsdArsRateState] = useState(getUsdArsExchangeRateState);

  useEffect(() => {
    setGlobalCurrency(currency);
  }, [currency]);

  useEffect(() => {
    if (!theme) {
      return;
    }

    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    refreshUsdArsExchangeRate()
      .then((rateState) => {
        if (isMounted) {
          setUsdArsRateState(rateState);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUsdArsRateState(getUsdArsExchangeRateState());
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      isLoading,
      locale,
      usdArsRateState,
      formatMoney: (amount: number) => formatCurrency(amount, { currency, locale }),
    }),
    [currency, isLoading, locale, usdArsRateState],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

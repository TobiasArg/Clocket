import { useContext } from "react";
import { CurrencyContext, type CurrencyContextValue } from "./currencyContextObject";

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider.");
  }

  return context;
};

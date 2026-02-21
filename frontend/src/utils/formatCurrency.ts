export type SupportedCurrency = "ARS" | "USD";

export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
}

const LOCALE_BY_CURRENCY: Record<SupportedCurrency, string> = {
  ARS: "es-AR",
  USD: "en-US",
};

let globalCurrency: SupportedCurrency = "ARS";

const normalizeCurrency = (currency: string | undefined): SupportedCurrency => {
  return currency === "USD" ? "USD" : "ARS";
};

export const resolveLocaleForCurrency = (currency: SupportedCurrency): string => {
  return LOCALE_BY_CURRENCY[currency];
};

export const setGlobalCurrency = (currency: string): void => {
  globalCurrency = normalizeCurrency(currency);
};

export const getGlobalCurrency = (): SupportedCurrency => {
  return globalCurrency;
};

export const formatCurrency = (
  value: number,
  options: FormatCurrencyOptions = {},
): string => {
  const currency = normalizeCurrency(options.currency ?? globalCurrency);
  const locale = options.locale ?? resolveLocaleForCurrency(currency);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

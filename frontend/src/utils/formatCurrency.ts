export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
}

export const formatCurrency = (
  value: number,
  options: FormatCurrencyOptions = {},
): string => {
  const { currency = "ARS", locale = "es-AR" } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

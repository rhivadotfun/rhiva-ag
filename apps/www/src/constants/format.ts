export const currencyIntlArgs: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
};

export const compactCurrencyIntlArgs: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "USD",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
};

export const percentageIntlArgs: Intl.NumberFormatOptions = {
  style: "unit",
  unit: "percent",
  unitDisplay: "narrow",
  signDisplay: "exceptZero",
  maximumFractionDigits: 4,
};

export type PaymentProvider = "STRIPE" | "PAYSTACK";

export interface CurrencyConfig {
  provider: PaymentProvider;
  currency: string;
  currencySymbol: string;
  countryName: string;
}

export const COUNTRY_CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  NG: { provider: "PAYSTACK", currency: "NGN", currencySymbol: "₦", countryName: "Nigeria" },
  GH: { provider: "PAYSTACK", currency: "GHS", currencySymbol: "GH₵", countryName: "Ghana" },
  US: { provider: "STRIPE", currency: "USD", currencySymbol: "$", countryName: "United States" },
  GB: { provider: "STRIPE", currency: "GBP", currencySymbol: "£", countryName: "United Kingdom" },
};

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  provider: "STRIPE",
  currency: "USD",
  currencySymbol: "$",
  countryName: "United States",
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  nigeria: "NG",
  ghana: "GH",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  america: "US",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  england: "GB",
  london: "GB",
};

export function getCurrencyConfig(countryCodeOrName: string | null | undefined): CurrencyConfig {
  if (!countryCodeOrName) return DEFAULT_CURRENCY_CONFIG;

  const normalized = countryCodeOrName.trim().toLowerCase();
  const code = normalized.length === 2
    ? normalized.toUpperCase()
    : COUNTRY_NAME_TO_CODE[normalized];

  return code ? COUNTRY_CURRENCY_CONFIG[code] ?? DEFAULT_CURRENCY_CONFIG : DEFAULT_CURRENCY_CONFIG;
}

export function getProviderFromCurrency(currency: string): PaymentProvider {
  return ["NGN", "GHS"].includes(currency.toUpperCase()) ? "PAYSTACK" : "STRIPE";
}

export function getCurrencySymbol(currency: string): string {
  const match = Object.values(COUNTRY_CURRENCY_CONFIG).find(
    (config) => config.currency === currency.toUpperCase()
  );
  return match?.currencySymbol ?? currency.toUpperCase();
}

export function formatAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: code === "NGN" ? 0 : 2,
      maximumFractionDigits: code === "NGN" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(code)}${amount.toLocaleString("en-US", {
      minimumFractionDigits: code === "NGN" ? 0 : 2,
      maximumFractionDigits: code === "NGN" ? 0 : 2,
    })}`;
  }
}

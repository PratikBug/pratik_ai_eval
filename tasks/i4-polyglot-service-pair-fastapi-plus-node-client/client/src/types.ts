export interface ConvertRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

export interface ConvertResponse {
  amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  rate: number;
}

export const DEFAULT_I4_API_BASE = "http://127.0.0.1:8768";

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

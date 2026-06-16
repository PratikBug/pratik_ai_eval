export const I4_SERVICE_BASE = "/api/i4/service";

export const I4_SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR"] as const;

export type I4Currency = (typeof I4_SUPPORTED_CURRENCIES)[number];

export interface I4ConvertRequest {
  amount: number;
  from_currency: I4Currency;
  to_currency: I4Currency;
}

export interface I4ConvertResponse {
  amount: number;
  from_currency: I4Currency;
  to_currency: I4Currency;
  converted_amount: number;
  rate: number;
}

export const I4_DEFAULT_CONVERT: I4ConvertRequest = {
  amount: 100,
  from_currency: "USD",
  to_currency: "EUR",
};

export interface I4CliRunResponse {
  output: string;
  exitCode: number;
}

export interface I4TestRunResponse {
  output: string;
  exitCode: number;
  summary: {
    passed: boolean;
    testsPassed?: number | null;
    testFilesPassed?: number | null;
    durationMs?: number | null;
  };
}

export function formatI4ConvertResult(result: I4ConvertResponse): string {
  return `${result.amount} ${result.from_currency} = ${result.converted_amount} ${result.to_currency} (rate ${result.rate})`;
}

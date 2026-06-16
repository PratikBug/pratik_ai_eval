import { fileURLToPath } from "node:url";
import { convertCurrency, formatConvertResult } from "./client";
import { DEFAULT_I4_API_BASE, SUPPORTED_CURRENCIES, type SupportedCurrency } from "./types";

export interface ParsedCliArgs {
  amount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  baseUrl: string;
}

function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value.toUpperCase());
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const args = [...argv];
  let baseUrl = DEFAULT_I4_API_BASE;

  const baseFlagIndex = args.indexOf("--base-url");
  if (baseFlagIndex >= 0) {
    const customBase = args[baseFlagIndex + 1];
    if (!customBase) {
      throw new Error("--base-url requires a value");
    }
    baseUrl = customBase;
    args.splice(baseFlagIndex, 2);
  }

  if (args.length < 3) {
    throw new Error("Usage: convert <amount> <from_currency> <to_currency> [--base-url URL]");
  }

  const [amountRaw, fromRaw, toRaw] = args;
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  const fromCurrency = fromRaw.toUpperCase();
  const toCurrency = toRaw.toUpperCase();

  if (!isSupportedCurrency(fromCurrency)) {
    throw new Error(`unsupported from_currency: ${fromRaw}`);
  }
  if (!isSupportedCurrency(toCurrency)) {
    throw new Error(`unsupported to_currency: ${toRaw}`);
  }

  return { amount, fromCurrency, toCurrency, baseUrl };
}

export function buildConvertRequest(args: ParsedCliArgs) {
  return {
    amount: args.amount,
    from_currency: args.fromCurrency,
    to_currency: args.toCurrency,
  };
}

async function main() {
  try {
    const parsed = parseCliArgs(process.argv.slice(2));
    const result = await convertCurrency(parsed.baseUrl, buildConvertRequest(parsed));
    console.log(formatConvertResult(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}

import { convertCurrency, formatConvertResult } from "../src/client";
import { DEFAULT_I4_API_BASE } from "../src/types";

async function main() {
  const baseUrl = process.env.I4_API_BASE ?? DEFAULT_I4_API_BASE;
  const amount = Number(process.env.I4_VERIFY_AMOUNT ?? "25");
  const from = process.env.I4_VERIFY_FROM ?? "USD";
  const to = process.env.I4_VERIFY_TO ?? "GBP";

  const result = await convertCurrency(baseUrl, {
    amount,
    from_currency: from,
    to_currency: to,
  });

  console.log(formatConvertResult(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

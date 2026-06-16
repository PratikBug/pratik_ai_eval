import type { ConvertRequest, ConvertResponse } from "./types";

export async function convertCurrency(
  baseUrl: string,
  payload: ConvertRequest,
): Promise<ConvertResponse> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ConvertResponse & { detail?: unknown };

  if (!response.ok) {
    const detail =
      typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
    throw new Error(`Convert failed (${response.status}): ${detail}`);
  }

  return body;
}

export function formatConvertResult(result: ConvertResponse): string {
  return `${result.amount} ${result.from_currency} = ${result.converted_amount} ${result.to_currency} (rate ${result.rate})`;
}

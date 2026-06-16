export function formatMoney(value: number): string {
  return value.toFixed(2);
}

export function parseAmount(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const raw = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;

  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  return formatMoney(numeric);
}

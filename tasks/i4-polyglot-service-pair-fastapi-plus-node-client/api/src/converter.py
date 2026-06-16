"""Hardcoded currency rates for I4 demo conversions."""

from typing import Dict, Tuple

# Value of 1 unit of each currency expressed in USD (hardcoded demo rates).
RATES_TO_USD: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 1.09,
    "GBP": 1.27,
    "INR": 0.012,
}

SUPPORTED_CURRENCIES = frozenset(RATES_TO_USD.keys())


def convert_amount(amount: float, from_currency: str, to_currency: str) -> Tuple[float, float]:
    from_code = from_currency.upper()
    to_code = to_currency.upper()

    if from_code not in RATES_TO_USD:
        raise ValueError(f"Unsupported currency: {from_currency}")
    if to_code not in RATES_TO_USD:
        raise ValueError(f"Unsupported currency: {to_currency}")

    usd_value = amount * RATES_TO_USD[from_code]
    converted = usd_value / RATES_TO_USD[to_code]
    rate = converted / amount if amount else 0.0

    return round(converted, 4), round(rate, 6)

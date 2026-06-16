"""Acme checkout shipping calculator (I6 seeded-bug service)."""

FREE_SHIPPING_THRESHOLD_CENTS = 5000  # $50.00
STANDARD_SHIPPING_CENTS = 599  # $5.99


def calculate_shipping(subtotal_cents: int) -> int:
    if subtotal_cents < 0:
        raise ValueError("subtotal must be non-negative")

    if subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS:
        return 0

    return STANDARD_SHIPPING_CENTS

#!/usr/bin/env python3
"""Demonstrate the seeded I6 bug without modifying fixed source."""
FREE_SHIPPING_THRESHOLD_CENTS = 5000
STANDARD_SHIPPING_CENTS = 599


def buggy_calculate_shipping(subtotal_cents: int) -> int:
    # Seeded bug: strict > excludes exactly $50.00
    if subtotal_cents > FREE_SHIPPING_THRESHOLD_CENTS:
        return 0
    return STANDARD_SHIPPING_CENTS


def fixed_calculate_shipping(subtotal_cents: int) -> int:
    if subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS:
        return 0
    return STANDARD_SHIPPING_CENTS


def main() -> None:
    subtotal = FREE_SHIPPING_THRESHOLD_CENTS
    buggy = buggy_calculate_shipping(subtotal)
    fixed = fixed_calculate_shipping(subtotal)

    print(f"Subtotal: ${subtotal / 100:.2f} ({subtotal} cents)")
    print(f"Buggy shipping fee:  {buggy} cents (${buggy / 100:.2f})")
    print(f"Fixed shipping fee:  {fixed} cents (${fixed / 100:.2f})")
    print()
    if buggy != fixed:
        print("BUG REPRODUCED: exactly $50.00 should ship free but buggy code charges $5.99")
    else:
        print("No difference at this subtotal")


if __name__ == "__main__":
    main()

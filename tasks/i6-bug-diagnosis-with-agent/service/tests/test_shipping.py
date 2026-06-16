import pytest

from src.shipping import (
    FREE_SHIPPING_THRESHOLD_CENTS,
    STANDARD_SHIPPING_CENTS,
    calculate_shipping,
)


def test_charges_standard_shipping_below_threshold():
    assert calculate_shipping(4999) == STANDARD_SHIPPING_CENTS


def test_free_shipping_at_exactly_fifty_dollars():
    """Reproduction case: subtotal exactly $50.00 must ship free."""
    assert calculate_shipping(FREE_SHIPPING_THRESHOLD_CENTS) == 0


def test_free_shipping_above_threshold():
    assert calculate_shipping(7500) == 0


def test_rejects_negative_subtotal():
    with pytest.raises(ValueError, match="subtotal"):
        calculate_shipping(-1)

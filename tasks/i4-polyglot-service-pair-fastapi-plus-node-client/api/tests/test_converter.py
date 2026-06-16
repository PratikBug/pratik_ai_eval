import pytest

from src.converter import RATES_TO_USD, convert_amount


def test_rates_include_usd_eur_gbp_inr():
    assert set(RATES_TO_USD.keys()) == {"USD", "EUR", "GBP", "INR"}


def test_convert_usd_to_eur():
    converted, rate = convert_amount(100, "USD", "EUR")
    assert converted == pytest.approx(91.7431, rel=1e-3)
    assert rate == pytest.approx(converted / 100, rel=1e-3)


def test_convert_eur_to_usd():
    converted, _rate = convert_amount(100, "EUR", "USD")
    assert converted == pytest.approx(109.0)


def test_convert_same_currency():
    converted, rate = convert_amount(50, "USD", "USD")
    assert converted == 50.0
    assert rate == 1.0


def test_convert_rejects_unknown_currency():
    with pytest.raises(ValueError, match="Unsupported currency"):
        convert_amount(10, "USD", "JPY")

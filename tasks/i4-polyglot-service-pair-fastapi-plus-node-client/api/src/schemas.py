from typing import Literal

from pydantic import BaseModel, Field

SupportedCurrency = Literal["USD", "EUR", "GBP", "INR"]


class ConvertRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Positive amount to convert")
    from_currency: SupportedCurrency
    to_currency: SupportedCurrency


class ConvertResponse(BaseModel):
    amount: float
    from_currency: SupportedCurrency
    to_currency: SupportedCurrency
    converted_amount: float
    rate: float


class RatesResponse(BaseModel):
    base: Literal["USD"] = "USD"
    rates: dict[str, float]

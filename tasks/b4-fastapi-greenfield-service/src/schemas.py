from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TransactionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2, max_digits=12)
    type: Literal["credit", "debit"]
    description: Optional[str] = Field(default=None, max_length=200)

    @field_validator("amount", mode="before")
    @classmethod
    def normalize_amount(cls, value: object) -> object:
        if isinstance(value, (int, float, str)):
            return str(value)
        return value


class TransactionResponse(BaseModel):
    id: int
    amount: Decimal
    type: Literal["credit", "debit"]
    description: Optional[str]


class BalanceResponse(BaseModel):
    balance: Decimal
    currency: Literal["USD"] = "USD"

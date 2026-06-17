from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    amount: float
    category: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BalanceResponse(BaseModel):
    balance: float

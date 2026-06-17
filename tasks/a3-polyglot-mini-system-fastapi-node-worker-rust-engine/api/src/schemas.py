from typing import List, Optional

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    transaction_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    merchant_id: str = Field(min_length=1)


class EventAccepted(BaseModel):
    transaction_id: str
    status: str = "accepted"


class ScoreRecord(BaseModel):
    transaction_id: str
    amount: float
    merchant_id: str
    score: int
    reasons: List[str]


class HealthResponse(BaseModel):
    status: str = "ok"

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from .schemas import TransactionCreate, TransactionResponse


@dataclass
class TransactionRecord:
    id: int
    amount: Decimal
    type: str
    description: Optional[str]


class TransactionStore:
    def __init__(self) -> None:
        self._records: list[TransactionRecord] = []
        self._next_id = 1

    def reset(self) -> None:
        self._records.clear()
        self._next_id = 1

    def create(self, payload: TransactionCreate) -> TransactionResponse:
        record = TransactionRecord(
            id=self._next_id,
            amount=payload.amount,
            type=payload.type,
            description=payload.description,
        )
        self._next_id += 1
        self._records.append(record)
        return TransactionResponse(
            id=record.id,
            amount=record.amount,
            type=record.type,  # type: ignore[arg-type]
            description=record.description,
        )

    def list_all(self) -> list[TransactionResponse]:
        return [
            TransactionResponse(
                id=record.id,
                amount=record.amount,
                type=record.type,  # type: ignore[arg-type]
                description=record.description,
            )
            for record in self._records
        ]

    def balance(self) -> Decimal:
        total = Decimal("0")
        for record in self._records:
            if record.type == "credit":
                total += record.amount
            else:
                total -= record.amount
        return total


store = TransactionStore()

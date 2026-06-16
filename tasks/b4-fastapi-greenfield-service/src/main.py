from fastapi import FastAPI

from .schemas import BalanceResponse, TransactionCreate, TransactionResponse
from .store import store

app = FastAPI(
    title="B4 Transaction Ledger",
    description="Small FastAPI service for recording credits/debits and reporting balance.",
    version="0.1.0",
)


def reset_store() -> None:
    store.reset()


@app.post("/reset")
def reset_ledger():
    reset_store()
    return {"status": "reset"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/transactions", response_model=TransactionResponse, status_code=201)
def create_transaction(payload: TransactionCreate) -> TransactionResponse:
    return store.create(payload)


@app.get("/transactions", response_model=list[TransactionResponse])
def list_transactions() -> list[TransactionResponse]:
    return store.list_all()


@app.get("/balance", response_model=BalanceResponse)
def get_balance() -> BalanceResponse:
    return BalanceResponse(balance=store.balance())

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction
from app.schemas import BalanceResponse

router = APIRouter()


@router.get("/balance", response_model=BalanceResponse)
def get_balance(db: Session = Depends(get_db)):
    total = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).scalar()
    return BalanceResponse(balance=float(total))

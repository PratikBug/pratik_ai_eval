from fastapi import FastAPI

from app.database import Base, engine
from app.routes import balance, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(transactions.router)
app.include_router(balance.router)

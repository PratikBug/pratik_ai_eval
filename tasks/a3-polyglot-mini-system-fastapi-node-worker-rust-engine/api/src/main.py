import httpx
from fastapi import FastAPI, HTTPException, status

from .config import WORKER_URL
from .schemas import EventAccepted, EventCreate, HealthResponse, ScoreRecord

app = FastAPI(
    title="A3 Fraud Score API",
    description="FastAPI ingestion for the A3 polyglot fraud-score mini-system.",
    version="0.1.0",
)

score_store: dict[str, ScoreRecord] = {}


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/events", response_model=EventAccepted, status_code=status.HTTP_202_ACCEPTED)
def ingest_event(payload: EventCreate) -> EventAccepted:
    try:
        response = httpx.post(
            WORKER_URL,
            json=payload.model_dump(),
            timeout=5.0,
        )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Worker unavailable: {error}",
        ) from error

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=response.text or "Worker processing failed",
        )

    worker_result = response.json()
    score_store[payload.transaction_id] = ScoreRecord(
        transaction_id=payload.transaction_id,
        amount=payload.amount,
        merchant_id=payload.merchant_id,
        score=int(worker_result["score"]),
        reasons=list(worker_result.get("reasons", [])),
    )
    return EventAccepted(transaction_id=payload.transaction_id)


@app.get("/scores/{transaction_id}", response_model=ScoreRecord)
def get_score(transaction_id: str) -> ScoreRecord:
    record = score_store.get(transaction_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Score not found")
    return record

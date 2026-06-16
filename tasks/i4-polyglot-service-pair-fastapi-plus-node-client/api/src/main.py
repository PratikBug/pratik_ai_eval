from fastapi import FastAPI, HTTPException

from .converter import RATES_TO_USD, convert_amount
from .schemas import ConvertRequest, ConvertResponse, RatesResponse

app = FastAPI(
    title="I4 Currency Converter",
    description="FastAPI service with hardcoded FX rates for the polyglot I4 demo.",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/rates", response_model=RatesResponse)
def list_rates() -> RatesResponse:
    return RatesResponse(rates=dict(RATES_TO_USD))


@app.post("/convert", response_model=ConvertResponse)
def convert(payload: ConvertRequest) -> ConvertResponse:
    try:
        converted_amount, rate = convert_amount(
            payload.amount,
            payload.from_currency,
            payload.to_currency,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return ConvertResponse(
        amount=payload.amount,
        from_currency=payload.from_currency,
        to_currency=payload.to_currency,
        converted_amount=converted_amount,
        rate=rate,
    )

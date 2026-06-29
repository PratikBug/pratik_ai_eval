import os
from contextlib import asynccontextmanager
from typing import Literal
from uuid import UUID

import psycopg
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from src.observability import (
    ObservabilityMiddleware,
    metrics_asgi_app,
    record_job_created,
    setup_logging,
)

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://d2user:d2pass@db:5432/d2jobs",
)

logger = setup_logging()

JobStatus = Literal["pending", "processing", "done"]


class JobCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class JobResponse(BaseModel):
    id: UUID
    name: str
    status: JobStatus


def get_conn() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    for attempt in range(30):
        try:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
            logger.info(
                "database ready",
                extra={"event": "db_ready", "attempt": attempt + 1},
            )
            break
        except psycopg.OperationalError:
            if attempt == 29:
                raise
            import asyncio

            await asyncio.sleep(1)
    yield


app = FastAPI(title="D2 Job API", lifespan=lifespan)
app.add_middleware(ObservabilityMiddleware, logger=logger)
app.mount("/metrics", metrics_asgi_app())


@app.get("/health")
def health() -> dict[str, str]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
    return {"status": "ok", "database": "connected"}


@app.get("/jobs", response_model=list[JobResponse])
def list_jobs() -> list[JobResponse]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, status FROM jobs ORDER BY created_at ASC"
            )
            rows = cur.fetchall()
    return [JobResponse(id=r[0], name=r[1], status=r[2]) for r in rows]


@app.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID) -> JobResponse:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, name, status FROM jobs WHERE id = %s",
                (job_id,),
            )
            row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(id=row[0], name=row[1], status=row[2])


@app.post("/jobs", response_model=JobResponse, status_code=201)
def create_job(body: JobCreate) -> JobResponse:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO jobs (name, status)
                VALUES (%s, 'pending')
                RETURNING id, name, status
                """,
                (body.name,),
            )
            row = cur.fetchone()
            conn.commit()
    job = JobResponse(id=row[0], name=row[1], status=row[2])
    record_job_created(logger, str(job.id), job.name, job.status)
    return job

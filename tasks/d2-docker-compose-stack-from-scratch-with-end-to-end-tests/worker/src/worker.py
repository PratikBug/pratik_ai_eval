import logging
import os
import time
from uuid import UUID

import psycopg

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://d2user:d2pass@db:5432/d2jobs",
)
POLL_INTERVAL = float(os.environ.get("POLL_INTERVAL", "1.0"))
WORK_SLEEP = float(os.environ.get("WORK_SLEEP", "0.5"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s service=worker %(message)s",
)
logger = logging.getLogger(__name__)


def wait_for_db() -> None:
    for attempt in range(60):
        try:
            with psycopg.connect(DATABASE_URL) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
            logger.info("event=db_ready attempt=%s", attempt + 1)
            return
        except psycopg.OperationalError:
            time.sleep(1)
    raise RuntimeError("Database did not become ready")


def claim_next_job(conn: psycopg.Connection) -> tuple[UUID, str] | None:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name FROM jobs
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
            """
        )
        row = cur.fetchone()
        if row is None:
            return None
        job_id, name = row[0], row[1]
        cur.execute(
            """
            UPDATE jobs
            SET status = 'processing', updated_at = NOW()
            WHERE id = %s
            """,
            (job_id,),
        )
        conn.commit()
    return job_id, name


def complete_job(conn: psycopg.Connection, job_id: UUID) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE jobs
            SET status = 'done', updated_at = NOW()
            WHERE id = %s
            """,
            (job_id,),
        )
        conn.commit()


def run_once(conn: psycopg.Connection) -> bool:
    claimed = claim_next_job(conn)
    if claimed is None:
        return False
    job_id, name = claimed
    logger.info(
        "event=job_picked job_id=%s name=%s status=processing",
        job_id,
        name,
    )
    time.sleep(WORK_SLEEP)
    complete_job(conn, job_id)
    logger.info(
        "event=job_completed job_id=%s name=%s status=done",
        job_id,
        name,
    )
    return True


def main() -> None:
    logger.info("event=worker_start poll_interval=%s", POLL_INTERVAL)
    wait_for_db()
    while True:
        with psycopg.connect(DATABASE_URL) as conn:
            processed = run_once(conn)
        if not processed:
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()

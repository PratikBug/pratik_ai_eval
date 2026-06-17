from __future__ import annotations

import json
import logging
import re
import time
import uuid
from typing import Callable

from prometheus_client import Counter, Histogram, make_asgi_app
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

SERVICE_NAME = "job-api"

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)

JOBS_CREATED_TOTAL = Counter(
    "jobs_created_total",
    "Total jobs created via POST /jobs",
)

UUID_PATH_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "message": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key.startswith("_") or key in {
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "stack_info",
                "exc_info",
                "exc_text",
                "thread",
                "threadName",
                "taskName",
            }:
                continue
            if key in {"event", "method", "path", "status_code", "duration_ms", "request_id", "job_id", "job_name", "status", "attempt"}:
                payload[key] = value
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def setup_logging() -> logging.Logger:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    return logging.getLogger(SERVICE_NAME)


def normalize_path(path: str) -> str:
    if path == "/metrics":
        return "/metrics"
    parts = path.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == "jobs" and UUID_PATH_RE.match(parts[1]):
        return "/jobs/{job_id}"
    return path or "/"


def metrics_asgi_app() -> Callable:
    return make_asgi_app()


class ObservabilityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, logger: logging.Logger) -> None:
        super().__init__(app)
        self.logger = logger

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path == "/metrics":
            return await call_next(request)

        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            path = normalize_path(request.url.path)
            method = request.method
            status = str(status_code)

            HTTP_REQUESTS_TOTAL.labels(method=method, path=path, status=status).inc()
            HTTP_REQUEST_DURATION_SECONDS.labels(method=method, path=path).observe(
                duration_ms / 1000.0
            )

            self.logger.info(
                "request completed",
                extra={
                    "event": "request_completed",
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": duration_ms,
                },
            )


def record_job_created(logger: logging.Logger, job_id: str, job_name: str, status: str) -> None:
    JOBS_CREATED_TOTAL.inc()
    logger.info(
        "job created",
        extra={
            "event": "job_created",
            "job_id": job_id,
            "job_name": job_name,
            "status": status,
        },
    )

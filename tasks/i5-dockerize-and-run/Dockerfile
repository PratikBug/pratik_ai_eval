# syntax=docker/dockerfile:1
# I5 — container image for the I4 currency convert FastAPI service
# Build context: tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api
# Example:
#   docker build -f tasks/i5-dockerize-and-run/Dockerfile \
#     -t pratik-i5-convert-api:latest \
#     tasks/i4-polyglot-service-pair-fastapi-plus-node-client/api

FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home /app app

COPY requirements-docker.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY src ./src

RUN chown -R app:app /app
USER app

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]

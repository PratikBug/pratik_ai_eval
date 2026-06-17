FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8090

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home /app app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src ./src

RUN chown -R app:app /app
USER app

EXPOSE 8090

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8090"]

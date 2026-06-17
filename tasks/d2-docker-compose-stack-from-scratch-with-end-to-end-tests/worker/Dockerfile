FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN groupadd --system app \
    && useradd --system --gid app --home /app app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src ./src

RUN chown -R app:app /app
USER app

CMD ["python", "src/worker.py"]

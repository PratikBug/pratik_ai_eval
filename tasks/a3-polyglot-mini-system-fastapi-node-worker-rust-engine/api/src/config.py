import os

WORKER_URL = os.getenv("WORKER_URL", "http://127.0.0.1:8781/internal/process")
API_PORT = int(os.getenv("API_PORT", "8780"))

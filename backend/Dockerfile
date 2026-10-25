FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /bin/uv

# Copy dependency definition files
COPY pyproject.toml uv.lock ./

# Install production dependencies without local dev packages
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source code
COPY app ./app

# Expose FastAPI port
EXPOSE 8000

# Run uvicorn on all network interfaces, respecting PORT env var if provided
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]


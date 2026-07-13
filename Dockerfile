# --- Stage 1: build the frontend (Vite/TS) ---
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# produces /frontend/dist

# --- Stage 2: Django backend, serving the built frontend via whitenoise ---
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# build-essential/libjpeg/zlib for Pillow, libpq-dev for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend code (frontend/ source excluded via .dockerignore, we only want the built dist)
COPY . .

# Bring in the built frontend at the exact path settings.py expects: BASE_DIR/frontend/dist
COPY --from=frontend-build /frontend/dist ./frontend/dist

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

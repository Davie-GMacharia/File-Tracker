#!/bin/sh
set -e

echo "Waiting for Postgres..."
python - <<'EOF'
import os
import time
import psycopg2

url = os.environ.get("DATABASE_URL", "")
if url:
    for i in range(30):
        try:
            psycopg2.connect(url)
            print("Database is ready.")
            break
        except psycopg2.OperationalError:
            print("Database not ready yet, retrying...")
            time.sleep(1)
    else:
        raise SystemExit("Database never became available.")
EOF

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting gunicorn..."
exec gunicorn filetracker.wsgi:application --bind 0.0.0.0:8000 --workers 3

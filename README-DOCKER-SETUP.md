# Dockerizing court-file-tracker

## Architecture

Your `settings.py` builds the frontend into the Django app itself:
- `TEMPLATES.DIRS` points at `frontend/dist`
- `WHITENOISE_ROOT = FRONTEND_DIR` — whitenoise serves the built SPA files directly
- `STATICFILES_DIRS` includes `frontend/dist/assets` — collectstatic pulls the built JS/CSS in

So this is a **single container** setup, not split frontend/backend containers:

- **`db`** — Postgres 16, data persisted in a named volume
- **`web`** — one image, built in two stages:
  1. Node stage builds the Vite frontend (`npm run build` → `frontend/dist`)
  2. Python stage installs Django deps, copies in the backend code, and copies the built `frontend/dist` from stage 1 into the exact path `settings.py` expects
  3. On container start: wait for DB → `migrate` → `collectstatic` → `gunicorn`

## 1. Where these files go

```
court-file-tracker/
├── Dockerfile              <- root, next to manage.py
├── entrypoint.sh           <- root
├── docker-compose.yml      <- root
├── .env.example            <- root (copy to .env, fill in real values)
├── .dockerignore           <- root
├── requirements.txt        <- already exists
├── manage.py               <- already exists
├── filetracker/            <- already exists
├── tracker/                <- already exists
└── frontend/                <- already exists (package.json, src/, etc.)
```

No new files go inside `frontend/` — it's built during the Docker image build, not run as its own container.

## 2. Set up your real .env

```bash
cp .env.example .env
```

Fill in:
- `SECRET_KEY` — generate: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- `POSTGRES_PASSWORD` — a real password
- `CLOUDINARY_API_SECRET` — your real secret
- `ALLOWED_HOSTS` — add whatever hostname/IP you'll actually access this on (e.g. the court server's LAN IP or domain)
- `CSRF_TRUSTED_ORIGINS` — must include the scheme, e.g. `https://your-domain.com` if you put this behind HTTPS later
- `SITE_URL` — used wherever your code builds absolute URLs (e.g. for QR codes going forward)

**Make sure `.env` is in `.gitignore` and never committed.**

### About `SERVER_BASE_URL` in `tracker/models.py`

Your `settings.py` already defines `SITE_URL` for exactly this purpose (absolute URL building), read from env with a sensible default. Right now `SERVER_BASE_URL` in `models.py` is a separate, hardcoded value pointing at an old local IP. Once you're Dockerized, I'd recommend replacing that hardcoded string in `models.py` with `from django.conf import settings` → `settings.SITE_URL`, so QR codes point at whatever `SITE_URL` is set to in `.env` — no more hunting down hardcoded IPs when the server address changes. Happy to make that edit for you if you paste the relevant lines from `models.py`.

## 3. Build and run

```bash
docker compose up --build
```

This will:
1. Start Postgres, wait until healthy
2. Build the image (Node build stage → Python stage)
3. Run migrations + collectstatic
4. Start gunicorn, serving both the API and the built frontend on port 80 (mapped from the container's 8000)

Visit `http://localhost` for the app, `http://localhost/admin` for Django admin.

## 4. Useful commands

```bash
# Create a superuser inside the running container
docker compose exec web python manage.py createsuperuser

# View logs
docker compose logs -f web

# Rebuild after code changes
docker compose up --build

# Stop everything (keeps DB data)
docker compose down

# Stop and wipe the database too
docker compose down -v
```

## 5. Notes

- Media (QR codes, uploaded files) goes to Cloudinary — no local media volume needed, just correct Cloudinary env vars.
- `staticfiles` uses a named volume (`static_volume`) so collectstatic output survives container restarts.
- `DEBUG=False` in `.env.example` — keep it False for anything beyond your own local testing; the court network exposing a debug Django server is a real risk.
- If you later want TLS (HTTPS) for the court server, put an nginx or Caddy container in front of `web` as a reverse proxy — that's a small addition on top of this, not a rearchitecture. Ask if/when you're ready for that.

# Game Store — Technical Assignment

A small "buy a digital game item" app: a Django REST API backed by PostgreSQL, and an
Angular + Angular Material frontend. Built for the FS SDE technical assignment.

## Stack

- **Backend:** Django 4.2 + Django REST Framework, JWT auth via `djangorestframework-simplejwt`.
  Deliberately kept to a single app (`store`) with plain function-based views instead of DRF's
  class-based generics — see `backend/README.md` for a plain-English walkthrough of the Django
  bits if you're coming from a non-Python background.
- **Database:** PostgreSQL. **Why Postgres:** the data is relational (users → orders →
  products) with exact decimal pricing and foreign-key integrity between orders and products —
  a proper RDBMS is the natural fit over SQLite (not production-friendly) or a NoSQL store (no
  real relational structure here to justify it).
- **Frontend:** Angular (standalone components) + Angular Material.

## Project Layout

```
backend/
  Dockerfile                Backend image (see "Running it" below)
  docker-entrypoint.sh       Runs on container start: migrate → import CSV → ensure a login exists → serve
  postman_collection.json   Every endpoint, ready to import into Postman (see backend/README.md)
  ...                        Django project (see backend/README.md for the API reference)
frontend/
  Dockerfile                 Multi-stage build: compiles the Angular app, serves it with nginx
  nginx.conf                 SPA fallback so client-side routes survive a page refresh
  ...                        Angular workspace
docker-compose.yml            All three services: db, backend, frontend
items.csv                     Source data imported into the Product table
```

## Running It

There are two ways to run this, depending on what you're doing:

### Option A — one-shot, everything in Docker

The fastest way to just see it working, no local Python/Node setup at all:

```bash
cp .env.example .env   # first time only
docker compose up --build
```

That single command builds and starts all three services — Postgres, the Django API, and the
Angular app (served by nginx) — and the backend's entrypoint automatically runs migrations,
imports `items.csv`, and creates a default login (`admin` / `admin12345`, overridable via
`DJANGO_SUPERUSER_USERNAME` / `_PASSWORD` / `_EMAIL` in `.env`) every time it starts, so there's
nothing else to set up.

- Frontend: `http://localhost:4200`
- API: `http://localhost:8000/api/` (reference in `backend/README.md`)

Re-running `docker compose up --build` after a code change rebuilds the affected image(s); the
Postgres data persists in a named volume across restarts (`docker compose down -v` to wipe it).

### Option B — local dev, with hot reload

Better while you're actively changing code — only Postgres runs in Docker, Django and Angular
run directly on your machine so both pick up changes instantly.

**1. Database**

```bash
docker compose up -d db
```

Starts Postgres on `localhost:5432` (credentials in `.env.example` / `.env`).

**2. Backend**

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # first time only; edit if needed
python manage.py migrate
python manage.py import_items ../items.csv
python manage.py createsuperuser   # to have a login for the frontend
python manage.py runserver
```

**3. Frontend**

```bash
cd frontend
npm install
npm start
```

App is now at `http://localhost:4200`, API at `http://localhost:8000/api/`.

**4. Tests**

```bash
cd backend
source .venv/bin/activate
pytest
```

## Design Decisions & Assumptions

- **Two ways to run it, on purpose.** The full Docker stack (Option A) is the one-command path
  for anyone just reviewing the assignment — no local toolchain needed. Local dev (Option B) is
  what you'd actually use while writing code, since editing a file in a container image means
  rebuilding it. Both read the same `docker-compose.yml` / `.env`, so there's one source of
  truth for configuration either way.
- **The backend image self-seeds on every start.** `docker-entrypoint.sh` runs `migrate`,
  `import_items`, and a superuser check every time the container starts — all three are
  idempotent (safe to repeat), so restarting never duplicates data or errors out because
  something already exists.
- **JWT — the basics, not the whole toolbox.** Login returns an access + refresh token pair
  (`djangorestframework-simplejwt` defaults: 15 min / 1 day). The frontend's HTTP interceptor
  attaches the access token to every request and, on a 401, silently calls the refresh endpoint
  once and retries — if that also fails, it logs the user out. Refresh token **rotation and
  blacklisting are intentionally left out** to keep the auth code easy to read and explain; a
  production build would add both (rotate the refresh token on every use, blacklist the old one)
  to shrink the window a stolen refresh token stays valid.
  Tokens are stored in `localStorage` on the frontend for simplicity — the more secure
  alternative (httpOnly cookies, immune to XSS-based token theft) is a reasonable follow-up
  to bring up as an improvement.
- **No stock/inventory tracking.** The CSV has no quantity field and the assignment only asks
  for "one product per request," so a purchase just creates an `Order` row — nothing decrements.
- **Order price/location are snapshotted at purchase time**, not looked up live from the
  product, so a receipt stays accurate even if a product's price changes later.
- **CSV import is idempotent.** `import_items` keys off the CSV's own `id` column and uses
  `update_or_create`, so re-running it (e.g. after editing the CSV) updates existing rows
  instead of duplicating them.
- **Repo is a monorepo** (backend/ + frontend/ folders) rather than two separate repos, purely
  to keep one clone/README pair for this exercise.

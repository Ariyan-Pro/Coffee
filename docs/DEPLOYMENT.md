# Deployment

## Prerequisites

- Docker + Docker Compose (recommended path)
- Or Python 3.12+ with PostgreSQL 15 and Redis 7 for bare-metal

## Docker Compose (recommended)

```bash
cp .env.example .env        # then edit secrets
docker compose up --build -d
```

Services started:

- `backend` - FastAPI on `:8000`; runs `alembic upgrade head` then uvicorn on boot
- `worker` - Celery worker for background jobs
- `beat` - Celery beat scheduler (daily renewals 06:00 PKT, stale-order sweep 02:00 PKT)
- `postgres` - PostgreSQL 15
- `redis` - Redis 7

Interactive API docs: `http://localhost:8000/docs`.

### Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://user:password@postgres:5432/coffee_db` (compose) |
| `JWT_SECRET` | Long random string. Never leave the default in production. |
| `REDIS_URL` / `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | `redis://redis:6379/0` (compose) |
| `PUBLIC_BASE_URL` | Public origin used to build provider redirect/return URLs |

### Payment & notification credentials

Leave empty to run with mock providers (everything works end-to-end locally):

- `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`
- `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`
- `WHATSAPP_API_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_SENDER`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM`

## Bare metal

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL to your PostgreSQL
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000   # from backend/
```

Workers:

```bash
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
celery -A app.tasks.celery_app.celery_app beat --loglevel=info
```

### Migrations

```bash
alembic revision --autogenerate -m "describe change"   # create
alembic upgrade head                                     # apply
```

`backend/app/database/migrations/env.py` reads the connection URL from the application settings - no duplicate config to maintain.

## Running tests

```bash
pip install -r requirements.txt
python -m pytest              # from the project root; uses a local SQLite test.db
```

## Production checklist

- Set a strong random `JWT_SECRET`; rotate on leak.
- Use `ENVIRONMENT=production`, `DEBUG=false`.
- Pin `ALLOWED_ORIGINS` to your frontend origin(s).
- Put PostgreSQL/Redis behind a private network (do not publish `5432`/`6379`).
- Put uvicorn behind a TLS-terminating proxy (nginx/caddy/traefik) and serve over HTTPS.
- Provider webhook return URLs must point at `PUBLIC_BASE_URL` + the webhook path.
- Monitor `POST /api/v1/health` (returns DB status) with your uptime tooling.
- Enable TLS (HSTS is on by default) - the API returns `Strict-Transport-Security`,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, a restrictive
  `Content-Security-Policy` and `Permissions-Policy` on every response
  (disable via `SECURITY_HEADERS_ENABLED=false`).
- Audit logging is on by default (`AUDIT_ENABLED=true`): every mutating request
  (register, login, order/payment/admin writes) is appended to the `audit_logs`
  table with actor, IP, user agent, request id and status.
- Observability: see `docs/OBSERVABILITY.md` for metrics, alerting rules and the
  steps to verify the background jobs (worker/beat) at runtime.
- API deprecation lifecycle: see `docs/API_VERSIONING.md` before ever shipping a
  second major version.

## Secret rotation

Rotation must not require a restart that drops traffic; it should be a
rolling-redeploy operation. Every secret is read from the environment, so
rotation is "set the new value, redeploy the service group".

| Secret | Rotation cadence | Notes |
| --- | --- | --- |
| `JWT_SECRET` | Every 90 days, or immediately on suspected leak | Old and new secrets overlap during a grace window (two days) so tokens issued before the rotation still validate; after the window only new-secret tokens are accepted |
| DB password | Every 90 days | `ALTER USER ... PASSWORD` against PostgreSQL, then rotate the secret in the orchestrator, then redeploy |
| Payment credentials | On provider policy change or suspected compromise | JazzCash/EasyPaisa sandbox first, then mirror the same values in production |
| WhatsApp / SMTP keys | Every 180 days | Same mechanism - new value in the secret store, redeploy |

Procedure for any secret:

1. Generate the new value (`openssl rand -hex 32` for symmetric secrets).
2. Store it in the secret manager / `.env` and mark the old value deprecated.
3. Redeploy the affected service; confirm health and the access logs.
4. Remove the old value only after the grace window.

Never put real credentials in the repository. The report and this repo use mock
provider values only.


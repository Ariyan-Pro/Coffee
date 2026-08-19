# Architecture

## Overview

Clean Architecture FastAPI backend for a premium coffee subscription platform operating in Pakistan. The API is the only integration point for any future frontend. Async SQLAlchemy 2.0 with PostgreSQL is the primary datastore; Redis backs rate limiting and Celery.

Layering (dependency rule: inner layers never import outer layers):

```
API routes  ->  services  ->  models / database
         \->  security    (auth dependencies)
         \->  integrations (payment / notification providers)
         \->  tasks        (Celery workers reuse services)
```

- `backend/app/api/` - HTTP layer. Route handlers are thin: validate with Pydantic schemas, enforce auth, call a service, serialize.
- `backend/app/services/` - business logic. No FastAPI imports; testable in isolation.
- `backend/app/models/` - SQLAlchemy ORM models + enums.
- `backend/app/schemas/` - Pydantic request/response models.
- `backend/app/database/` - engine/session setup and Alembic migrations.
- `backend/app/security/` - password hashing (bcrypt), JWT, rate limiting.
- `backend/app/integrations/` - provider adapters behind ABCs (payments, WhatsApp, email). Selected by `integrations/factory.py` from settings; falls back to mocks when credentials are absent.
- `backend/app/tasks/` - Celery app, beat schedule, and periodic jobs.
- `backend/app/middleware/` - request logging, metrics (Prometheus), security
  headers, audit logging, and API-versioning middleware.
- `backend/app/utils/` - exceptions and helpers.

## Middleware stack (request order)

```
RequestLogging  (assign X-Request-ID, emit JSON access log)
  -> Metrics    (counters/histograms; paths normalized for bounded cardinality)
  -> Audit      (append audit_logs row for every mutating request)
  -> Versioning (X-API-Version; Deprecation/Sunset/Link on retired routes;
                 block unknown /api/vN prefixes)
  -> Security   (HSTS, CSP, X-Frame-Options, nosniff, referrer, permissions)
  -> CORS
```

- Metrics are exposed at `GET /metrics` (Prometheus text format) - see
  `docs/OBSERVABILITY.md`.
- Audit rows are written on their own session as a fire-and-log task so a
  logging failure can never break the request. The actor is snapshotted by the
  auth dependency onto `request.state` before the request session closes.
- Deprecation policy lives in `docs/API_VERSIONING.md`.

## Key technical decisions

- **Async everywhere.** `asyncpg`-style async engine with `postgresql+psycopg` (psycopg3). The `get_db` dependency yields an `AsyncSession`; every DB call is awaited.
- **Relationships load with `lazy="selectin"`** so async handlers never trigger sync lazy-load IO (avoids `MissingGreenlet`). This is the reason for the pattern; keep it when adding models.
- **Enums stored as strings** (`native_enum=False`) for portability; JSON columns use `JSON().with_variant(JSONB(), "postgresql")` so the same models run on SQLite in tests.
- **Money** is `Numeric(10, 2)`, currency `PKR`. Delivery fee (250) and free-delivery threshold (5000) are settings.
- **Payment providers are pluggable.** `PaymentProvider` ABC: `create_checkout()`, `parse_callback()`. Implementations: JazzCash, EasyPaisa, COD, Mock. Without live credentials the factory returns the mock provider so the whole flow works locally.
- **Notifications** go through a `NotificationChannel` ABC (WhatsApp primary, Email). Sends are recorded as `Notification` rows with status; failures are captured, not raised.
- **Idempotent callbacks.** Provider callbacks are keyed by `provider_reference`; a duplicate callback returns the existing result without re-charging.

## Domain workflow

Order status machine (`order_service.ALLOWED_TRANSITIONS`):

```
PENDING -> PAID -> PROCESSING -> PACKED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
    |         |           |          |                                 |
CANCELLED/  CANCELLED/ CANCELLED  CANCELLED                        FAILED / RETURNED
FAILED     REFUNDED
```

Payment flow:

1. `POST /api/v1/orders` creates a PENDING order (prices computed server-side, stock reserved).
2. `POST /api/v1/payments/initiate` creates a payment row and returns a redirect URL (mock: local redirect; live: provider page).
3. Provider posts to `/api/v1/webhooks/{jazzcash|easypaisa|mock}`. Success marks payment COMPLETED and order PAID.
4. Delivery lifecycle via `delivery_service`; marking a delivery DELIVERED also settles COD payments.
5. `POST /api/v1/payments/{id}/verify` lets the frontend confirm status by order reference.

Subscriptions: plans -> customer subscriptions -> periodic orders. `renew_due_subscriptions` (beat schedule daily 06:00 Asia/Karachi) generates orders for due ACTIVE subscriptions and rolls `next_delivery_date` forward.

Maintenance jobs: `mark_stale_orders_failed` (daily 02:00 Asia/Karachi) fails
orders stuck in PENDING payment for >48h. COD orders are excluded - their
payment is intentionally unsettled until the parcel is delivered. Both tasks
retry on failure with exponential backoff (max 3 attempts).

## Testing strategy

- Tests run against file-backed SQLite with `NullPool` and a per-test fresh schema (`_fresh_schema` autouse fixture), so every request - test-loop or TestClient portal thread - opens its own connection.
- `app.dependency_overrides[get_db]` routes the app to the test DB.
- Unit tests target services directly; integration tests exercise the full ASGI app through `TestClient`; security tests cover JWT/auth edge cases plus randomized malformed-payload fuzzing that must never 500.
- `tests/unit/test_tasks.py` verifies the Celery beat schedule, retry policies, and both job cores end-to-end against a real session.
- pytest-asyncio runs in `auto` mode with a session-scoped loop.

## Adding a feature

1. Model + enum in `app/models/` (register in `app/models/__init__.py`).
2. Migration via `alembic revision --autogenerate`.
3. Schemas in `app/schemas/` (export in `__init__.py`).
4. Service functions in `app/services/`.
5. Thin route in `app/api/routes/`, wire the router in `app/api/routes/__init__.py` and `main.py`.
6. Tests in `tests/`; run `python -m pytest`.

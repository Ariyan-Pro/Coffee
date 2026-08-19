# Premium Coffee Subscription Backend

Production-grade backend for a premium coffee subscription platform in Pakistan. FastAPI, async SQLAlchemy 2.0, PostgreSQL, Redis, Celery. Payments via JazzCash / EasyPaisa / COD, notifications via WhatsApp / Email - with mock providers so the whole flow runs locally.

## Highlights

- Clean Architecture: thin API routes -> services -> models, provider adapters behind ABCs.
- Server-side pricing, order state machine, idempotent payment callbacks, COD settlement on delivery.
- Subscriptions with daily renewal job (Celery beat, Asia/Karachi).
- Alembic migrations, OpenAPI docs at `/docs`, 41 passing tests (unit + integration + security).

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build -d
```

- API + docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`
- Background workers and scheduler start as `worker` and `beat` services.

## Local development

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

Run tests (from project root):

```bash
python -m pytest
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - layering, decisions, workflow, testing strategy.
- [Deployment](docs/DEPLOYMENT.md) - Docker Compose, env vars, migrations, production checklist.
- [API Usage](docs/API_USAGE.md) - endpoints, request/response shapes, full happy-path walkthrough.

## Project structure

```
backend/
  app/
    api/routes/     # HTTP layer (thin handlers)
    services/       # business logic
    models/         # SQLAlchemy ORM + enums
    schemas/        # Pydantic request/response
    database/       # engine, session, Alembic migrations
    security/       # bcrypt, JWT, rate limiting
    integrations/   # payment / notification provider adapters
    tasks/          # Celery app + beat schedule
    middleware/     # request logging
    utils/          # exceptions, id generation
tests/              # unit, integration, security
```

## Environment

All configuration lives in `backend/app/config/settings.py` (pydantic-settings). See `.env.example` for every variable and its purpose. Live payment/notification providers activate automatically when their credentials are set; otherwise mock providers are used.

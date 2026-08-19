<div align="center">

# EMBER Coffee

**A production-grade coffee subscription platform built for Pakistan — roasted to order, delivered fresh, paid via JazzCash or EasyPaisa.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-3776AB.svg)](https://www.python.org/)
[![Next.js 15](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688.svg)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/tests-70%20passing-brightgreen.svg)](#testing)

[Quick Start](#quick-start) · [Architecture](#architecture) · [API Docs](#api-documentation) · [Report Bug](https://github.com/Ariyan-Pro/Coffee/issues)

</div>

---

## Why EMBER?

Most coffee subscription platforms in Pakistan are WordPress sites with WhatsApp buttons. They don't handle recurring billing, local payment gateways, or fresh-roast logistics. Building one from scratch means stitching together a payment provider, a task queue, a subscription state machine, and a frontend — which takes months.

EMBER does it in one command. The backend is a FastAPI service with async SQLAlchemy, PostgreSQL, Redis, and Celery handling background jobs. The frontend is a Next.js 15 app with a cinematic design system. Payments go through JazzCash and EasyPaisa (with mock providers for local development). Run `bash deploy.sh` and you have a working platform in 60 seconds.

---

## Features

- **One-Command Deploy** — `bash deploy.sh` spins up Postgres, Redis, backend, Celery worker+beat, and the Next.js frontend. Ctrl+C stops everything.
- **Local Payment Gateways** — JazzCash and EasyPaisa integration with provider adapters behind abstract base classes. Mock providers let the full payment flow run locally without credentials.
- **Subscription State Machine** — Weekly, biweekly, and monthly plans with automatic renewal via Celery beat (Asia/Karachi timezone). Server-side pricing, idempotent payment callbacks, COD settlement on delivery.
- **JWT Auth + RBAC** — Three roles (admin, staff, customer) with bcrypt hashing, token expiry, and route-level permission checks.
- **Security Hardening** — Rate limiting, input validation (SQLi/XSS), IDOR protection, CORS policy, HMAC-signed webhooks, security headers, and audit logging.
- **Cinematic Frontend** — 10-section homepage with scroll-linked hero, Framer Motion animations, Tailwind 4 design system (Fraunces + Inter), and full SEO (JSON-LD, sitemap, robots.txt).

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker (for Postgres + Redis)

### One-Command Deploy

```bash
git clone https://github.com/Ariyan-Pro/Coffee.git
cd Coffee
bash deploy.sh
```

This will:
1. Start Postgres 15 and Redis 7 in Docker
2. Run Alembic migrations
3. Start the FastAPI backend on `http://localhost:8000`
4. Start Celery worker + beat for background tasks
5. Start the Next.js frontend on `http://localhost:3000`

```
=============================================
  EMBER Coffee is live
=============================================
  Frontend   http://localhost:3000
  Backend    http://127.0.0.1:8000/api/v1
  Postgres   127.0.0.1:55432
  Redis      127.0.0.1:56379
=============================================
  Seeds: admin@ember.test / staff@ember.test
         alice@ember.test / bob@ember.test
         password: EmberTest123!
=============================================
```

### Local Development (without deploy.sh)

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Usage

### Browse the Store

Visit `http://localhost:3000` to see the homepage with 6 single-origin coffees from Ethiopia, Colombia, Indonesia, Kenya, Brazil, and Guatemala. Each product page shows origin details, altitude, processing method, flavor notes, and grind options.

### Subscribe to a Plan

Navigate to `/subscribe` and configure your subscription:
- Choose a coffee (Yirgacheffe, Huila, Mandheling, etc.)
- Select grind (Whole Bean, Coarse, Medium, Fine, Espresso)
- Pick frequency (Weekly 10% off, Biweekly 12% off, Monthly 15% off)
- Set quantity and delivery address

### Place an Order

The backend exposes a REST API at `/api/v1`:

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123", "full_name": "Test User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'
# Returns: {"access_token": "...", "token_type": "bearer"}

# List products
curl http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer <token>"
```

### Test a Payment Flow

```bash
# Create an order
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 1, "grind": "MEDIUM"}'

# Mock a JazzCash callback (development only)
curl -X POST http://localhost:8000/api/v1/webhooks/mock \
  -H "Content-Type: application/json" \
  -d '{"order_id": "<order_id>", "status": "SUCCESS"}'
```

---

## Configuration

All settings live in `backend/app/config/settings.py` via pydantic-settings. Copy `.env.example` to `.env` and fill in your values.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://coffee:coffee@localhost:5432/coffee_db` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis for sessions, rate limiting, Celery |
| `JWT_SECRET` | `change-me-in-production` | Secret for signing JWT tokens |
| `ENVIRONMENT` | `development` | `development`, `test`, or `production` |
| `CURRENCY` | `PKR` | Currency for pricing |
| `DEFAULT_DELIVERY_FEE` | `250` | Delivery fee in PKR |
| `FREE_DELIVERY_THRESHOLD` | `5000` | Orders above this ship free |
| `JAZZCASH_MERCHANT_ID` | *(empty)* | Set to enable live JazzCash |
| `JAZZCASH_PASSWORD` | *(empty)* | JazzCash merchant password |
| `EASYPAISA_STORE_ID` | *(empty)* | Set to enable live EasyPaisa |
| `EASYPAISA_HASH_KEY` | *(empty)* | EasyPaisa hash key |
| `WHATSAPP_API_URL` | *(empty)* | WhatsApp Business API endpoint |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Celery broker |
| `METRICS_ENABLED` | `true` | Exposes `/metrics` in Prometheus format |
| `SECURITY_HEADERS_ENABLED` | `true` | Adds security headers to responses |
| `AUDIT_ENABLED` | `true` | Writes audit logs for mutating requests |

Payment and notification providers activate automatically when their credentials are set. Without credentials, mock providers handle the full flow locally.

---

## Architecture

```mermaid
graph TB
    subgraph Frontend ["Next.js 15 Frontend"]
        UI[React UI] --> API[API Client]
    end

    subgraph Backend ["FastAPI Backend"]
        API --> Routes[API Routes]
        Routes --> Services[Services]
        Services --> Models[SQLAlchemy Models]
        Services --> Providers[Payment/Notification Adapters]
    end

    subgraph Data ["Data Layer"]
        Models --> PG[(PostgreSQL)]
        Services --> Redis[(Redis)]
    end

    subgraph Workers ["Background Jobs"]
        Redis --> Celery[Celery Worker]
        Celery --> Beat[Celery Beat]
        Beat -->|Renewal schedule| Services
    end

    subgraph External ["External Services"]
        Providers --> JazzCash[JazzCash Gateway]
        Providers --> EasyPaisa[EasyPaisa Gateway]
        Providers --> WhatsApp[WhatsApp API]
        Providers --> SMTP[Email/SMTP]
    end
```

### Key Design Decisions

- **Provider Adapters Behind ABCs** — Payment and notification providers implement abstract base classes. Swapping JazzCash for Stripe means writing one class, not touching business logic.
- **Server-Side Pricing** — Product prices and subscription discounts are computed server-side. The frontend never trusts client-submitted prices.
- **Idempotent Webhooks** — Payment callbacks are idempotent. Duplicate POST requests from gateways don't create duplicate orders.
- **Mock-First Development** — Every external service (payments, WhatsApp, email) has a mock provider. The full flow works without credentials.
- **Clean Architecture** — Thin API routes delegate to services, which orchestrate models and providers. No business logic lives in route handlers.

---

## Project Structure

```
Coffee/
├── backend/
│   └── app/
│       ├── api/routes/        # HTTP handlers (thin — delegate to services)
│       ├── services/          # Business logic layer
│       ├── models/            # SQLAlchemy ORM + enums
│       ├── schemas/           # Pydantic request/response models
│       ├── database/          # Engine, session, Alembic migrations
│       ├── security/          # JWT, bcrypt, rate limiting
│       ├── integrations/      # Payment/notification provider adapters
│       ├── tasks/             # Celery app + beat schedule
│       ├── middleware/        # Request logging, audit, metrics, security headers
│       └── config/            # Settings (pydantic-settings)
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # UI components (hero, nav, products, subscription)
│       ├── sections/          # Homepage sections (10 sections)
│       ├── data/              # Mock products, plans, content
│       ├── lib/               # API client, formatting, utilities
│       └── styles/            # Tailwind 4 design system
├── tests/
│   ├── unit/                  # Service and task tests
│   ├── integration/           # API endpoint tests
│   └── security/              # Hardening, auth, webhook verification
├── docs/                      # Architecture, deployment, API usage docs
├── deploy.sh                  # One-command local deployment
├── docker-compose.yml         # Full stack (backend + workers + DB)
├── Dockerfile                 # Backend container
└── requirements.txt           # Python dependencies
```

---

## API Documentation

Once the backend is running, interactive API docs are available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

API docs are hidden in production by default. Set `ENABLE_DOCS=true` to override.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Get JWT token |
| `GET` | `/api/v1/products` | List products |
| `GET` | `/api/v1/products/{slug}` | Product detail |
| `GET` | `/api/v1/subscriptions/plans` | List plans |
| `POST` | `/api/v1/subscriptions` | Create subscription |
| `POST` | `/api/v1/orders` | Place order |
| `POST` | `/api/v1/payments/initiate` | Start payment |
| `POST` | `/api/v1/webhooks/jazzcash` | JazzCash callback |
| `POST` | `/api/v1/webhooks/easypaisa` | EasyPaisa callback |
| `POST` | `/api/v1/webhooks/mock` | Mock payment (dev) |

---

## Testing

```bash
# Run all tests (from project root)
python -m pytest

# Run specific test suites
python -m pytest tests/unit/          # Service and task logic
python -m pytest tests/integration/   # API endpoint tests
python -m pytest tests/security/      # Auth, rate limiting, webhook verification
```

Tests use an in-memory SQLite database (via aiosqlite) so no running Postgres is needed. The test suite covers:
- Unit tests for all service layers
- Integration tests for the full API happy path
- Security tests for auth, input validation, IDOR protection, and webhook HMAC verification

---

## Contributing

Contributions are welcome. Here's how to get started:

### Development Setup

```bash
git clone https://github.com/Ariyan-Pro/Coffee.git
cd Coffee

# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

### Submitting Changes

1. Fork and create a branch: `git checkout -b feat/your-feature`
2. Make changes and add tests
3. Run the test suite: `python -m pytest`
4. Run the frontend type check: `cd frontend && npm run typecheck`
5. Open a PR — describe *what* and *why*, not just *what*

---

## Security

Please report security vulnerabilities via [GitHub Issues](https://github.com/Ariyan-Pro/Coffee/issues) or email `ariyan.nadeem.01@gmail.com`. Do not open public issues for vulnerabilities.

### Security Measures

- JWT authentication with bcrypt password hashing
- Role-based access control (admin / staff / customer)
- Rate limiting (10 requests per 300 seconds per IP)
- Input validation against SQL injection and XSS
- IDOR protection on all resource endpoints
- HMAC-SHA256 webhook signature verification
- Security headers (CSP, X-Frame-Options, etc.)
- Audit logging for all mutating requests
- API docs hidden in production by default
- Mock webhook disabled in production by default

---

## License

[MIT](LICENSE) © 2026 Ariyan Nadeem

---

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework
- [Next.js](https://nextjs.org/) — React framework for production
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/) — Python SQL toolkit
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Celery](https://docs.celeryq.dev/) — Distributed task queue

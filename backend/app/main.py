"""FastAPI application entry point.

Wires the API routers, global exception handling, CORS, security hardening,
observability and audit middleware. Database schema is managed exclusively
through Alembic migrations; the application does not create tables at startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.api.routes import (
    auth,
    customers,
    deliveries,
    health,
    orders,
    payments,
    products,
    subscriptions,
    webhooks,
)
from app.config.logging import setup_logging
from app.config.settings import settings
from app.middleware.audit import AuditLogMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.metrics import MetricsMiddleware, metrics_response
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.versioning import ApiVersioningMiddleware
from app.utils.exceptions import AppError

setup_logging()
logger = logging.getLogger("coffee_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.PROJECT_NAME)
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description=settings.PROJECT_DESCRIPTION,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
    lifespan=lifespan,
)

# Middleware order: outermost first (request flows top-to-bottom, response flows bottom-up).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if settings.SECURITY_HEADERS_ENABLED:
    app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ApiVersioningMiddleware)
app.add_middleware(AuditLogMiddleware)
if settings.METRICS_ENABLED:
    app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestLoggingMiddleware)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.code,
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
        },
    )


API_PREFIX = "/api/v1"

app.include_router(health.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(customers.router, prefix=API_PREFIX)
app.include_router(products.router, prefix=API_PREFIX)
app.include_router(subscriptions.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(payments.router, prefix=API_PREFIX)
app.include_router(deliveries.router, prefix=API_PREFIX)
app.include_router(webhooks.router, prefix=API_PREFIX)


@app.get("/", tags=["System"])
async def read_root() -> dict:
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/metrics", tags=["System"], include_in_schema=False)
async def metrics() -> Response:
    """Prometheus metrics endpoint (scraped by the monitoring stack)."""
    if not settings.METRICS_ENABLED:
        return Response(status_code=404)
    return metrics_response()

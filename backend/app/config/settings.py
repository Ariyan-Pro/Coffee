"""Application settings.

Every environment value the system needs is declared here with a safe
default where possible so the application can boot without a full .env in
development. Secrets must never be hardcoded elsewhere in the codebase.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core ---------------------------------------------------------------------
    PROJECT_NAME: str = "Coffee Subscription Backend"
    PROJECT_DESCRIPTION: str = (
        "Backend API for a premium coffee subscription platform operating "
        "in Pakistan. Manages products, plans, subscriptions, orders, "
        "payments (JazzCash/Easypaisa), deliveries and notifications."
    )
    API_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"  # development | test | production
    DEBUG: bool = False
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Database -------------------------------------------------------------------
    DATABASE_URL: str = "postgresql+psycopg://coffee:coffee@localhost:5432/coffee_db"

    # Redis -----------------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security --------------------------------------------------------------------
    JWT_SECRET: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Commerce --------------------------------------------------------------------
    CURRENCY: str = "PKR"
    DEFAULT_DELIVERY_FEE: float = 250
    FREE_DELIVERY_THRESHOLD: float = 5000

    # JazzCash --------------------------------------------------------------------
    JAZZCASH_MERCHANT_ID: str = ""
    JAZZCASH_PASSWORD: str = ""
    JAZZCASH_INTEGRATION_URL: str = (
        "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
    )
    JAZZCASH_RETURN_URL: str = "http://localhost:8000/api/v1/webhooks/jazzcash"

    # EasyPaisa -------------------------------------------------------------------
    EASYPAISA_STORE_ID: str = ""
    EASYPAISA_HASH_KEY: str = ""
    EASYPAISA_INTEGRATION_URL: str = (
        "https://sandbox.easypaisa.com.pk/easypay/Confirm.jsf"
    )
    EASYPAISA_RETURN_URL: str = "http://localhost:8000/api/v1/webhooks/easypaisa"

    # WhatsApp ---------------------------------------------------------------------
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_KEY: str = ""
    WHATSAPP_SENDER: str = ""

    # Email / SMTP -------------------------------------------------------------------
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "no-reply@coffee.local"
    EMAIL_USE_TLS: bool = True

    # Celery --------------------------------------------------------------------------
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Observability ----------------------------------------------------------------------
    LOG_FORMAT: str = "json"  # json | plain
    LOG_LEVEL: str = "INFO"
    METRICS_ENABLED: bool = True  # exposes /metrics in Prometheus text format
    TRACING_EXPORTER_ENDPOINT: str = ""  # e.g. http://jaeger:4318 (OTLP); empty = disabled

    # Security hardening ------------------------------------------------------------------
    SECURITY_HEADERS_ENABLED: bool = True
    AUDIT_ENABLED: bool = True  # writes audit_logs rows for mutating requests
    # Provider callbacks are unauthenticated by design. When WEBHOOK_HMAC_SECRET is set
    # the webhook routes require a matching HMAC-SHA256 signature over the sorted
    # form fields and reject callbacks without one. Empty = verification skipped
    # (development/mock only); production must set a secret.
    WEBHOOK_HMAC_SECRET: str = ""
    # Mock webhook (POST /api/v1/webhooks/mock) is a development aid that completes a
    # payment without a real gateway. Resolved to False in production unless explicitly
    # enabled (e.g. for a demo environment).
    MOCK_WEBHOOK_ENABLED: bool | None = None
    # API docs (/docs, /redoc, /openapi.json). Resolved to False in production unless
    # explicitly enabled (e.g. for a demo environment).
    ENABLE_DOCS: bool | None = None

    # API versioning ----------------------------------------------------------------------
    # Path prefix -> sunset date for emitting Deprecation/Sunset headers on legacy routes.
    # Example: {"/api/v0": "2027-01-01"}
    DEPRECATED_ROUTES: dict[str, str] = {}

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def payment_providers_configured(self) -> list[str]:
        """Return the names of live payment providers with credentials set."""
        providers: list[str] = []
        if self.JAZZCASH_MERCHANT_ID and self.JAZZCASH_PASSWORD:
            providers.append("JAZZCASH")
        if self.EASYPAISA_STORE_ID and self.EASYPAISA_HASH_KEY:
            providers.append("EASYPAISA")
        return providers

    @property
    def mock_webhook_enabled(self) -> bool:
        """Mock webhook is disabled by default in production."""
        return (
            self.MOCK_WEBHOOK_ENABLED
            if self.MOCK_WEBHOOK_ENABLED is not None
            else self.ENVIRONMENT != "production"
        )

    @property
    def docs_enabled(self) -> bool:
        """API docs are hidden by default in production."""
        return (
            self.ENABLE_DOCS
            if self.ENABLE_DOCS is not None
            else self.ENVIRONMENT != "production"
        )


settings = Settings()

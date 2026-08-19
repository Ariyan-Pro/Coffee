"""Audit logging middleware.

Writes one row to ``audit_logs`` for every mutating request (POST, PUT,
PATCH, DELETE) so security-relevant activity has a durable, queryable trail
separate from the business tables. Failures here are logged but never break
the request: audit is a guardrail, not a dependency.

The actor is read from ``request.state.user`` which the auth dependency
populates (via ``app.api.dependencies.attach_user``).
"""

import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config.settings import settings

logger = logging.getLogger("coffee_backend.audit")

_MUTATING = {"POST", "PUT", "PATCH", "DELETE"}
_SKIP_PREFIXES = ("/metrics", "/docs", "/redoc", "/openapi.json")


def record_audit(
    request_id: str,
    method: str,
    path: str,
    status_code: int,
    *,
    actor_id: int | None = None,
    actor_role: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    detail: dict | None = None,
) -> None:
    """Write an audit row on its own connection (blocking-safe, fire-and-log)."""
    import asyncio

    from sqlalchemy import insert

    from app.database.session import AsyncSessionLocal
    from app.models.audit import AuditLog

    async def _write() -> None:
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(
                    insert(AuditLog).values(
                        actor_id=actor_id,
                        actor_role=actor_role,
                        action=f"{method} {path}",
                        method=method,
                        path=path,
                        status_code=status_code,
                        request_id=request_id,
                        ip_address=ip_address,
                        user_agent=(user_agent or "")[:255] or None,
                        detail=detail,
                    )
                )
                await session.commit()
        except Exception:  # noqa: BLE001 - audit must never break the request
            logger.exception("audit write failed for %s %s", method, path)

    try:
        asyncio.create_task(_write())
    except RuntimeError:
        # No running loop (sync/CLI context) -> run inline.
        asyncio.run(_write())


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Record mutating requests to the audit log."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if not settings.AUDIT_ENABLED:
            return response
        if request.method not in _MUTATING:
            return response
        if request.url.path.startswith(_SKIP_PREFIXES):
            return response

        record_audit(
            request.state.request_id,
            request.method,
            request.url.path,
            response.status_code,
            actor_id=getattr(request.state, "user_id", None),
            actor_role=getattr(request.state, "user_role", None),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent", "")[:255],
            detail={"query": dict(request.query_params)} if request.query_params else None,
        )
        return response

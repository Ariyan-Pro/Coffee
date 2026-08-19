"""Request logging middleware.

Assigns a request id, propagates a caller-supplied ``X-Request-ID`` and emits
one structured log line per request (method, path, status, duration, client
IP, user agent). The request id is echoed back on the response so support
tickets can be correlated with logs.
"""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("coffee_backend.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Assigns a request id and logs method/path/status/duration."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        # Structured fields are attached as extras; the JsonFormatter renders
        # them as top-level keys for the aggregator, the plain formatter ignores them.
        logger.info(
            "%s %s -> %s",
            request.method,
            request.url.path,
            response.status_code,
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "client_ip": request.client.host if request.client else None,
                "user_agent": (request.headers.get("user-agent") or "")[:200],
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response

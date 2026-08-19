"""Prometheus metrics collection.

A lightweight middleware records request counts, error rates and latency for
every endpoint. Paths are normalized (IDs replaced by ``{id}``) so label
cardinality stays bounded. Exposed at ``/metrics`` in Prometheus text format.
"""

import re
import time

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUESTS_TOTAL = Counter(
    "http_requests_total", "HTTP requests served", ["method", "path", "status"]
)
REQUESTS_IN_PROGRESS = Histogram(
    "http_requests_in_progress", "Requests currently being processed", ["method", "path"]
)
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
)

# Normalize /api/v1/orders/42 -> /api/v1/orders/{id}
_PATH_PATTERN = re.compile(r"/\d+(\/|$)")

def _normalize_path(path: str) -> str:
    return _PATH_PATTERN.sub("/{id}\\1", path)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Record request count and duration per method/path/status."""

    async def dispatch(self, request: Request, call_next):
        path = _normalize_path(request.url.path)
        method = request.method
        REQUESTS_IN_PROGRESS.labels(method=method, path=path).observe(1)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            REQUESTS_IN_PROGRESS.labels(method=method, path=path).observe(0)
        REQUEST_DURATION.labels(method=method, path=path).observe(
            time.perf_counter() - start
        )
        REQUESTS_TOTAL.labels(method=method, path=path, status=response.status_code).inc()
        return response


def metrics_response() -> Response:
    """Render the current metric values in Prometheus text format."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

"""API versioning and deprecation headers.

Serves two concerns:
  1. Deprecation signalling: when a legacy version prefix is marked for
     retirement in ``settings.DEPRECATED_ROUTES`` (e.g. ``{"/api/v0":
     "2027-01-01"}``), every request to it gets the RFC 8594 ``Sunset``
     header, a ``Deprecation`` header and a ``Link`` to the current version.
  2. Version enforcement: rejects requests that hit an unknown future/old
     version prefix with a clear 400 instead of a 404, and documents the
     current version on every response via ``X-API-Version``.

The lifecycle policy itself lives in ``docs/API_VERSIONING.md``.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config.settings import settings

CURRENT_VERSION = "v1"
_KNOWN_VERSIONS = {"v0", "v1"}


class ApiVersioningMiddleware(BaseHTTPMiddleware):
    """Attach deprecation and version headers; block unknown version prefixes."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Only versioned /api/* paths are policed; everything else (health,
        # metrics, docs) passes through untouched. The response is returned
        # directly from middleware because exceptions raised here are outside
        # the app's exception-handler scope (which would surface as a 500).
        if path.startswith("/api/"):
            version = path.split("/")[2] if path.count("/") >= 3 else None
            if version and version not in _KNOWN_VERSIONS:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "code": "UNSUPPORTED_API_VERSION",
                        "message": (
                            "Unknown API version. Supported: v1. Retired "
                            "versions return a Sunset header so clients can "
                            "schedule migration."
                        ),
                    },
                )
            if version in _KNOWN_VERSIONS and version != CURRENT_VERSION:
                request.state.deprecated_version = version

        response = await call_next(request)

        response.headers.setdefault("X-API-Version", CURRENT_VERSION)

        version = getattr(request.state, "deprecated_version", None)
        if version:
            sunset = settings.DEPRECATED_ROUTES.get(f"/api/{version}")
            if sunset:
                response.headers["Deprecation"] = f"true"
                response.headers["Sunset"] = sunset
                response.headers["Link"] = (
                    f'<https://api.example.com/api/{CURRENT_VERSION}>; '
                    f'rel="successor-version"; title="latest"'
                )
        return response

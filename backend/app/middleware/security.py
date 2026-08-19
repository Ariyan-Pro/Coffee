"""Security hardening middleware.

Adds defense-in-depth response headers to every API response:
  - HSTS so clients only talk TLS once exposed over HTTPS
  - nosniff, frame/clickjacking and referrer controls
  - a restrictive CSP (an API serves JSON only, so no external content
    is permitted) and a locked-down Permissions-Policy
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# CSP for a pure JSON API: nothing may be loaded or framed.
CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
HSTS = "max-age=31536000; includeSubDomains"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("Strict-Transport-Security", HSTS)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
        )
        response.headers.setdefault("Content-Security-Policy", CSP)
        # Disabled explicitly: the X-XSS-Protection header is deprecated and can
        # introduce client-side bypasses; modern browsers rely on CSP instead.
        return response

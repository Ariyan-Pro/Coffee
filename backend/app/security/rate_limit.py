"""Lightweight Redis-backed rate limiting for sensitive endpoints.

If Redis is unreachable (e.g. local development without the container) the
limiter fails open with a logged warning instead of blocking requests.
"""

import logging

import redis.asyncio as redis

from app.config.settings import settings
from app.utils.exceptions import RateLimitError

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def _client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2
        )
    return _redis_client


async def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Raise RateLimitError when `key` exceeds `limit` requests per window."""
    try:
        client = _client()
        redis_key = f"ratelimit:{key}"
        count = await client.incr(redis_key)
        if count == 1:
            await client.expire(redis_key, window_seconds)
        if count > limit:
            raise RateLimitError("Too many attempts. Please wait and retry.")
    except RateLimitError:
        raise
    except Exception:  # noqa: BLE001 - fail open when Redis is unavailable
        logger.warning("Rate limiter unavailable; allowing request.", exc_info=True)

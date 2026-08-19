"""Human-friendly identifier generation for orders and transactions."""

import secrets

from app.config.constants import (
    ORDER_NUMBER_PREFIX,
    ORDER_NUMBER_RANDOM_DIGITS,
)

_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no ambiguous characters


def _random_code(length: int) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


def generate_order_number() -> str:
    """Return e.g. COF-20260816-A7K3Q9 (readable, unique enough for humans)."""
    from datetime import datetime

    stamp = datetime.utcnow().strftime("%Y%m%d")
    return f"{ORDER_NUMBER_PREFIX}-{stamp}-{_random_code(ORDER_NUMBER_RANDOM_DIGITS)}"


def generate_transaction_reference(prefix: str = "TXN") -> str:
    """Return e.g. TXN-A7K3Q9Z4 (used as provider reference where supported)."""
    return f"{prefix}-{_random_code(8)}"

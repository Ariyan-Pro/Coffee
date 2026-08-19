"""Domain exceptions.

Services raise these instead of HTTP errors so business logic stays
transport-agnostic. The API layer maps them to JSON responses via a global
exception handler in `main.py`.
"""

from typing import Any


class AppError(Exception):
    """Base application error."""

    status_code = 400
    code = "APP_ERROR"
    message = "Something went wrong."

    def __init__(self, message: str | None = None, *, details: Any = None) -> None:
        self.message = message or self.message
        self.details = details
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    message = "Resource not found."


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    message = "Resource already exists or is in a conflicting state."


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHORIZED"
    message = "Authentication required."


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    message = "You do not have permission to perform this action."


class ValidationError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"
    message = "Request data is invalid."


class BusinessRuleError(AppError):
    status_code = 422
    code = "BUSINESS_RULE_VIOLATION"
    message = "The operation violates a business rule."


class PaymentError(AppError):
    status_code = 502
    code = "PAYMENT_PROVIDER_ERROR"
    message = "The payment provider could not complete the operation."


class RateLimitError(AppError):
    status_code = 429
    code = "RATE_LIMITED"
    message = "Too many requests. Please try again later."

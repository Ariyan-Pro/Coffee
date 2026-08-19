"""Abstract contracts for external integrations.

The service layer depends only on these abstractions. Concrete providers
(JazzCash, EasyPaisa, WhatsApp, Email) are selected by the factories, so
swapping a provider never touches business logic.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal


@dataclass(frozen=True)
class PaymentInitiationResult:
    """Outcome of asking a payment provider to start a payment."""

    provider_reference: str
    redirect_url: str | None = None
    raw: dict = field(default_factory=dict)


class PaymentProvider(ABC):
    """Contract every payment gateway must implement."""

    name: str = "abstract"

    @abstractmethod
    async def initiate(
        self,
        *,
        amount: Decimal,
        currency: str,
        order_number: str,
        return_url: str,
        customer_name: str | None = None,
    ) -> PaymentInitiationResult:
        """Start a payment and return a reference + optional redirect URL."""

    @abstractmethod
    async def verify(self, provider_reference: str) -> str:
        """Query provider for the current status of a transaction.

        Returns a normalized status string: COMPLETED, PENDING, FAILED.
        """

    @abstractmethod
    async def refund(self, provider_reference: str, amount: Decimal) -> bool:
        """Issue a refund for a completed transaction."""


class NotificationChannel(ABC):
    """Contract every notification channel must implement."""

    name: str = "abstract"

    @abstractmethod
    async def send(self, *, recipient: str, subject: str | None, content: str) -> bool:
        """Deliver a message. Return True on success."""

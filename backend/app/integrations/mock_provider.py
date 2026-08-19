"""Mock payment provider for development and tests.

Never used when real provider credentials are present (see factory).
"""

from decimal import Decimal

from app.integrations.base import NotificationChannel, PaymentInitiationResult, PaymentProvider
from app.utils.id_generator import generate_transaction_reference


class MockPaymentProvider(PaymentProvider):
    """In-memory provider that always succeeds.

    The returned redirect URL points at our own mock webhook so the whole
    order lifecycle can be exercised without a sandbox account.
    """

    name = "MOCK"

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    async def initiate(
        self,
        *,
        amount: Decimal,
        currency: str,
        order_number: str,
        return_url: str,
        customer_name: str | None = None,
    ) -> PaymentInitiationResult:
        reference = generate_transaction_reference("MOCK")
        redirect_url = f"{self.base_url}/api/v1/webhooks/mock?ref={reference}"
        return PaymentInitiationResult(
            provider_reference=reference,
            redirect_url=redirect_url,
            raw={"mock": True, "order_number": order_number},
        )

    async def verify(self, provider_reference: str) -> str:
        return "COMPLETED"

    async def refund(self, provider_reference: str, amount: Decimal) -> bool:
        return True


class MockWhatsAppChannel(NotificationChannel):
    """Logs outbound messages instead of calling the WhatsApp API."""

    name = "WHATSAPP"

    async def send(self, *, recipient: str, subject: str | None, content: str) -> bool:
        print(f"[MOCK-WHATSAPP] to={recipient}: {content}")
        return True


class MockEmailChannel(NotificationChannel):
    """Logs outbound emails instead of using SMTP."""

    name = "EMAIL"

    async def send(self, *, recipient: str, subject: str | None, content: str) -> bool:
        print(f"[MOCK-EMAIL] to={recipient} subject={subject}: {content}")
        return True

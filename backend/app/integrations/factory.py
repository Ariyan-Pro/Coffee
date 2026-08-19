"""Provider/channel factory.

Selects the concrete integration to use based on configuration:

- A payment method with real credentials set -> live provider.
- COD -> a trivial cash-on-delivery provider (no gateway call).
- Anything else in development/test -> mock provider so the platform is
  fully exercisable without sandbox accounts.
"""

import logging

from app.config.settings import settings
from app.integrations.base import NotificationChannel, PaymentProvider
from app.integrations.easypaisa.provider import EasyPaisaProvider
from app.integrations.email.channel import EmailChannel
from app.integrations.jazzcash.provider import JazzCashProvider
from app.integrations.mock_provider import MockPaymentProvider
from app.integrations.whatsapp.channel import WhatsAppChannel
from app.models.enums import PaymentMethod
from app.utils.exceptions import BusinessRuleError

logger = logging.getLogger(__name__)


class CodProvider(PaymentProvider):
    """Cash-on-delivery 'provider' - payment happens after delivery."""

    name = "COD"

    async def initiate(self, **kwargs) -> None:
        return None

    async def verify(self, provider_reference: str) -> str:
        return "PENDING"

    async def refund(self, provider_reference: str, amount) -> bool:
        return True


def get_payment_provider(method: PaymentMethod) -> PaymentProvider:
    if method == PaymentMethod.COD:
        return CodProvider()

    if method == PaymentMethod.JAZZCASH:
        if settings.JAZZCASH_MERCHANT_ID and settings.JAZZCASH_PASSWORD:
            return JazzCashProvider()
        logger.info("JazzCash credentials not set; using mock provider.")
        return MockPaymentProvider(settings.PUBLIC_BASE_URL)

    if method == PaymentMethod.EASYPAISA:
        if settings.EASYPAISA_STORE_ID and settings.EASYPAISA_HASH_KEY:
            return EasyPaisaProvider()
        logger.info("EasyPaisa credentials not set; using mock provider.")
        return MockPaymentProvider(settings.PUBLIC_BASE_URL)

    raise BusinessRuleError(f"Unsupported payment method: {method}")


def get_notification_channel(name: str) -> NotificationChannel:
    """Return a channel implementation for the given channel name."""
    if name.upper() == "WHATSAPP":
        return WhatsAppChannel()
    if name.upper() == "EMAIL":
        return EmailChannel()
    raise BusinessRuleError(f"Unsupported notification channel: {name}")

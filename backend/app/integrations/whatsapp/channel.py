"""WhatsApp notification channel.

Designed around the Meta WhatsApp Cloud API (phone numbers + access token)
which is the standard path for business messaging. Config-driven so the same
channel works with any HTTP API that accepts `to` + `message`.
"""

import logging

import httpx

from app.config.settings import settings
from app.integrations.base import NotificationChannel
from app.integrations.mock_provider import MockWhatsAppChannel

logger = logging.getLogger(__name__)


class WhatsAppChannel(NotificationChannel):
    name = "WHATSAPP"

    def __init__(
        self,
        api_url: str | None = None,
        api_key: str | None = None,
        sender: str | None = None,
    ) -> None:
        self.api_url = (api_url or settings.WHATSAPP_API_URL).rstrip("/")
        self.api_key = api_key or settings.WHATSAPP_API_KEY
        self.sender = sender or settings.WHATSAPP_SENDER

    async def send(self, *, recipient: str, subject: str | None, content: str) -> bool:
        if not self.api_url or not self.api_key:
            logger.warning("WhatsApp not configured; falling back to mock.")
            return await MockWhatsAppChannel().send(
                recipient=recipient, subject=subject, content=content
            )
        payload = {
            "to": recipient,
            "message": content,
            "sender": self.sender,
            "key": self.api_key,
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    f"{self.api_url}/messages", json=payload
                )
                response.raise_for_status()
            return True
        except httpx.HTTPError as exc:
            logger.error("WhatsApp send failed to %s: %s", recipient, exc)
            return False

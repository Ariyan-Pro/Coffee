"""Email notification channel using SMTP via aiosmtplib."""

import logging

import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config.settings import settings
from app.integrations.base import NotificationChannel
from app.integrations.mock_provider import MockEmailChannel

logger = logging.getLogger(__name__)


class EmailChannel(NotificationChannel):
    name = "EMAIL"

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        username: str | None = None,
        password: str | None = None,
        from_address: str | None = None,
    ) -> None:
        self.host = host or settings.SMTP_HOST
        self.port = port or settings.SMTP_PORT
        self.username = username or settings.SMTP_USERNAME
        self.password = password or settings.SMTP_PASSWORD
        self.from_address = from_address or settings.EMAIL_FROM
        self.use_tls = settings.EMAIL_USE_TLS

    async def send(self, *, recipient: str, subject: str | None, content: str) -> bool:
        if not self.host:
            logger.warning("SMTP not configured; falling back to mock.")
            return await MockEmailChannel().send(
                recipient=recipient, subject=subject, content=content
            )

        message = MIMEMultipart()
        message["From"] = self.from_address
        message["To"] = recipient
        message["Subject"] = subject or "Coffee Subscription"
        message.attach(MIMEText(content, "plain", "utf-8"))

        try:
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.username or None,
                password=self.password or None,
                use_tls=self.use_tls,
                timeout=15,
            )
            return True
        except aiosmtplib.SMTPException as exc:
            logger.error("Email send failed to %s: %s", recipient, exc)
            return False

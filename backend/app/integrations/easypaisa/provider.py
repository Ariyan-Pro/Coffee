"""EasyPaisa payment gateway integration.

EasyPaisa (Pakistan) legacy merchant page flow:
 1. Server-side POST credentials + order details to the integration URL.
 2. The response contains a redirect form to the EasyPaisa confirmation page.
 3. EasyPaisa redirects back to our `return_url` with the transaction result.

Credentials come from settings. The exact sandbox/production endpoints and
signature algorithm differ per merchant agreement, so they are config-driven.
"""

import hashlib
import logging
import re
from decimal import Decimal

import httpx

from app.config.settings import settings
from app.integrations.base import PaymentInitiationResult, PaymentProvider
from app.utils.exceptions import PaymentError
from app.utils.id_generator import generate_transaction_reference

logger = logging.getLogger(__name__)

_REDIRECT_RE = re.compile(r'<meta\s+http-equiv="refresh"[^>]*url=([^"\']+)', re.I)


class EasyPaisaProvider(PaymentProvider):
    name = "EASYPAISA"

    def __init__(
        self,
        store_id: str | None = None,
        hash_key: str | None = None,
        integration_url: str | None = None,
        return_url: str | None = None,
    ) -> None:
        self.store_id = store_id or settings.EASYPAISA_STORE_ID
        self.hash_key = hash_key or settings.EASYPAISA_HASH_KEY
        self.integration_url = integration_url or settings.EASYPAISA_INTEGRATION_URL
        self.return_url = return_url or settings.EASYPAISA_RETURN_URL

    def _build_payload(self, order_number: str, amount: Decimal) -> dict:
        txn_ref = generate_transaction_reference("EP")
        return {
            "storeId": self.store_id,
            "amount": str(amount),
            "orderRefNum": txn_ref,
            "expiryDate": "",
            "customData": order_number,
            "returnUrl": self.return_url,
            "postBackURL": self.return_url,
        }

    async def initiate(
        self,
        *,
        amount: Decimal,
        currency: str,
        order_number: str,
        return_url: str,
        customer_name: str | None = None,
    ) -> PaymentInitiationResult:
        payload = self._build_payload(order_number, amount)
        if self.hash_key:
            payload["hash"] = self._sign(payload, self.hash_key)
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(self.integration_url, data=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("EasyPaisa initiate failed for %s: %s", order_number, exc)
            raise PaymentError("EasyPaisa gateway unavailable.") from exc

        redirect = _REDIRECT_RE.search(response.text) or re.search(
            r'href="([^"]*Confirm[^"]*)"', response.text, re.I
        )
        return PaymentInitiationResult(
            provider_reference=str(payload["orderRefNum"]),
            redirect_url=redirect.group(1) if redirect else None,
            raw={"orderRefNum": payload["orderRefNum"]},
        )

    async def verify(self, provider_reference: str) -> str:
        return "PENDING"

    async def refund(self, provider_reference: str, amount: Decimal) -> bool:
        raise PaymentError("EasyPaisa refunds require manual portal processing.")

    @staticmethod
    def _sign(payload: dict, key: str) -> str:
        material = "&".join(
            f"{k}={payload[k]}" for k in sorted(payload) if payload.get(k) not in (None, "")
        )
        return hashlib.sha256((material + key).encode("utf-8")).hexdigest()

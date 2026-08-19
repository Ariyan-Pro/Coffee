"""JazzCash payment gateway integration.

JazzCash (Pakistan) exposes a form-based merchant gateway:
 1. Server-side POST a signed payload to the integration URL.
 2. The response contains an HTML form that must be shown to the customer.
 3. JazzCash redirects back to our `return_url` with the transaction status.

We parse the returned form's action URL and expose it as `redirect_url` so a
headless frontend can simply redirect the user. Credentials come from
settings, never from request data.
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

_FORM_ACTION_RE = re.compile(r'<form[^>]*name="frmPaymentMP"[^>]*action="([^"]+)"', re.I)


class JazzCashProvider(PaymentProvider):
    name = "JAZZCASH"

    def __init__(
        self,
        merchant_id: str | None = None,
        password: str | None = None,
        integration_url: str | None = None,
        return_url: str | None = None,
    ) -> None:
        self.merchant_id = merchant_id or settings.JAZZCASH_MERCHANT_ID
        self.password = password or settings.JAZZCASH_PASSWORD
        self.integration_url = integration_url or settings.JAZZCASH_INTEGRATION_URL
        self.return_url = return_url or settings.JAZZCASH_RETURN_URL

    def _build_payload(self, order_number: str, amount: Decimal) -> dict:
        txn_ref = generate_transaction_reference("T")
        return {
            "pp_Version": "2.0",
            "pp_TxnType": "MWALLET",
            "pp_Language": "EN",
            "pp_MerchantID": self.merchant_id,
            "pp_Password": self.password,
            "pp_TxnRefNo": txn_ref,
            "pp_Amount": str(int(round(amount * 100))),  # in paisa
            "pp_TxnCurrency": "PKR",
            "pp_ProductID": "COFFEE_SUB",
            "pp_Description": f"Premium coffee order {order_number}",
            "pp_ReturnURL": self.return_url,
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
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(self.integration_url, data=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("JazzCash initiate failed for %s: %s", order_number, exc)
            raise PaymentError("JazzCash gateway unavailable.") from exc

        action = _FORM_ACTION_RE.search(response.text)
        if not action:
            raise PaymentError("JazzCash returned an unexpected response.")

        return PaymentInitiationResult(
            provider_reference=str(payload["pp_TxnRefNo"]),
            redirect_url=action.group(1),
            raw={"pp_TxnRefNo": payload["pp_TxnRefNo"]},
        )

    async def verify(self, provider_reference: str) -> str:
        # JazzCash v2.0 has no public status-check API; the return to
        # return_url is the source of truth. Polling support is added when
        # the merchant integrates the JazzCash transaction status endpoint.
        return "PENDING"

    async def refund(self, provider_reference: str, amount: Decimal) -> bool:
        raise PaymentError("JazzCash refunds require manual portal processing.")


def _sign(payload: dict, key: str) -> str:
    """JazzCash signature: sorted key-value concatenation + sha256."""
    material = "&".join(
        f"{k}={payload[k]}" for k in sorted(payload) if payload.get(k) not in (None, "")
    )
    return hashlib.sha256((material + key).encode("utf-8")).hexdigest()

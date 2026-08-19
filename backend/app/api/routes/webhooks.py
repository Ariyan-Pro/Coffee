"""Provider webhook endpoints.

These endpoints are called directly by payment providers and therefore are
unauthenticated. Integrity is protected by:

- provider_reference matching an existing payment record, and
- HMAC-SHA256 signature verification when ``WEBHOOK_HMAC_SECRET`` is
  configured (fail-closed: a callback without a valid signature is rejected).

The exact field layout of the signed payload must match the provider's
documented algorithm for production; this implementation signs the sorted
``key=value`` pairs of the received form (excluding the signature field) with
HMAC-SHA256, which is the shape used by the JazzCash/EasyPaisa families and is
a drop-in once the secret is shared.

The mock webhook is a development aid for exercising the full order lifecycle
without a sandbox account. It is disabled by default in production.
"""

import hmac
import hashlib
import logging

from fastapi import APIRouter, Request

from app.config.settings import settings
from app.models.enums import PaymentMethod
from app.schemas.common import APIResponse
from app.security.dependencies import DbDep
from app.services import payment_service
from app.utils.exceptions import BusinessRuleError, NotFoundError

logger = logging.getLogger("coffee_backend")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def _verify_webhook_signature(form: dict) -> None:
    """Fail-closed HMAC-SHA256 check over the sorted form fields.

    With ``WEBHOOK_HMAC_SECRET`` set, a missing or invalid signature field
    rejects the callback. Without a secret (development/mock), the check is
    skipped and a warning is logged.
    """
    secret = settings.WEBHOOK_HMAC_SECRET
    if not secret:
        logger.warning("WEBHOOK_HMAC_SECRET not set; provider callbacks are not signature-verified")
        return

    provided = (
        form.get("signature")
        or form.get("pp_SecureHash")
        or form.get("signature_hash")
        or form.get("ppSecureHash")
    )
    if not provided:
        raise BusinessRuleError("Missing webhook signature.")

    fields = [f"{k}={v}" for k, v in sorted(form.items()) if k not in {"signature", "pp_SecureHash", "signature_hash", "ppSecureHash"}]
    payload = "&".join(fields)
    expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, provided.lower()):
        raise BusinessRuleError("Invalid webhook signature.")


@router.post(
    "/mock",
    summary="Mock provider webhook (development)",
    description="Simulates a successful provider callback. POST with "
    "`?ref=<provider_reference>` to complete the matching payment. "
    "Disabled in production unless MOCK_WEBHOOK_ENABLED is explicitly set.",
)
async def mock_webhook(ref: str, db: DbDep):
    if not settings.mock_webhook_enabled:
        raise NotFoundError("Mock webhook is disabled in this environment.")
    payment = await payment_service.handle_provider_callback(
        db,
        provider=PaymentMethod.JAZZCASH,
        provider_reference=ref,
        success=True,
        raw={"mock": True},
    )
    return APIResponse(
        success=True,
        message="Payment completed (mock).",
        data={"payment_id": payment.id, "status": payment.status.value},
    )


@router.post(
    "/jazzcash",
    summary="JazzCash return/callback",
    description="Receives JazzCash transaction results. Expects form fields "
    "`pp_TxnRefNo` and `pp_ResponseCode` (0 = success).",
)
async def jazzcash_webhook(request: Request, db: DbDep):
    form = await request.form()
    _verify_webhook_signature(dict(form))
    txn_ref = form.get("pp_TxnRefNo")
    response_code = form.get("pp_ResponseCode")
    if not txn_ref:
        raise NotFoundError("Missing pp_TxnRefNo in JazzCash callback.")

    success = str(response_code) == "0"
    payment = await payment_service.handle_provider_callback(
        db,
        provider=PaymentMethod.JAZZCASH,
        provider_reference=str(txn_ref),
        success=success,
        raw=dict(form),
    )
    return APIResponse(
        success=True,
        data={"payment_id": payment.id, "status": payment.status.value},
    )


@router.post(
    "/easypaisa",
    summary="EasyPaisa return/callback",
    description="Receives EasyPaisa transaction results. Expects `orderRefNum` "
    "and `status` (0000 = success).",
)
async def easypaisa_webhook(request: Request, db: DbDep):
    form = await request.form()
    _verify_webhook_signature(dict(form))
    order_ref = form.get("orderRefNum") or form.get("orderReferenceNumber")
    status = form.get("status")
    if not order_ref:
        raise NotFoundError("Missing order reference in EasyPaisa callback.")

    success = str(status) in ("0000", "0", "SUCCESS")
    payment = await payment_service.handle_provider_callback(
        db,
        provider=PaymentMethod.EASYPAISA,
        provider_reference=str(order_ref),
        success=success,
        raw=dict(form),
    )
    return APIResponse(
        success=True,
        data={"payment_id": payment.id, "status": payment.status.value},
    )

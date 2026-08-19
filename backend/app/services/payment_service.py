"""Payment workflow orchestration."""

import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.base import PaymentInitiationResult
from app.integrations.factory import get_payment_provider
from app.models.enums import PaymentMethod, PaymentStatus, SubscriptionStatus
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.schemas.payment import PaymentInitiateRequest
from app.services import delivery_service, notification_service
from app.services.order_service import get_order, mark_order_paid
from app.utils.exceptions import BusinessRuleError, NotFoundError, PaymentError


async def initiate_payment(
    db: AsyncSession,
    customer_id: int,
    data: PaymentInitiateRequest,
) -> tuple[Payment, PaymentInitiationResult | None]:
    """Create a payment record and kick off the provider flow.

    Idempotent: if an active attempt (PENDING/INITIATED) already exists for the
    order and method, it is returned instead of creating a duplicate payment
    row. Callers resume that attempt (e.g. via GET /payments/{id}).
    """
    order = await get_order(db, data.order_id, customer_id=customer_id)
    if order.status.value in ("CANCELLED", "DELIVERED", "REFUNDED"):
        raise BusinessRuleError(f"Order cannot be paid in state '{order.status}'.")
    if order.payment_status == PaymentStatus.COMPLETED:
        raise BusinessRuleError("Order is already paid.")

    active = await db.scalar(
        select(Payment)
        .where(
            Payment.order_id == order.id,
            Payment.provider == data.method,
            Payment.status.in_((PaymentStatus.PENDING, PaymentStatus.INITIATED)),
        )
        .order_by(Payment.id.desc())
        .limit(1)
    )
    if active is not None:
        return active, None

    payment = Payment(
        order_id=order.id,
        customer_id=customer_id,
        provider=data.method,
        status=PaymentStatus.PENDING,
        amount=order.total_amount,
        currency=order.currency,
    )
    db.add(payment)
    await db.flush()

    # Cash on delivery: no gateway call; payment completes at delivery.
    if data.method == PaymentMethod.COD:
        await db.flush()
        return payment, None

    provider = get_payment_provider(data.method)
    result = await provider.initiate(
        amount=payment.amount,
        currency=payment.currency,
        order_number=order.order_number,
        return_url=getattr(provider, "return_url", ""),
        customer_name=order.customer.full_name if order.customer else None,
    )
    if result is None:
        raise PaymentError("Provider returned no initiation result.")

    payment.provider_reference = result.provider_reference
    payment.provider_raw = result.raw
    payment.status = PaymentStatus.INITIATED
    await db.flush()
    return payment, result


async def get_payment(
    db: AsyncSession, payment_id: int, *, customer_id: int | None = None
) -> Payment:
    payment = await db.get(Payment, payment_id)
    if payment is None:
        raise NotFoundError("Payment not found.")
    if customer_id is not None and payment.customer_id != customer_id:
        raise NotFoundError("Payment not found.")
    return payment


async def _complete_payment(db: AsyncSession, payment: Payment) -> Payment:
    """Mark a payment completed and advance the order lifecycle (idempotent)."""
    if payment.status == PaymentStatus.COMPLETED:
        return payment

    payment.status = PaymentStatus.COMPLETED
    payment.paid_at = datetime.datetime.now(datetime.timezone.utc)
    order = await get_order(db, payment.order_id)
    await mark_order_paid(db, order)

    await delivery_service.ensure_delivery(db, order)
    await notification_service.notify_payment_received(db, order)
    await db.flush()
    return payment


async def handle_provider_callback(
    db: AsyncSession,
    provider: PaymentMethod,
    provider_reference: str,
    *,
    success: bool,
    raw: dict | None = None,
) -> Payment:
    """Process a provider webhook callback.

    Webhooks can arrive more than once (retries, double delivery), so the
    completion path must be idempotent.
    """
    result = await db.execute(
        select(Payment).where(
            Payment.provider == provider,
            Payment.provider_reference == provider_reference,
        )
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise NotFoundError("No matching payment for this callback.")

    payment.provider_raw = raw or payment.provider_raw

    if success:
        await _complete_payment(db, payment)
    else:
        payment.status = PaymentStatus.FAILED
        await db.flush()
    return payment


async def verify_payment(db: AsyncSession, payment_id: int) -> Payment:
    """Verify a payment against the provider (where a status API exists)."""
    payment = await get_payment(db, payment_id)
    if payment.status in (PaymentStatus.COMPLETED, PaymentStatus.FAILED):
        return payment

    provider = get_payment_provider(payment.provider)
    status = await provider.verify(payment.provider_reference or "")
    if status == "COMPLETED":
        await _complete_payment(db, payment)
    elif status == "FAILED":
        payment.status = PaymentStatus.FAILED
        await db.flush()
    return payment

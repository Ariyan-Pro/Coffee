"""Order maintenance background jobs."""

import asyncio
import datetime
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import AsyncSessionLocal
from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.models.order import Order
from app.models.payment import Payment
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

STALE_ORDER_HOURS = 48


async def run_stale_order_sweep(
    session: AsyncSession, cutoff: datetime.datetime | None = None
) -> int:
    """Fail orders stuck in PENDING payment for over 48 hours.

    COD orders are excluded: their payment is intentionally unsettled until
    the parcel is delivered, so they must never be auto-failed for being
    "unpaid". Extracted from the Celery task so it can be exercised directly
    in the test suite. Commits its own transaction.
    """
    cutoff = cutoff or (
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=STALE_ORDER_HOURS)
    )
    cod_orders = select(Payment.order_id).where(
        Payment.provider == PaymentMethod.COD,
        Payment.status == PaymentStatus.PENDING,
    )
    result = await session.execute(
        select(Order).where(
            Order.status == OrderStatus.PENDING,
            Order.payment_status == PaymentStatus.PENDING,
            Order.created_at < cutoff,
            ~Order.id.in_(cod_orders),
        )
    )
    stale = list(result.scalars().all())
    for order in stale:
        order.status = OrderStatus.FAILED
    await session.commit()
    return len(stale)


@celery_app.task(
    name="app.tasks.orders.mark_stale_orders_failed",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_backoff_max=300,
)
def mark_stale_orders_failed() -> int:
    """Fail orders stuck in PENDING payment for over 48 hours.

    Runs daily at 02:00 PKT via the beat schedule. Returns the number of
    orders failed so the run is observable in the result backend.
    """
    async def _inner() -> int:
        async with AsyncSessionLocal() as session:
            return await run_stale_order_sweep(session)

    return asyncio.run(_inner())

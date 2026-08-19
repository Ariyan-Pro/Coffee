"""Delivery lifecycle."""

import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delivery import Delivery
from app.models.enums import DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus
from app.models.order import Order
from app.models.payment import Payment
from app.utils.exceptions import NotFoundError


async def ensure_delivery(db: AsyncSession, order: Order) -> Delivery:
    """Create a delivery for a paid order if one does not exist yet."""
    existing = await db.execute(select(Delivery).where(Delivery.order_id == order.id))
    delivery = existing.scalar_one_or_none()
    if delivery is not None:
        return delivery

    scheduled = datetime.date.today() + datetime.timedelta(days=1)
    if order.subscription is not None and order.subscription.plan is not None:
        scheduled = order.subscription.next_delivery_date

    delivery = Delivery(
        order_id=order.id,
        status=DeliveryStatus.SCHEDULED,
        scheduled_date=scheduled,
    )
    db.add(delivery)
    await db.flush()
    return delivery


async def get_delivery(
    db: AsyncSession, order_id: int, *, customer_id: int | None = None
) -> Delivery:
    result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    delivery = result.scalar_one_or_none()
    if delivery is None:
        raise NotFoundError("Delivery not found for this order.")
    if customer_id is not None:
        order = await db.get(Order, order_id)
        if order is None or order.customer_id != customer_id:
            raise NotFoundError("Delivery not found.")
    return delivery


async def list_deliveries(
    db: AsyncSession,
    *,
    status: DeliveryStatus | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Delivery], int]:
    page_size = min(page_size, 100)
    stmt = select(Delivery)
    count_stmt = select(func.count()).select_from(Delivery)
    if status is not None:
        stmt = stmt.where(Delivery.status == status)
        count_stmt = count_stmt.where(Delivery.status == status)
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        stmt.order_by(Delivery.scheduled_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return items, total


async def update_delivery_status(
    db: AsyncSession, delivery: Delivery, new_status: DeliveryStatus
) -> Delivery:
    now = datetime.datetime.now(datetime.timezone.utc)
    delivery.status = new_status
    if new_status in (DeliveryStatus.ASSIGNED, DeliveryStatus.IN_TRANSIT):
        delivery.dispatched_at = delivery.dispatched_at or now
    if new_status == DeliveryStatus.DELIVERED:
        delivery.delivered_at = now
        order = await db.get(Order, delivery.order_id)
        if order is not None and order.status != OrderStatus.DELIVERED:
            order.status = OrderStatus.DELIVERED
            order.delivered_at = now
            await _settle_cod_payment(db, order)
    await db.flush()
    return delivery


async def _settle_cod_payment(db: AsyncSession, order: Order) -> None:
    """Mark a COD payment completed once the order is delivered."""
    result = await db.execute(
        select(Payment).where(
            Payment.order_id == order.id,
            Payment.provider == PaymentMethod.COD,
        )
    )
    payment = result.scalars().first()
    if payment is None or payment.status == PaymentStatus.COMPLETED:
        return

    from app.services import notification_service  # avoid circular import

    payment.status = PaymentStatus.COMPLETED
    payment.paid_at = datetime.datetime.now(datetime.timezone.utc)
    order.payment_status = PaymentStatus.COMPLETED
    await notification_service.notify_payment_received(db, order)

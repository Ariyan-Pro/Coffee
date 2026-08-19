"""Customer notification orchestration (WhatsApp + Email)."""

import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.factory import get_notification_channel
from app.models.enums import (
    NotificationChannel,
    NotificationStatus,
    NotificationType,
)
from app.models.notification import Notification
from app.models.order import Order
from app.models.subscription import Subscription
from app.models.user import User

logger = logging.getLogger(__name__)


async def _deliver(notification: Notification) -> bool:
    """Attempt delivery via the channel factory and update the record."""
    try:
        channel = get_notification_channel(notification.channel.value)
        success = await channel.send(
            recipient=notification.recipient,
            subject=notification.subject,
            content=notification.content,
        )
    except Exception:  # noqa: BLE001 - never let notifications break the flow
        logger.exception("Notification channel failed for id=%s", notification.id)
        success = False

    notification.status = (
        NotificationStatus.SENT if success else NotificationStatus.FAILED
    )
    notification.sent_at = datetime.datetime.now(datetime.timezone.utc)
    if not success:
        notification.error_message = "Channel returned failure."
    return success


async def notify(
    db: AsyncSession,
    *,
    customer: User,
    order_id: int | None,
    channel: NotificationChannel,
    notification_type: NotificationType,
    content: str,
    subject: str | None = None,
) -> Notification:
    """Persist a notification and attempt immediate delivery."""
    recipient = (
        customer.phone
        if channel == NotificationChannel.WHATSAPP
        else customer.email
    )
    if not recipient:
        logger.info("Skipping %s notification - no recipient for user %s", channel, customer.id)
        return await _persist_unroutable(
            db, customer, order_id, channel, notification_type, content
        )

    notification = Notification(
        customer_id=customer.id,
        order_id=order_id,
        channel=channel,
        notification_type=notification_type,
        recipient=recipient,
        subject=subject,
        content=content,
        status=NotificationStatus.QUEUED,
    )
    db.add(notification)
    await db.flush()
    await _deliver(notification)
    await db.flush()
    return notification


async def _persist_unroutable(
    db: AsyncSession,
    customer: User,
    order_id: int | None,
    channel: NotificationChannel,
    notification_type: NotificationType,
    content: str,
) -> Notification:
    notification = Notification(
        customer_id=customer.id,
        order_id=order_id,
        channel=channel,
        notification_type=notification_type,
        recipient=customer.phone or customer.email or "",
        content=content,
        status=NotificationStatus.FAILED,
        error_message="No recipient configured for channel.",
    )
    db.add(notification)
    await db.flush()
    return notification


# --- Domain event helpers -----------------------------------------------------
async def notify_order_confirmed(db: AsyncSession, order: Order) -> None:
    content = (
        f"Assalam o Alaikum {order.customer.full_name}! Your coffee order "
        f"{order.order_number} ({order.total_amount} PKR) has been confirmed. "
        "We will notify you once payment is received."
    )
    await notify(
        db,
        customer=order.customer,
        order_id=order.id,
        channel=NotificationChannel.WHATSAPP,
        notification_type=NotificationType.ORDER_CONFIRMED,
        content=content,
    )


async def notify_payment_received(db: AsyncSession, order: Order) -> None:
    content = (
        f"Payment received for order {order.order_number}. "
        "Your premium coffee is being prepared for delivery."
    )
    await notify(
        db,
        customer=order.customer,
        order_id=order.id,
        channel=NotificationChannel.WHATSAPP,
        notification_type=NotificationType.PAYMENT_RECEIVED,
        content=content,
    )


async def notify_payment_failed(db: AsyncSession, order: Order) -> None:
    content = (
        f"Payment for order {order.order_number} could not be completed. "
        "Please retry via the payment link in your account."
    )
    await notify(
        db,
        customer=order.customer,
        order_id=order.id,
        channel=NotificationChannel.WHATSAPP,
        notification_type=NotificationType.PAYMENT_FAILED,
        content=content,
    )


async def notify_subscription_created(
    db: AsyncSession, subscription: Subscription
) -> None:
    content = (
        f"Your coffee subscription is active! Next delivery: "
        f"{subscription.next_delivery_date.isoformat()}. "
        "Manage it anytime from your account."
    )
    await notify(
        db,
        customer=subscription.customer,
        order_id=None,
        channel=NotificationChannel.WHATSAPP,
        notification_type=NotificationType.SUBSCRIPTION_CREATED,
        content=content,
    )


async def notify_subscription_cancelled(
    db: AsyncSession, subscription: Subscription
) -> None:
    content = "Your coffee subscription has been cancelled as requested."
    await notify(
        db,
        customer=subscription.customer,
        order_id=None,
        channel=NotificationChannel.WHATSAPP,
        notification_type=NotificationType.SUBSCRIPTION_CANCELLED,
        content=content,
    )

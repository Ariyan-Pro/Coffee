"""Subscription plans and subscription lifecycle."""

import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import PlanFrequency, PlanStatus, SubscriptionStatus
from app.models.order import Order
from app.models.product import Product
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.user import User
from app.schemas.subscription import (
    PlanCreate,
    PlanUpdate,
    SubscriptionActionRequest,
    SubscriptionCreate,
)
from app.services import order_service
from app.utils.exceptions import BusinessRuleError, ConflictError, NotFoundError


# --- Plans -------------------------------------------------------------------
async def create_plan(db: AsyncSession, data: PlanCreate) -> SubscriptionPlan:
    existing = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.slug == data.slug))
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("A plan with this slug already exists.")
    plan = SubscriptionPlan(**data.model_dump())
    db.add(plan)
    await db.flush()
    return plan


async def get_plan(db: AsyncSession, plan_id: int, *, active_only: bool = False) -> SubscriptionPlan:
    plan = await db.get(SubscriptionPlan, plan_id)
    if plan is None or (active_only and not plan.is_active):
        raise NotFoundError("Plan not found.")
    return plan


async def list_plans(
    db: AsyncSession, *, active_only: bool = False
) -> list[SubscriptionPlan]:
    stmt = select(SubscriptionPlan)
    if active_only:
        stmt = stmt.where(SubscriptionPlan.status == PlanStatus.ACTIVE)
    stmt = stmt.order_by(SubscriptionPlan.sort_order, SubscriptionPlan.created_at)
    return list((await db.execute(stmt)).scalars().all())


async def update_plan(db: AsyncSession, plan_id: int, data: PlanUpdate) -> SubscriptionPlan:
    plan = await get_plan(db, plan_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await db.flush()
    return plan


# --- Subscriptions -----------------------------------------------------------
def compute_next_delivery(
    frequency: PlanFrequency, billing_interval_days: int, from_date: datetime.date
) -> datetime.date:
    """Return the next delivery date for a subscription."""
    if frequency == PlanFrequency.MONTHLY:
        return _add_months(from_date, 1)
    if frequency == PlanFrequency.BIWEEKLY:
        return from_date + datetime.timedelta(days=14)
    return from_date + datetime.timedelta(days=billing_interval_days or 7)


def _add_months(date: datetime.date, months: int) -> datetime.date:
    month_index = date.month - 1 + months
    year = date.year + month_index // 12
    month = month_index % 12 + 1
    day = min(date.day, _days_in_month(year, month))
    return datetime.date(year, month, day)


def _days_in_month(year: int, month: int) -> int:
    if month == 12:
        return 31
    return (datetime.date(year, month + 1, 1) - datetime.date(year, month, 1)).days


async def create_subscription(
    db: AsyncSession, customer_id: int, data: SubscriptionCreate
) -> Subscription:
    plan = await get_plan(db, data.plan_id, active_only=True)
    product = await db.get(Product, data.product_id)
    if product is None or not product.is_active:
        raise NotFoundError("Product not found or not active.")
    if not product.in_stock:
        raise BusinessRuleError("Selected product is out of stock.")

    today = datetime.date.today()
    next_delivery = compute_next_delivery(
        plan.frequency, plan.billing_interval_days, today
    )

    subscription = Subscription(
        customer_id=customer_id,
        plan_id=plan.id,
        product_id=product.id,
        address_id=data.address_id,
        quantity=data.quantity,
        status=SubscriptionStatus.ACTIVE,
        auto_renew=data.auto_renew,
        next_delivery_date=next_delivery,
        current_period_start=today,
        current_period_end=next_delivery,
    )
    db.add(subscription)
    await db.flush()
    return subscription


async def get_subscription(
    db: AsyncSession, subscription_id: int, *, customer_id: int | None = None
) -> Subscription:
    subscription = await db.get(Subscription, subscription_id)
    if subscription is None:
        raise NotFoundError("Subscription not found.")
    if customer_id is not None and subscription.customer_id != customer_id:
        raise NotFoundError("Subscription not found.")
    return subscription


async def list_subscriptions(
    db: AsyncSession, customer_id: int | None = None, *, status: SubscriptionStatus | None = None
) -> list[Subscription]:
    stmt = select(Subscription)
    if customer_id is not None:
        stmt = stmt.where(Subscription.customer_id == customer_id)
    if status is not None:
        stmt = stmt.where(Subscription.status == status)
    stmt = stmt.order_by(Subscription.created_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def pause_subscription(
    db: AsyncSession, subscription_id: int, customer_id: int | None, data: SubscriptionActionRequest
) -> Subscription:
    subscription = await get_subscription(db, subscription_id, customer_id=customer_id)
    if subscription.status not in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING):
        raise BusinessRuleError("Only active subscriptions can be paused.")
    subscription.status = SubscriptionStatus.PAUSED
    subscription.paused_until = data.until
    await db.flush()
    return subscription


async def resume_subscription(
    db: AsyncSession, subscription_id: int, customer_id: int | None
) -> Subscription:
    subscription = await get_subscription(db, subscription_id, customer_id=customer_id)
    if subscription.status != SubscriptionStatus.PAUSED:
        raise BusinessRuleError("Only paused subscriptions can be resumed.")
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.paused_until = None
    subscription.next_delivery_date = compute_next_delivery(
        subscription.plan.frequency,
        subscription.plan.billing_interval_days,
        datetime.date.today(),
    )
    await db.flush()
    return subscription


async def cancel_subscription(
    db: AsyncSession,
    subscription_id: int,
    customer_id: int | None,
    reason: str | None = None,
) -> Subscription:
    subscription = await get_subscription(db, subscription_id, customer_id=customer_id)
    if subscription.status == SubscriptionStatus.CANCELLED:
        raise BusinessRuleError("Subscription is already cancelled.")
    subscription.status = SubscriptionStatus.CANCELLED
    subscription.cancellation_reason = reason
    subscription.auto_renew = False
    await db.flush()
    return subscription


async def renew_due_subscriptions(
    db: AsyncSession, as_of: datetime.date | None = None
) -> list[Order]:
    """Generate orders for every active subscription due on or before `as_of`.

    Called by the Celery scheduler. Returns the created orders so callers can
    enqueue payment and notification work.
    """
    as_of = as_of or datetime.date.today()
    result = await db.execute(
        select(Subscription).where(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.next_delivery_date <= as_of,
            Subscription.auto_renew.is_(True),
        )
    )
    due = list(result.scalars().all())

    orders: list[Order] = []
    for subscription in due:
        try:
            order = await order_service.create_order(
                db,
                customer_id=subscription.customer_id,
                items=[{"product_id": subscription.product_id, "quantity": subscription.quantity}],
                address_id=subscription.address_id,
                subscription_id=subscription.id,
                notes=f"Subscription renewal ({subscription.plan.name})",
            )
            orders.append(order)
            subscription.next_delivery_date = compute_next_delivery(
                subscription.plan.frequency,
                subscription.plan.billing_interval_days,
                subscription.next_delivery_date,
            )
            subscription.current_period_start = as_of
            subscription.current_period_end = subscription.next_delivery_date
        except BusinessRuleError:
            # e.g. out of stock - leave the subscription untouched so the
            # next run can retry, but keep the platform healthy.
            continue

    await db.flush()
    return orders

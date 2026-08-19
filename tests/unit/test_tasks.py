"""Tests for the background job layer.

Two concerns are covered:
  1. Configuration: the beat schedule and retry policies are registered and
     point at the right tasks. These are sync tests because importing the
     Celery app requires no DB or event loop.
  2. Execution: the async cores that the Celery wrappers call are exercised
     end-to-end against a real session, proving the job *logic* fires. The
     worker/beat process wiring inside Docker is verified at runtime (see
     docs/OBSERVABILITY.md -> "Verifying background jobs").
"""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select, update

from app.models.enums import (
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PlanFrequency,
    ProductStatus,
    SubscriptionStatus,
)
from app.models.order import Order
from app.models.subscription import Subscription
from app.schemas.subscription import PlanCreate, SubscriptionCreate
from app.services import order_service, product_service, subscription_service
from app.services.payment_service import initiate_payment
from app.schemas.payment import PaymentInitiateRequest
from app.tasks.celery_app import celery_app
from app.tasks.orders import run_stale_order_sweep
from app.tasks.subscriptions import run_subscription_renewals

from tests.unit.test_services import make_plan, make_product


# --- Configuration ---------------------------------------------------------------------
class TestCeleryConfiguration:
    def test_beat_schedule_registered(self):
        schedule = celery_app.conf.beat_schedule
        assert "process-subscription-renewals" in schedule
        assert (
            schedule["process-subscription-renewals"]["task"]
            == "app.tasks.subscriptions.process_subscription_renewals"
        )
        assert "mark-stale-orders-failed" in schedule
        assert (
            schedule["mark-stale-orders-failed"]["task"]
            == "app.tasks.orders.mark_stale_orders_failed"
        )
        # Daily 06:00 PKT renewal + 02:00 stale sweep.
        assert 6 in schedule["process-subscription-renewals"]["schedule"].hour
        assert 0 in schedule["process-subscription-renewals"]["schedule"].minute
        assert 2 in schedule["mark-stale-orders-failed"]["schedule"].hour

    def test_renewal_task_has_retry_policy(self):
        task = celery_app.tasks["app.tasks.subscriptions.process_subscription_renewals"]
        assert task.max_retries == 3
        assert task.retry_backoff is True
        assert task.retry_backoff_max == 300
        assert task.autoretry_for == (Exception,)

    def test_stale_order_task_has_retry_policy(self):
        task = celery_app.tasks["app.tasks.orders.mark_stale_orders_failed"]
        assert task.max_retries == 3
        assert task.retry_backoff is True
        assert task.autoretry_for == (Exception,)


# --- Job execution logic ----------------------------------------------------------------
class TestSubscriptionRenewalJob:
    async def test_renewal_job_creates_due_order(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        plan = await make_plan(db)
        sub = await subscription_service.create_subscription(
            db,
            customer_user.id,
            SubscriptionCreate(plan_id=plan.id, product_id=product.id, quantity=1),
        )
        sub.next_delivery_date = date.today()
        await db.flush()
        await db.commit()

        created = await run_subscription_renewals(db, as_of=date.today())

        assert created == 1
        result = await db.execute(
            select(Order).where(Order.customer_id == customer_user.id)
        )
        order = result.scalars().first()
        assert order is not None
        assert order.status == OrderStatus.PENDING
        # Next delivery rolled forward.
        await db.refresh(sub)
        assert sub.next_delivery_date != date.today()

    async def test_renewal_job_skips_undue_subscriptions(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        plan = await make_plan(db)
        sub = await subscription_service.create_subscription(
            db,
            customer_user.id,
            SubscriptionCreate(plan_id=plan.id, product_id=product.id, quantity=1),
        )
        sub.next_delivery_date = date.today() + timedelta(days=5)
        await db.flush()
        await db.commit()

        created = await run_subscription_renewals(db, as_of=date.today())
        assert created == 0


class TestStaleOrderSweepJob:
    async def test_sweep_fails_stale_pending_orders(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        assert order.status == OrderStatus.PENDING
        await db.commit()

        # Age the order past the 48h threshold.
        old = datetime.now(timezone.utc) - timedelta(hours=49)
        await db.execute(
            update(Order).where(Order.id == order.id).values(created_at=old)
        )
        await db.commit()

        failed = await run_stale_order_sweep(db)
        assert failed == 1
        await db.refresh(order)
        assert order.status == OrderStatus.FAILED

    async def test_sweep_leaves_recent_orders_alone(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        await db.commit()

        failed = await run_stale_order_sweep(db)
        assert failed == 0
        assert order.status == OrderStatus.PENDING

    async def test_sweep_skips_paid_orders(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        await initiate_payment(
            db,
            customer_user.id,
            PaymentInitiateRequest(order_id=order.id, method=PaymentMethod.COD),
        )
        await db.commit()
        old = datetime.now(timezone.utc) - timedelta(hours=49)
        await db.execute(
            update(Order).where(Order.id == order.id).values(created_at=old)
        )
        await db.commit()

        failed = await run_stale_order_sweep(db)
        assert failed == 0

"""Unit tests for the service layer."""

from decimal import Decimal

import pytest
from sqlalchemy import select

from app.models.address import Address
from app.models.delivery import Delivery
from app.models.enums import (
    DeliveryStatus,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    PlanFrequency,
    ProductStatus,
    SubscriptionStatus,
)
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Product
from app.models.subscription import Subscription, SubscriptionPlan
from app.schemas.payment import PaymentInitiateRequest
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.subscription import PlanCreate, SubscriptionActionRequest, SubscriptionCreate
from app.services import (
    delivery_service,
    notification_service,
    order_service,
    payment_service,
    product_service,
    subscription_service,
)
from app.utils.exceptions import BusinessRuleError, ConflictError, NotFoundError


async def make_product(db, *, price: str = "1500.00", stock: int = 10) -> Product:
    slug_price = price.replace(".", "p")
    data = ProductCreate(
        name="Ethiopia Yirgacheffe",
        slug=f"ethiopia-yirgacheffe-{slug_price}",
        sku=f"SKU-{slug_price}-{stock}",
        description="Light, floral and tea-like.",
        origin_country="Ethiopia",
        region="Yirgacheffe",
        roast_level="LIGHT",
        grind_options=["WHOLE_BEAN", "MEDIUM"],
        flavor_notes=["jasmine", "citrus", "bergamot"],
        price_per_unit=Decimal(price),
        weight_grams=250,
        stock_quantity=stock,
        status=ProductStatus.ACTIVE,
    )
    return await product_service.create_product(db, data)


async def make_plan(db) -> SubscriptionPlan:
    plan = PlanCreate(
        name="Weekly Plan",
        slug="weekly-plan",
        frequency=PlanFrequency.WEEKLY,
        billing_interval_days=7,
        discount_percent=Decimal("10.00"),
    )
    return await subscription_service.create_plan(db, plan)


# --- Product service -------------------------------------------------------------
class TestProductService:
    async def test_create_and_fetch(self, db, admin_user):
        product = await make_product(db)
        assert product.id is not None
        assert product.price_per_unit == Decimal("1500.00")
        assert "jasmine" in product.flavor_notes

    async def test_duplicate_slug_conflicts(self, db):
        await make_product(db, price="1500.00", stock=10)
        with pytest.raises(ConflictError):
            await make_product(db, price="1500.00", stock=20)

    async def test_list_filters_active_only(self, db):
        await make_product(db, price="1000.00", stock=5)
        draft = await make_product(db, price="2000.00", stock=5)
        await product_service.update_product(
            db, draft.id, ProductUpdate(**{"status": ProductStatus.DRAFT})
        )

        active, total = await product_service.list_products(db, 1, 20, active_only=True)
        assert total == 1
        assert active[0].price_per_unit == Decimal("1000.00")

    async def test_adjust_stock_rejects_negative(self, db):
        product = await make_product(db, price="1500.00", stock=2)
        with pytest.raises(BusinessRuleError):
            await product_service.adjust_stock(db, product.id, -5)

    async def test_stock_adjust(self, db):
        product = await make_product(db, price="1500.00", stock=2)
        await product_service.adjust_stock(db, product.id, 3)
        assert product.stock_quantity == 5


# --- Order service ----------------------------------------------------------------
class TestOrderService:
    async def test_create_order_prices_and_stock(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 2}],
        )
        assert order.status == OrderStatus.PENDING
        assert order.subtotal == Decimal("3000.00")
        assert order.total_amount == Decimal("3250.00")  # 3000 + 250 delivery
        assert product.stock_quantity == 8

    async def test_free_delivery_over_threshold(self, db, customer_user):
        product = await make_product(db, price="4000.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 2}],
        )
        assert order.delivery_fee == Decimal("0")
        assert order.total_amount == Decimal("8000.00")

    async def test_insufficient_stock_rejected(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=1)
        with pytest.raises(BusinessRuleError):
            await order_service.create_order(
                db,
                customer_id=customer_user.id,
                items=[{"product_id": product.id, "quantity": 5}],
            )

    async def test_cancel_restores_stock(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 3}],
        )
        await order_service.cancel_order(db, order, customer_user)
        assert order.status == OrderStatus.CANCELLED
        assert product.stock_quantity == 10

    async def test_illegal_transition_blocked(self, db, customer_user):
        product = await make_product(db)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        with pytest.raises(BusinessRuleError):
            await order_service.update_status(db, order, OrderStatus.DELIVERED)


# --- Payment service ----------------------------------------------------------------
class TestPaymentService:
    async def test_initiate_and_callback_flow(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        payment, result = await payment_service.initiate_payment(
            db,
            customer_user.id,
            PaymentInitiateRequest(
                order_id=order.id, method=PaymentMethod.JAZZCASH
            ),
        )
        assert payment.status == PaymentStatus.INITIATED
        assert result is not None
        assert result.provider_reference
        assert result.redirect_url

        completed = await payment_service.handle_provider_callback(
            db,
            provider=PaymentMethod.JAZZCASH,
            provider_reference=result.provider_reference,
            success=True,
        )
        assert completed.status == PaymentStatus.COMPLETED
        assert order.payment_status == PaymentStatus.COMPLETED
        assert order.status == OrderStatus.PAID

    async def test_callback_is_idempotent(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        payment, result = await payment_service.initiate_payment(
            db,
            customer_user.id,
            PaymentInitiateRequest(
                order_id=order.id, method=PaymentMethod.JAZZCASH
            ),
        )
        await payment_service.handle_provider_callback(
            db, PaymentMethod.JAZZCASH, result.provider_reference, success=True
        )
        again = await payment_service.handle_provider_callback(
            db, PaymentMethod.JAZZCASH, result.provider_reference, success=True
        )
        assert again.status == PaymentStatus.COMPLETED

    async def test_failed_callback_marks_payment_failed(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        payment, result = await payment_service.initiate_payment(
            db,
            customer_user.id,
            PaymentInitiateRequest(
                order_id=order.id, method=PaymentMethod.EASYPAISA
            ),
        )
        failed = await payment_service.handle_provider_callback(
            db, PaymentMethod.EASYPAISA, result.provider_reference, success=False
        )
        assert failed.status == PaymentStatus.FAILED


# --- Subscription service -------------------------------------------------------------
class TestSubscriptionService:
    async def test_create_subscription(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        plan = await make_plan(db)
        sub = await subscription_service.create_subscription(
            db,
            customer_user.id,
            SubscriptionCreate(
                plan_id=plan.id, product_id=product.id, quantity=2
            ),
        )
        assert sub.status == SubscriptionStatus.ACTIVE
        assert sub.quantity == 2
        assert sub.next_delivery_date is not None

    async def test_pause_resume_cancel(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        plan = await make_plan(db)
        sub = await subscription_service.create_subscription(
            db,
            customer_user.id,
            SubscriptionCreate(plan_id=plan.id, product_id=product.id),
        )
        await subscription_service.pause_subscription(
            db, sub.id, customer_user.id, SubscriptionActionRequest()
        )
        assert sub.status == SubscriptionStatus.PAUSED
        await subscription_service.resume_subscription(db, sub.id, customer_user.id)
        assert sub.status == SubscriptionStatus.ACTIVE
        await subscription_service.cancel_subscription(db, sub.id, customer_user.id, "Too pricey")
        assert sub.status == SubscriptionStatus.CANCELLED

    async def test_renewal_generates_order(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        plan = await make_plan(db)
        sub = await subscription_service.create_subscription(
            db,
            customer_user.id,
            SubscriptionCreate(
                plan_id=plan.id, product_id=product.id, quantity=1
            ),
        )
        sub.next_delivery_date = __import__("datetime").date.today()
        await db.flush()
        orders = await subscription_service.renew_due_subscriptions(db)
        assert len(orders) == 1
        assert orders[0].customer_id == customer_user.id
        assert sub.next_delivery_date != __import__("datetime").date.today()

    async def test_next_delivery_monthly_rollover(self):
        import datetime

        result = subscription_service.compute_next_delivery(
            PlanFrequency.MONTHLY, 30, datetime.date(2026, 1, 31)
        )
        assert result == datetime.date(2026, 2, 28)


# --- Delivery + notification ------------------------------------------------------------
class TestDeliveryAndNotifications:
    async def test_paid_order_gets_delivery(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        delivery = await delivery_service.ensure_delivery(db, order)
        assert delivery.status == DeliveryStatus.SCHEDULED

    async def test_delivery_status_update(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        delivery = await delivery_service.ensure_delivery(db, order)
        await delivery_service.update_delivery_status(db, delivery, DeliveryStatus.IN_TRANSIT)
        assert delivery.dispatched_at is not None
        await delivery_service.update_delivery_status(db, delivery, DeliveryStatus.DELIVERED)
        assert order.status == OrderStatus.DELIVERED

    async def test_cod_settles_on_delivery(self, db, customer_user):
        product = await make_product(db, price="1500.00", stock=10)
        order = await order_service.create_order(
            db,
            customer_id=customer_user.id,
            items=[{"product_id": product.id, "quantity": 1}],
        )
        payment, _ = await payment_service.initiate_payment(
            db,
            customer_user.id,
            PaymentInitiateRequest(order_id=order.id, method=PaymentMethod.COD),
        )
        delivery = await delivery_service.ensure_delivery(db, order)
        await delivery_service.update_delivery_status(db, delivery, DeliveryStatus.DELIVERED)
        assert payment.status == PaymentStatus.COMPLETED
        assert order.payment_status == PaymentStatus.COMPLETED

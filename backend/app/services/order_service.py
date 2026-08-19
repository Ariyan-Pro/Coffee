"""Order creation and lifecycle management."""

import datetime
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.models.address import Address
from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import CancelOrderRequest, OrderCreate
from app.utils.exceptions import BusinessRuleError, ForbiddenError, NotFoundError
from app.utils.id_generator import generate_order_number

# Allowed forward transitions for the order state machine.
ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.FAILED},
    OrderStatus.PAID: {OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED},
    OrderStatus.PROCESSING: {OrderStatus.PACKED, OrderStatus.CANCELLED},
    OrderStatus.PACKED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.RETURNED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: {OrderStatus.REFUNDED},
    OrderStatus.REFUNDED: set(),
    OrderStatus.FAILED: {OrderStatus.CANCELLED},
}


def _to_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


async def _snapshot_address(db: AsyncSession, address_id: int | None) -> dict | None:
    if address_id is None:
        return None
    address = await db.get(Address, address_id)
    if address is None:
        raise NotFoundError("Delivery address not found.")
    return {
        "address_id": address.id,
        "label": address.label,
        "recipient_name": address.recipient_name,
        "phone": address.phone,
        "street_address": address.street_address,
        "city": address.city,
        "province": address.province,
        "postal_code": address.postal_code,
    }


async def create_order(
    db: AsyncSession,
    *,
    customer_id: int,
    items: list[dict],
    address_id: int | None = None,
    subscription_id: int | None = None,
    notes: str | None = None,
    plan_discount_percent: Decimal | None = None,
) -> Order:
    """Create an order with server-side pricing. Client prices are ignored."""

    if not items:
        raise BusinessRuleError("An order must contain at least one item.")

    subtotal = Decimal("0")
    order_items: list[OrderItem] = []
    product_ids = [item["product_id"] for item in items]

    products = {
        p.id: p
        for p in (
            await db.execute(select(Product).where(Product.id.in_(product_ids)))
        ).scalars()
    }

    for item in items:
        product = products.get(item["product_id"])
        if product is None:
            raise NotFoundError(f"Product {item['product_id']} not found.")
        if not product.is_active:
            raise BusinessRuleError(f"Product '{product.name}' is no longer active.")
        quantity = int(item["quantity"])
        if quantity < 1:
            raise BusinessRuleError(f"Invalid quantity for '{product.name}'.")
        if product.stock_quantity < quantity:
            raise BusinessRuleError(
                f"Only {product.stock_quantity} of '{product.name}' in stock."
            )

        unit_price = _to_decimal(product.price_per_unit)
        line_total = unit_price * quantity
        subtotal += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )
        product.stock_quantity -= quantity

    discount = Decimal("0")
    if plan_discount_percent:
        discount = (subtotal * plan_discount_percent / Decimal("100")).quantize(Decimal("0.01"))

    payable = subtotal - discount
    delivery_fee = (
        Decimal("0")
        if payable >= _to_decimal(settings.FREE_DELIVERY_THRESHOLD)
        else _to_decimal(settings.DEFAULT_DELIVERY_FEE)
    )
    total = payable + delivery_fee

    order = Order(
        order_number=generate_order_number(),
        customer_id=customer_id,
        subscription_id=subscription_id,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        subtotal=subtotal,
        discount_amount=discount,
        delivery_fee=delivery_fee,
        total_amount=total,
        currency=settings.CURRENCY,
        address_snapshot=await _snapshot_address(db, address_id),
        notes=notes,
        items=order_items,
    )
    db.add(order)
    await db.flush()
    return order


async def get_order(
    db: AsyncSession, order_id: int, *, customer_id: int | None = None
) -> Order:
    order = await db.get(Order, order_id)
    if order is None:
        raise NotFoundError("Order not found.")
    if customer_id is not None and order.customer_id != customer_id:
        raise NotFoundError("Order not found.")
    return order


async def list_orders(
    db: AsyncSession,
    *,
    customer_id: int | None = None,
    status: OrderStatus | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Order], int]:
    page_size = min(page_size, 100)
    stmt = select(Order)
    count_stmt = select(func.count()).select_from(Order)
    if customer_id is not None:
        stmt = stmt.where(Order.customer_id == customer_id)
        count_stmt = count_stmt.where(Order.customer_id == customer_id)
    if status is not None:
        stmt = stmt.where(Order.status == status)
        count_stmt = count_stmt.where(Order.status == status)
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        stmt.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return items, total


async def cancel_order(
    db: AsyncSession, order: Order, actor: User, reason: str | None = None
) -> Order:
    if order.customer_id != actor.id and actor.role == UserRole.CUSTOMER:
        raise ForbiddenError("You can only cancel your own orders.")
    if order.status not in (OrderStatus.PENDING, OrderStatus.PAID):
        raise BusinessRuleError(f"Order cannot be cancelled in state '{order.status}'.")

    # Restore stock for cancelled items.
    for item in order.items:
        product = await db.get(Product, item.product_id)
        if product is not None:
            product.stock_quantity += item.quantity

    order.status = OrderStatus.CANCELLED
    if order.payment_status == PaymentStatus.COMPLETED:
        order.payment_status = PaymentStatus.REFUNDED
    order.notes = (order.notes or "") + f"\nCancelled: {reason or 'no reason given'}"
    await db.flush()
    return order


async def update_status(db: AsyncSession, order: Order, new_status: OrderStatus) -> Order:
    allowed = ALLOWED_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise BusinessRuleError(
            f"Cannot move order from '{order.status}' to '{new_status}'."
        )
    order.status = new_status
    if new_status == OrderStatus.DELIVERED:
        order.delivered_at = datetime.datetime.now(datetime.timezone.utc)
    if new_status == OrderStatus.CANCELLED:
        for item in order.items:
            product = await db.get(Product, item.product_id)
            if product is not None:
                product.stock_quantity += item.quantity
    await db.flush()
    return order


async def mark_order_paid(db: AsyncSession, order: Order) -> Order:
    """Mark an order as PAID (idempotent)."""
    if order.payment_status == PaymentStatus.COMPLETED:
        return order
    order.payment_status = PaymentStatus.COMPLETED
    order.status = OrderStatus.PAID
    order.paid_at = datetime.datetime.now(datetime.timezone.utc)
    await db.flush()
    return order

"""Order schemas."""

import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import OrderStatus, PaymentStatus


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=20)


class OrderItemOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderCreate(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    address_id: int | None = None
    payment_method: str | None = None  # JAZZCASH | EASYPAISA | COD
    subscription_id: int | None = None
    notes: str | None = Field(default=None, max_length=1000)


class OrderOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    order_number: str
    customer_id: int
    subscription_id: int | None
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: Decimal
    discount_amount: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    currency: str
    address_snapshot: dict | None
    notes: str | None
    paid_at: datetime.datetime | None
    delivered_at: datetime.datetime | None
    items: list[OrderItemOut]
    created_at: datetime.datetime


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class CancelOrderRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)

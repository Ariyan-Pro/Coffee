"""Subscription plan and subscription schemas."""

import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import (
    PlanFrequency,
    PlanStatus,
    SubscriptionStatus,
)


# --- Subscription plans -------------------------------------------------------
class PlanBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=300, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    frequency: PlanFrequency
    billing_interval_days: int = Field(gt=0, le=365)
    discount_percent: Decimal = Field(default=0, ge=0, le=100, max_digits=5, decimal_places=2)
    status: PlanStatus = PlanStatus.ACTIVE
    sort_order: int = 0


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    frequency: PlanFrequency | None = None
    billing_interval_days: int | None = Field(default=None, gt=0, le=365)
    discount_percent: Decimal | None = Field(default=None, ge=0, le=100)
    status: PlanStatus | None = None
    sort_order: int | None = None


class PlanOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    slug: str
    description: str | None
    frequency: PlanFrequency
    billing_interval_days: int
    discount_percent: Decimal
    status: PlanStatus
    sort_order: int


# --- Subscriptions ------------------------------------------------------------
class SubscriptionCreate(BaseModel):
    plan_id: int
    product_id: int
    address_id: int | None = None
    quantity: int = Field(default=1, ge=1, le=10)
    auto_renew: bool = True


class SubscriptionActionRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)
    until: datetime.date | None = None  # for pause


class SubscriptionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    customer_id: int
    plan_id: int
    product_id: int
    address_id: int | None
    quantity: int
    status: SubscriptionStatus
    next_delivery_date: datetime.date
    current_period_start: datetime.date | None
    current_period_end: datetime.date | None
    auto_renew: bool
    paused_until: datetime.date | None
    cancellation_reason: str | None

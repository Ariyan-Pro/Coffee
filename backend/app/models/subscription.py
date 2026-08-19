"""Subscription plans and customer subscriptions."""

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.models.enums import PlanFrequency, PlanStatus, SubscriptionStatus

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.product import Product
    from app.models.user import User


class SubscriptionPlan(Base, TimestampMixin):
    """A public offering a customer can subscribe to."""

    __tablename__ = "subscription_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    frequency: Mapped[PlanFrequency] = mapped_column(
        Enum(PlanFrequency, native_enum=False, length=16), nullable=False
    )
    billing_interval_days: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_percent: Mapped[float] = mapped_column(
        Numeric(5, 2), default=0, nullable=False
    )

    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus, native_enum=False, length=16),
        default=PlanStatus.ACTIVE,
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="plan", lazy="selectin"
    )

    @property
    def is_active(self) -> bool:
        return self.status == PlanStatus.ACTIVE


class Subscription(Base, TimestampMixin):
    """A customer's active (or historical) subscription."""

    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("subscription_plans.id", ondelete="RESTRICT")
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT")
    )
    address_id: Mapped[int | None] = mapped_column(
        ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True
    )

    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus, native_enum=False, length=16),
        default=SubscriptionStatus.ACTIVE,
        nullable=False,
    )

    next_delivery_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    current_period_start: Mapped[datetime.date | None] = mapped_column(
        Date, nullable=True
    )
    current_period_end: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)

    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    paused_until: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    customer: Mapped["User"] = relationship(
        back_populates="subscriptions", lazy="selectin"
    )
    plan: Mapped["SubscriptionPlan"] = relationship(
        back_populates="subscriptions", lazy="selectin"
    )
    product: Mapped["Product"] = relationship(back_populates="subscriptions", lazy="selectin")
    orders: Mapped[list["Order"]] = relationship(back_populates="subscription", lazy="selectin")

"""Delivery schemas."""

import datetime

from pydantic import BaseModel, Field

from app.models.enums import DeliveryStatus


class DeliveryCreate(BaseModel):
    order_id: int
    scheduled_date: datetime.date | None = None
    carrier: str | None = Field(default=None, max_length=100)
    tracking_number: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class DeliveryUpdate(BaseModel):
    status: DeliveryStatus | None = None
    scheduled_date: datetime.date | None = None
    carrier: str | None = None
    tracking_number: str | None = None
    notes: str | None = None


class DeliveryOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    order_id: int
    status: DeliveryStatus
    scheduled_date: datetime.date | None
    carrier: str | None
    tracking_number: str | None
    notes: str | None
    dispatched_at: datetime.datetime | None
    delivered_at: datetime.datetime | None
    created_at: datetime.datetime


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus

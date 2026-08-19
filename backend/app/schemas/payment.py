"""Payment schemas."""

import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import PaymentMethod, PaymentStatus


class PaymentInitiateRequest(BaseModel):
    order_id: int
    method: PaymentMethod = PaymentMethod.JAZZCASH


class PaymentInitiateResponse(BaseModel):
    payment_id: int
    order_id: int
    order_number: str
    amount: Decimal
    currency: str
    provider: PaymentMethod
    status: PaymentStatus
    provider_reference: str | None
    redirect_url: str | None


class PaymentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    order_id: int
    customer_id: int
    provider: PaymentMethod
    status: PaymentStatus
    amount: Decimal
    currency: str
    provider_reference: str | None
    paid_at: datetime.datetime | None
    created_at: datetime.datetime


class PaymentVerifyRequest(BaseModel):
    payment_id: int
    provider_reference: str | None = Field(default=None, max_length=255)


class WebhookSignature(BaseModel):
    """Parsed signature block used by both provider webhooks."""

    signature: str | None = None

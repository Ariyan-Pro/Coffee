"""Notification schemas."""

import datetime

from pydantic import BaseModel

from app.models.enums import NotificationChannel, NotificationStatus, NotificationType


class NotificationOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    customer_id: int | None
    order_id: int | None
    channel: NotificationChannel
    notification_type: NotificationType
    recipient: str
    subject: str | None
    content: str
    status: NotificationStatus
    sent_at: datetime.datetime | None
    created_at: datetime.datetime

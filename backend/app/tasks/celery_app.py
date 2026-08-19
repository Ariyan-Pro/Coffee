"""Celery application and beat schedule.

Background jobs are Celery-compatible tasks that run in separate worker
processes. The same service layer used by the API is reused here, keeping
business logic in one place.
"""

from celery import Celery
from celery.schedules import crontab

from app.config.settings import settings

celery_app = Celery(
    "coffee_backend",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    timezone="Asia/Karachi",
    enable_utc=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)

celery_app.conf.beat_schedule = {
    "process-subscription-renewals": {
        "task": "app.tasks.subscriptions.process_subscription_renewals",
        "schedule": crontab(hour=6, minute=0),  # daily 06:00 PKT
    },
    "mark-stale-orders-failed": {
        "task": "app.tasks.orders.mark_stale_orders_failed",
        "schedule": crontab(hour=2, minute=0),
    },
}

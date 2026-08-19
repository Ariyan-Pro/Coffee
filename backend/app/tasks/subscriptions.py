"""Subscription renewal background jobs."""

import asyncio
import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import AsyncSessionLocal
from app.services.subscription_service import renew_due_subscriptions
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


async def run_subscription_renewals(
    session: AsyncSession, as_of: datetime.date | None = None
) -> int:
    """Generate orders for all subscriptions due on ``as_of`` (default today).

    Extracted from the Celery task so it can be exercised directly in the
    test suite against a real session. Commits its own transaction.
    """
    orders = await renew_due_subscriptions(
        session, as_of=as_of or datetime.date.today()
    )
    await session.commit()
    return len(orders)


@celery_app.task(
    name="app.tasks.subscriptions.process_subscription_renewals",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def process_subscription_renewals() -> int:
    """Generate orders for all subscriptions due today.

    Runs daily at 06:00 PKT via the beat schedule. Failed runs are retried
    with exponential backoff (30s, 60s, 120s) up to 3 attempts. Returns the
    number of orders created so the run is observable in the result backend.
    """
    async def _inner() -> int:
        async with AsyncSessionLocal() as session:
            return await run_subscription_renewals(session)

    return asyncio.run(_inner())


@celery_app.task(
    name="app.tasks.subscriptions.retry_pending_renewals",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
)
def retry_pending_renewals() -> int:
    """Force a renewal run outside the normal schedule (manual / ops trigger)."""
    return process_subscription_renewals.run()

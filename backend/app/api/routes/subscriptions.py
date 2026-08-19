"""Subscription plan and customer subscription routes."""

from fastapi import APIRouter

from app.models.enums import SubscriptionStatus
from app.schemas.common import APIResponse
from app.schemas.subscription import (
    PlanCreate,
    PlanOut,
    PlanUpdate,
    SubscriptionActionRequest,
    SubscriptionCreate,
    SubscriptionOut,
)
from app.security.dependencies import AdminUser, CurrentUser, DbDep
from app.services import notification_service, subscription_service

router = APIRouter(tags=["Subscriptions"])


# --- Plans ---------------------------------------------------------------------
@router.get(
    "/plans",
    response_model=APIResponse[list[PlanOut]],
    summary="List subscription plans",
    description="Returns all publicly available subscription plans.",
)
async def list_plans(db: DbDep):
    plans = await subscription_service.list_plans(db, active_only=True)
    return APIResponse(success=True, data=[PlanOut.model_validate(p) for p in plans])


@router.post(
    "/plans",
    response_model=APIResponse[PlanOut],
    summary="Create a subscription plan (admin)",
    description="Adds a new plan (weekly / biweekly / monthly) with a discount percentage.",
    status_code=201,
)
async def create_plan(data: PlanCreate, _admin: AdminUser = None, db: DbDep = None):
    plan = await subscription_service.create_plan(db, data)
    return APIResponse(
        success=True,
        message="Plan created.",
        data=PlanOut.model_validate(plan),
    )


@router.patch(
    "/plans/{plan_id}",
    response_model=APIResponse[PlanOut],
    summary="Update a subscription plan (admin)",
    description="Partially updates plan fields such as discount, frequency or status.",
)
async def update_plan(plan_id: int, data: PlanUpdate, _admin: AdminUser = None, db: DbDep = None):
    plan = await subscription_service.update_plan(db, plan_id, data)
    return APIResponse(success=True, data=PlanOut.model_validate(plan))


# --- Subscriptions (self-service) ------------------------------------------------
@router.get(
    "/subscriptions",
    response_model=APIResponse[list[SubscriptionOut]],
    summary="List own subscriptions",
    description="Returns all subscriptions belonging to the authenticated customer.",
)
async def list_my_subscriptions(status: SubscriptionStatus | None = None, user: CurrentUser = None, db: DbDep = None):
    subs = await subscription_service.list_subscriptions(db, user.id, status=status)
    return APIResponse(success=True, data=[SubscriptionOut.model_validate(s) for s in subs])


@router.post(
    "/subscriptions",
    response_model=APIResponse[SubscriptionOut],
    summary="Create a subscription",
    description="Subscribes the customer to a plan + product. The first renewal order is "
    "generated on `next_delivery_date` by the scheduler.",
    status_code=201,
)
async def create_subscription(data: SubscriptionCreate, user: CurrentUser, db: DbDep):
    subscription = await subscription_service.create_subscription(db, user.id, data)
    await notification_service.notify_subscription_created(db, subscription)
    return APIResponse(
        success=True,
        message="Subscription created.",
        data=SubscriptionOut.model_validate(subscription),
    )


@router.get(
    "/subscriptions/{subscription_id}",
    response_model=APIResponse[SubscriptionOut],
    summary="Get a subscription",
    description="Returns one of the customer's subscriptions.",
)
async def get_subscription(subscription_id: int, user: CurrentUser, db: DbDep):
    subscription = await subscription_service.get_subscription(
        db, subscription_id, customer_id=user.id
    )
    return APIResponse(success=True, data=SubscriptionOut.model_validate(subscription))


@router.post(
    "/subscriptions/{subscription_id}/pause",
    response_model=APIResponse[SubscriptionOut],
    summary="Pause a subscription",
    description="Pauses the subscription. Optionally provide `until` for an auto-resume date.",
)
async def pause_subscription(
    subscription_id: int, data: SubscriptionActionRequest, user: CurrentUser, db: DbDep
):
    subscription = await subscription_service.pause_subscription(
        db, subscription_id, user.id, data
    )
    return APIResponse(success=True, data=SubscriptionOut.model_validate(subscription))


@router.post(
    "/subscriptions/{subscription_id}/resume",
    response_model=APIResponse[SubscriptionOut],
    summary="Resume a subscription",
    description="Reactivates a paused subscription and recomputes the next delivery date.",
)
async def resume_subscription(subscription_id: int, user: CurrentUser, db: DbDep):
    subscription = await subscription_service.resume_subscription(db, subscription_id, user.id)
    return APIResponse(success=True, data=SubscriptionOut.model_validate(subscription))


@router.post(
    "/subscriptions/{subscription_id}/cancel",
    response_model=APIResponse[SubscriptionOut],
    summary="Cancel a subscription",
    description="Cancels the subscription and disables auto-renewal.",
)
async def cancel_subscription(
    subscription_id: int, data: SubscriptionActionRequest, user: CurrentUser, db: DbDep
):
    subscription = await subscription_service.cancel_subscription(
        db, subscription_id, user.id, data.reason
    )
    await notification_service.notify_subscription_cancelled(db, subscription)
    return APIResponse(success=True, data=SubscriptionOut.model_validate(subscription))

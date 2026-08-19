"""Order routes (customer self-service + admin operations)."""

from decimal import Decimal

from fastapi import APIRouter

from app.models.enums import OrderStatus, UserRole
from app.schemas.common import APIResponse, Page, paginate
from app.schemas.order import (
    CancelOrderRequest,
    OrderCreate,
    OrderOut,
    OrderStatusUpdate,
)
from app.security.dependencies import CurrentUser, DbDep
from app.services import notification_service, order_service
from app.services.subscription_service import get_subscription
from app.utils.exceptions import ForbiddenError, NotFoundError

router = APIRouter(tags=["Orders"])


@router.post(
    "/orders",
    response_model=APIResponse[OrderOut],
    summary="Create an order",
    description="Creates an order from product ids + quantities. Prices, stock and delivery "
    "fees are computed server-side; client prices are ignored.",
    status_code=201,
)
async def create_order(data: OrderCreate, user: CurrentUser, db: DbDep):
    discount: Decimal | None = None
    if data.subscription_id:
        subscription = await get_subscription(db, data.subscription_id, customer_id=user.id)
        if subscription.plan is not None:
            discount = Decimal(str(subscription.plan.discount_percent))

    order = await order_service.create_order(
        db,
        customer_id=user.id,
        items=[item.model_dump() for item in data.items],
        address_id=data.address_id,
        subscription_id=data.subscription_id,
        notes=data.notes,
        plan_discount_percent=discount,
    )
    await notification_service.notify_order_confirmed(db, order)
    return APIResponse(
        success=True,
        message="Order created.",
        data=OrderOut.model_validate(order),
    )


@router.get(
    "/orders",
    response_model=APIResponse[Page[OrderOut]],
    summary="List own orders",
    description="Paginated order history for the authenticated customer.",
)
async def list_orders(
    page: int = 1,
    page_size: int = 20,
    status: OrderStatus | None = None,
    user: CurrentUser = None,
    db: DbDep = None,
):
    items, total = await order_service.list_orders(
        db, customer_id=user.id, status=status, page=page, page_size=page_size
    )
    pages = max(1, -(-total // page_size))
    return APIResponse(
        success=True,
        data=paginate([OrderOut.model_validate(o) for o in items], total, page, page_size, pages),
    )


@router.get(
    "/orders/{order_id}",
    response_model=APIResponse[OrderOut],
    summary="Get an order",
    description="Returns a single order with its line items. Customers can only access their own.",
)
async def get_order(order_id: int, user: CurrentUser, db: DbDep):
    order = await order_service.get_order(db, order_id, customer_id=user.id)
    return APIResponse(success=True, data=OrderOut.model_validate(order))


@router.post(
    "/orders/{order_id}/cancel",
    response_model=APIResponse[OrderOut],
    summary="Cancel an order",
    description="Cancels a PENDING or PAID order and restores stock. Completed payments are marked refunded.",
)
async def cancel_order(order_id: int, data: CancelOrderRequest, user: CurrentUser, db: DbDep):
    order = await order_service.get_order(db, order_id, customer_id=user.id)
    order = await order_service.cancel_order(db, order, user, data.reason)
    return APIResponse(success=True, message="Order cancelled.", data=OrderOut.model_validate(order))


# --- Admin order operations ------------------------------------------------------
@router.get(
    "/admin/orders",
    response_model=APIResponse[Page[OrderOut]],
    summary="List all orders (staff)",
    description="Staff/Admin view of every order with optional status filter.",
)
async def list_all_orders(
    page: int = 1,
    page_size: int = 20,
    status: OrderStatus | None = None,
    user: CurrentUser = None,
    db: DbDep = None,
):
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise ForbiddenError("Staff role required.")
    items, total = await order_service.list_orders(
        db, status=status, page=page, page_size=page_size
    )
    pages = max(1, -(-total // page_size))
    return APIResponse(
        success=True,
        data=paginate([OrderOut.model_validate(o) for o in items], total, page, page_size, pages),
    )


@router.patch(
    "/admin/orders/{order_id}/status",
    response_model=APIResponse[OrderOut],
    summary="Update order status (staff)",
    description="Advances an order along its state machine (e.g. PENDING -> PROCESSING -> SHIPPED -> DELIVERED).",
)
async def update_order_status(
    order_id: int, data: OrderStatusUpdate, user: CurrentUser, db: DbDep
):
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise ForbiddenError("Staff role required.")
    order = await order_service.get_order(db, order_id)
    order = await order_service.update_status(db, order, data.status)
    return APIResponse(success=True, data=OrderOut.model_validate(order))


@router.get(
    "/admin/orders/{order_id}",
    response_model=APIResponse[OrderOut],
    summary="Get any order (staff)",
    description="Staff/Admin view of a single order regardless of owner.",
)
async def get_any_order(order_id: int, user: CurrentUser, db: DbDep):
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise ForbiddenError("Staff role required.")
    order = await order_service.get_order(db, order_id)
    return APIResponse(success=True, data=OrderOut.model_validate(order))

"""Delivery routes (customer tracking + staff management)."""

from fastapi import APIRouter

from app.models.delivery import Delivery
from app.models.enums import DeliveryStatus, UserRole
from app.schemas.common import APIResponse, Page, paginate
from app.schemas.delivery import DeliveryOut, DeliveryStatusUpdate
from app.security.dependencies import CurrentUser, DbDep
from app.services import delivery_service
from app.utils.exceptions import ForbiddenError, NotFoundError

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.get(
    "/order/{order_id}",
    response_model=APIResponse[DeliveryOut],
    summary="Track a delivery for an order",
    description="Returns the delivery record (status, dates, tracking) for one of the customer's orders.",
)
async def track_delivery(order_id: int, user: CurrentUser, db: DbDep):
    delivery = await delivery_service.get_delivery(db, order_id, customer_id=user.id)
    return APIResponse(success=True, data=DeliveryOut.model_validate(delivery))


@router.get(
    "",
    response_model=APIResponse[Page[DeliveryOut]],
    summary="List all deliveries (staff)",
    description="Staff/Admin view of every delivery, optionally filtered by status.",
)
async def list_deliveries(
    page: int = 1,
    page_size: int = 20,
    status: DeliveryStatus | None = None,
    user: CurrentUser = None,
    db: DbDep = None,
):
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise ForbiddenError("Staff role required.")
    items, total = await delivery_service.list_deliveries(
        db, status=status, page=page, page_size=page_size
    )
    pages = max(1, -(-total // page_size))
    return APIResponse(
        success=True,
        data=paginate([DeliveryOut.model_validate(d) for d in items], total, page, page_size, pages),
    )


@router.patch(
    "/{delivery_id}/status",
    response_model=APIResponse[DeliveryOut],
    summary="Update delivery status (staff)",
    description="Advances delivery status (e.g. SCHEDULED -> IN_TRANSIT -> DELIVERED). "
    "Marking DELIVERED also completes any COD payment.",
)
async def update_delivery_status(
    delivery_id: int, data: DeliveryStatusUpdate, user: CurrentUser, db: DbDep
):
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise ForbiddenError("Staff role required.")
    delivery = await db.get(Delivery, delivery_id)
    if delivery is None:
        raise NotFoundError("Delivery not found.")
    delivery = await delivery_service.update_delivery_status(db, delivery, data.status)
    return APIResponse(success=True, data=DeliveryOut.model_validate(delivery))

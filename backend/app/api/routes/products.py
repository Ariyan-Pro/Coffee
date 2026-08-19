"""Product catalogue routes."""

from fastapi import APIRouter

from app.models.enums import ProductStatus, RoastLevel
from app.schemas.common import APIResponse, Page, paginate
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, StockAdjustRequest
from app.security.dependencies import AdminUser, CurrentUser, DbDep
from app.services import product_service
from app.utils.exceptions import ForbiddenError

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=APIResponse[Page[ProductOut]],
    summary="List products",
    description="Paginated product catalogue. Public customers only see ACTIVE products; "
    "staff/admins see all statuses and can filter.",
)
async def list_products(
    page: int = 1,
    page_size: int = 20,
    status: ProductStatus | None = None,
    roast_level: RoastLevel | None = None,
    origin: str | None = None,
    search: str | None = None,
    user: CurrentUser = None,
    db: DbDep = None,
):
    staff = user.is_staff if user else False
    if not staff and (status is not None or roast_level is not None or origin is not None or search):
        raise ForbiddenError("Only staff can apply catalogue filters.")
    items, total = await product_service.list_products(
        db,
        page,
        page_size,
        status=status,
        roast_level=roast_level,
        origin=origin,
        search=search,
        active_only=not staff,
    )
    pages = max(1, -(-total // page_size))
    return APIResponse(
        success=True,
        data=paginate([ProductOut.model_validate(p) for p in items], total, page, page_size, pages),
    )


@router.get(
    "/{product_id}",
    response_model=APIResponse[ProductOut],
    summary="Get a single product",
    description="Returns a product by id. Inactive/draft products require staff access.",
)
async def get_product(product_id: int, user: CurrentUser = None, db: DbDep = None):
    product = await product_service.get_product(
        db, product_id, active_only=not (user.is_staff if user else False)
    )
    return APIResponse(success=True, data=ProductOut.model_validate(product))


@router.post(
    "",
    response_model=APIResponse[ProductOut],
    summary="Create a product (admin)",
    description="Adds a new product to the catalogue. Slug and SKU must be unique.",
    status_code=201,
)
async def create_product(data: ProductCreate, _admin: AdminUser = None, db: DbDep = None):
    product = await product_service.create_product(db, data)
    return APIResponse(
        success=True,
        message="Product created.",
        data=ProductOut.model_validate(product),
    )


@router.patch(
    "/{product_id}",
    response_model=APIResponse[ProductOut],
    summary="Update a product (admin)",
    description="Partially updates product fields including price, stock and status.",
)
async def update_product(product_id: int, data: ProductUpdate, _admin: AdminUser = None, db: DbDep = None):
    product = await product_service.update_product(db, product_id, data)
    return APIResponse(success=True, data=ProductOut.model_validate(product))


@router.post(
    "/{product_id}/stock",
    response_model=APIResponse[ProductOut],
    summary="Adjust stock (admin)",
    description="Applies a signed stock delta (e.g. -5 for a sale, +20 for a restock). "
    "Negative deltas below zero are rejected.",
)
async def adjust_stock(product_id: int, data: StockAdjustRequest, _admin: AdminUser = None, db: DbDep = None):
    product = await product_service.adjust_stock(db, product_id, data.quantity)
    return APIResponse(success=True, data=ProductOut.model_validate(product))


@router.delete(
    "/{product_id}",
    response_model=APIResponse[None],
    summary="Deactivate a product (admin)",
    description="Soft-deactivates a product. It disappears from public listings.",
)
async def deactivate_product(product_id: int, _admin: AdminUser = None, db: DbDep = None):
    await product_service.deactivate_product(db, product_id)
    return APIResponse(success=True, message="Product deactivated.")

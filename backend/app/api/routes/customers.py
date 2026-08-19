"""Customer management routes (self-service + admin)."""

from fastapi import APIRouter

from app.schemas.common import APIResponse, Page, paginate
from app.schemas.customer import (
    AddressCreate,
    AddressOut,
    AddressUpdate,
    CustomerCreate,
    CustomerOut,
    CustomerUpdate,
)
from app.security.dependencies import AdminUser, CurrentUser, DbDep
from app.services import customer_service

router = APIRouter(tags=["Customers"])


# --- Customer (self) -----------------------------------------------------------
@router.get(
    "/customers/me",
    response_model=APIResponse[CustomerOut],
    summary="Get own customer profile",
    description="Returns the authenticated customer's profile.",
)
async def get_me(user: CurrentUser):
    return APIResponse(success=True, data=CustomerOut.model_validate(user))


@router.patch(
    "/customers/me",
    response_model=APIResponse[CustomerOut],
    summary="Update own profile",
    description="Partially updates the authenticated customer's profile fields.",
)
async def update_me(data: CustomerUpdate, user: CurrentUser, db: DbDep):
    customer = await customer_service.update_customer(db, user.id, data)
    return APIResponse(success=True, data=CustomerOut.model_validate(customer))


# --- Customer management (admin) --------------------------------------------------
@router.get(
    "/customers",
    response_model=APIResponse[Page[CustomerOut]],
    summary="List customers (admin)",
    description="Paginated list of all customers with optional free-text search.",
)
async def list_customers(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    _admin: AdminUser = None,
    db: DbDep = None,
):
    items, total = await customer_service.list_customers(db, page, page_size, search)
    pages = max(1, -(-total // page_size))
    return APIResponse(
        success=True,
        data=paginate(
            [CustomerOut.model_validate(c) for c in items], total, page, page_size, pages
        ),
    )


@router.post(
    "/customers",
    response_model=APIResponse[CustomerOut],
    summary="Create a customer (admin)",
    description="Admin endpoint to create a customer account directly.",
    status_code=201,
)
async def create_customer(data: CustomerCreate, _admin: AdminUser = None, db: DbDep = None):
    customer = await customer_service.create_customer(db, data)
    return APIResponse(
        success=True,
        message="Customer created.",
        data=CustomerOut.model_validate(customer),
    )


@router.get(
    "/customers/{customer_id}",
    response_model=APIResponse[CustomerOut],
    summary="Get a customer (admin or self)",
    description="Returns a single customer. Customers may only fetch their own profile.",
)
async def get_customer(customer_id: int, user: CurrentUser, db: DbDep):
    if user.id != customer_id and user.role.value != "ADMIN":
        from app.utils.exceptions import ForbiddenError

        raise ForbiddenError("You can only access your own profile.")
    customer = await customer_service.get_customer(db, customer_id)
    return APIResponse(success=True, data=CustomerOut.model_validate(customer))


@router.patch(
    "/customers/{customer_id}",
    response_model=APIResponse[CustomerOut],
    summary="Update a customer (admin)",
    description="Admin endpoint to update any customer, including status and role.",
)
async def update_customer(customer_id: int, data: CustomerUpdate, _admin: AdminUser = None, db: DbDep = None):
    customer = await customer_service.update_customer(db, customer_id, data)
    return APIResponse(success=True, data=CustomerOut.model_validate(customer))


# --- Addresses (self) ----------------------------------------------------------------
@router.get(
    "/customers/me/addresses",
    response_model=APIResponse[list[AddressOut]],
    summary="List own delivery addresses",
    description="Returns all saved addresses of the authenticated customer.",
)
async def list_my_addresses(user: CurrentUser, db: DbDep):
    addresses = await customer_service.list_addresses(db, user.id)
    return APIResponse(
        success=True,
        data=[AddressOut.model_validate(a) for a in addresses],
    )


@router.post(
    "/customers/me/addresses",
    response_model=APIResponse[AddressOut],
    summary="Create a delivery address",
    description="Adds a new address. Setting is_default clears other defaults.",
    status_code=201,
)
async def create_address(data: AddressCreate, user: CurrentUser, db: DbDep):
    address = await customer_service.add_address(db, user.id, data)
    return APIResponse(
        success=True,
        message="Address saved.",
        data=AddressOut.model_validate(address),
    )


@router.patch(
    "/customers/me/addresses/{address_id}",
    response_model=APIResponse[AddressOut],
    summary="Update a delivery address",
    description="Partially updates one of the customer's addresses.",
)
async def update_address(address_id: int, data: AddressUpdate, user: CurrentUser, db: DbDep):
    address = await customer_service.update_address(db, user.id, address_id, data)
    return APIResponse(success=True, data=AddressOut.model_validate(address))


@router.delete(
    "/customers/me/addresses/{address_id}",
    response_model=APIResponse[None],
    summary="Delete a delivery address",
    description="Removes an address from the customer's saved list.",
)
async def delete_address(address_id: int, user: CurrentUser, db: DbDep):
    await customer_service.delete_address(db, user.id, address_id)
    return APIResponse(success=True, message="Address deleted.")

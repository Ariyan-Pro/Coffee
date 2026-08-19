"""Customer and address management."""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.constants import DEFAULT_PAGE_SIZE
from app.models.address import Address
from app.models.enums import UserStatus
from app.models.user import User
from app.schemas.customer import AddressCreate, AddressUpdate, CustomerCreate, CustomerUpdate
from app.security.security import hash_password
from app.utils.exceptions import ConflictError, NotFoundError


async def create_customer(db: AsyncSession, data: CustomerCreate) -> User:
    existing = await db.execute(
        select(User).where(
            or_(
                User.email == data.email.lower() if data.email else False,
                User.phone == data.phone if data.phone else False,
            )
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("An account with this email or phone already exists.")

    user = User(
        email=data.email.lower() if data.email else None,
        phone=data.phone,
        full_name=data.full_name.strip(),
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()
    return user


async def get_customer(db: AsyncSession, user_id: int) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFoundError("Customer not found.")
    return user


async def list_customers(
    db: AsyncSession, page: int, page_size: int, search: str | None = None
) -> tuple[list[User], int]:
    page_size = min(page_size, 100)
    stmt = select(User)
    count_stmt = select(func.count()).select_from(User)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like))
        )
        count_stmt = count_stmt.where(
            or_(User.full_name.ilike(like), User.email.ilike(like), User.phone.ilike(like))
        )
    total = (await db.execute(count_stmt)).scalar_one()
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = list((await db.execute(stmt)).scalars().all())
    return items, total


async def update_customer(db: AsyncSession, user_id: int, data: CustomerUpdate) -> User:
    user = await get_customer(db, user_id)
    updates = data.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        updates["email"] = updates["email"].lower()
    for field, value in updates.items():
        setattr(user, field, value)
    await db.flush()
    return user


async def delete_customer(db: AsyncSession, user_id: int) -> None:
    user = await get_customer(db, user_id)
    user.status = UserStatus.INACTIVE
    await db.flush()


# --- Addresses ---------------------------------------------------------------
async def list_addresses(db: AsyncSession, user_id: int) -> list[Address]:
    result = await db.execute(
        select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc())
    )
    return list(result.scalars().all())


async def add_address(db: AsyncSession, user_id: int, data: AddressCreate) -> Address:
    if data.is_default:
        await _clear_defaults(db, user_id)
    address = Address(user_id=user_id, **data.model_dump())
    db.add(address)
    await db.flush()
    return address


async def get_address(db: AsyncSession, user_id: int, address_id: int) -> Address:
    address = await db.get(Address, address_id)
    if address is None or address.user_id != user_id:
        raise NotFoundError("Address not found.")
    return address


async def update_address(
    db: AsyncSession, user_id: int, address_id: int, data: AddressUpdate
) -> Address:
    address = await get_address(db, user_id, address_id)
    updates = data.model_dump(exclude_unset=True)
    if updates.get("is_default"):
        await _clear_defaults(db, user_id)
    for field, value in updates.items():
        setattr(address, field, value)
    await db.flush()
    return address


async def delete_address(db: AsyncSession, user_id: int, address_id: int) -> None:
    address = await get_address(db, user_id, address_id)
    await db.delete(address)
    await db.flush()


async def _clear_defaults(db: AsyncSession, user_id: int) -> None:
    result = await db.execute(
        select(Address).where(Address.user_id == user_id, Address.is_default.is_(True))
    )
    for addr in result.scalars().all():
        addr.is_default = False

"""Authentication and account lifecycle."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole, UserStatus
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, RegisterRequest
from app.security.security import hash_password, verify_password
from app.utils.exceptions import ConflictError, UnauthorizedError


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    """Create a new customer account (email and/or phone must be unique)."""
    email = data.email.lower() if data.email else None
    phone = data.phone

    existing = await db.execute(
        select(User).where(
            or_(
                User.email == email if email else False,
                User.phone == phone if phone else False,
            )
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("An account with this email or phone already exists.")

    user = User(
        email=email,
        phone=phone,
        full_name=data.full_name.strip(),
        password_hash=hash_password(data.password),
        role=UserRole.CUSTOMER,
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.flush()
    return user


async def authenticate(db: AsyncSession, identifier: str, password: str) -> User:
    """Validate credentials and return the user or raise UnauthorizedError."""
    identifier = identifier.strip().lower()
    result = await db.execute(
        select(User).where(
            or_(
                User.email == identifier,
                User.phone == identifier,
            )
        )
    )
    user = result.scalar_one_or_none()
    if user is None or not user.password_hash or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials.")
    if not user.is_active:
        raise UnauthorizedError("Account is inactive or blocked.")
    return user


async def change_password(
    db: AsyncSession, user: User, data: ChangePasswordRequest
) -> None:
    if not verify_password(data.current_password, user.password_hash or ""):
        raise UnauthorizedError("Current password is incorrect.")
    user.password_hash = hash_password(data.new_password)
    await db.flush()

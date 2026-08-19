"""FastAPI security dependencies (auth + authorization)."""

from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.security.security import decode_access_token
from app.utils.exceptions import ForbiddenError, UnauthorizedError

_bearer_scheme = HTTPBearer(auto_error=False)

DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
    request: Request = None,  # type: ignore[assignment]  # injected by FastAPI
) -> User:
    """Resolve the authenticated user from the Bearer token."""
    if credentials is None:
        raise UnauthorizedError("Missing bearer token.")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub", ""))
    except (JWTError, ValueError) as exc:
        raise UnauthorizedError("Invalid or expired token.") from exc

    user = await db.get(User, user_id)
    if user is None:
        raise UnauthorizedError("User account no longer exists.")

    if not user.is_active:
        raise UnauthorizedError("Account is inactive or blocked.")

    if request is not None:
        # Snapshot the actor on the request so middleware (audit logging) can
        # read it after the request-scoped session is closed. Never hand the
        # ORM instance to middleware: it detaches when the session closes.
        request.state.user_id = user.id
        request.state.user_role = user.role.value

    return user

CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Administrator role required.")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


async def require_staff(user: CurrentUser) -> User:
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise ForbiddenError("Staff role required.")
    return user


StaffUser = Annotated[User, Depends(require_staff)]


def ensure_self_or_staff(actor: User, target_user_id: int) -> None:
    """Allow a user to act on their own record, or staff on anyone's."""
    if actor.role == UserRole.CUSTOMER and actor.id != target_user_id:
        raise ForbiddenError("You can only access your own resources.")

"""Authentication routes."""

from fastapi import APIRouter

from app.config.constants import (
    LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    MAX_LOGIN_ATTEMPTS_PER_WINDOW,
)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.schemas.common import APIResponse
from app.security.dependencies import CurrentUser, DbDep
from app.security.rate_limit import check_rate_limit
from app.security.security import create_access_token, get_token_expiry_minutes
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[TokenResponse],
    summary="Register a new customer account",
    description="Creates a customer account using email and/or phone. Returns a JWT access token on success.",
    responses={
        201: {"description": "Account created."},
        409: {"description": "Account with this email/phone already exists."},
        422: {"description": "Validation error (missing contact, weak password)."},
    },
    status_code=201,
)
async def register(data: RegisterRequest, db: DbDep):
    user = await auth_service.register(db, data)
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return APIResponse(
        success=True,
        message="Account created successfully.",
        data=TokenResponse(
            access_token=token,
            expires_in=get_token_expiry_minutes() * 60,
            user=UserOut.model_validate(user),
        ),
    )


@router.post(
    "/login",
    response_model=APIResponse[TokenResponse],
    summary="Authenticate a customer or staff member",
    description="Accepts an email or phone number plus a password. Rate limited to "
    f"{MAX_LOGIN_ATTEMPTS_PER_WINDOW} attempts per {LOGIN_RATE_LIMIT_WINDOW_SECONDS} seconds.",
    responses={
        200: {"description": "Login successful."},
        401: {"description": "Invalid credentials or inactive account."},
        429: {"description": "Too many login attempts."},
    },
)
async def login(data: LoginRequest, db: DbDep):
    identifier = data.identifier.lower().strip()
    await check_rate_limit(
        f"login:{identifier}", MAX_LOGIN_ATTEMPTS_PER_WINDOW, LOGIN_RATE_LIMIT_WINDOW_SECONDS
    )
    user = await auth_service.authenticate(db, data.identifier, data.password)
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return APIResponse(
        success=True,
        message="Login successful.",
        data=TokenResponse(
            access_token=token,
            expires_in=get_token_expiry_minutes() * 60,
            user=UserOut.model_validate(user),
        ),
    )


@router.get(
    "/me",
    response_model=APIResponse[UserOut],
    summary="Get the current authenticated user",
    description="Returns the profile of the user identified by the bearer token.",
    responses={200: {"description": "Current user profile."}, 401: {"description": "Missing or invalid token."}},
)
async def me(user: CurrentUser):
    return APIResponse(success=True, data=UserOut.model_validate(user))


@router.post(
    "/change-password",
    response_model=APIResponse[None],
    summary="Change the current user's password",
    description="Requires the current password and a new password of at least 8 characters.",
    responses={200: {"description": "Password updated."}, 401: {"description": "Current password incorrect."}},
)
async def change_password(data: ChangePasswordRequest, user: CurrentUser, db: DbDep):
    await auth_service.change_password(db, user, data)
    return APIResponse(success=True, message="Password updated.")

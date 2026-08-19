"""Auth / account schemas."""

import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=9, max_length=32)
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def at_least_one_contact(self) -> "RegisterRequest":
        if not self.email and not self.phone:
            raise ValueError("Provide at least one of email or phone")
        return self

    @model_validator(mode="after")
    def validate_phone_chars(self) -> "RegisterRequest":
        if self.phone is not None:
            stripped = self.phone.replace("+", "").replace("-", "").replace(" ", "")
            if not stripped.isdigit():
                raise ValueError("phone must contain only digits, '+' and '-'")
        return self


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=255)  # email or phone
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    full_name: str
    email: str | None
    phone: str | None
    role: UserRole
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime.datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut

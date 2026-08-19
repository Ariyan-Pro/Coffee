"""Customer / user management schemas."""

import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.enums import UserRole, UserStatus


class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=9, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.CUSTOMER

    @model_validator(mode="after")
    def at_least_one_contact(self) -> "CustomerCreate":
        if not self.email and not self.phone:
            raise ValueError("Provide at least one of email or phone")
        return self


class CustomerUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=9, max_length=32)
    status: UserStatus | None = None
    role: UserRole | None = None
    is_email_verified: bool | None = None
    is_phone_verified: bool | None = None


class CustomerOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    full_name: str
    email: str | None
    phone: str | None
    role: UserRole
    status: UserStatus
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime.datetime


class AddressBase(BaseModel):
    label: str = Field(default="Home", max_length=64)
    recipient_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=9, max_length=32)
    street_address: str = Field(min_length=3, max_length=500)
    city: str = Field(min_length=2, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=64)
    recipient_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=32)
    street_address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=100)
    province: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    is_default: bool | None = None


class AddressOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    label: str
    recipient_name: str
    phone: str
    street_address: str
    city: str
    province: str | None
    postal_code: str | None
    is_default: bool

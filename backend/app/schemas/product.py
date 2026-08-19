"""Product schemas."""

import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import GrindOption, ProductStatus, RoastLevel


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=300, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    sku: str = Field(min_length=1, max_length=64)
    description: str | None = None
    summary: str | None = Field(default=None, max_length=500)

    origin_country: str = Field(min_length=2, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    farm: str | None = Field(default=None, max_length=255)
    altitude_m: int | None = Field(default=None, ge=0)
    processing_method: str | None = Field(default=None, max_length=100)

    roast_level: RoastLevel
    grind_options: list[GrindOption] = Field(default_factory=list)
    flavor_notes: list[str] = Field(default_factory=list)

    price_per_unit: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    weight_grams: int = Field(gt=0)
    stock_quantity: int = Field(default=0, ge=0)

    status: ProductStatus = ProductStatus.DRAFT
    image_url: str | None = Field(default=None, max_length=500)
    is_featured: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    slug: str | None = Field(default=None, max_length=300)
    sku: str | None = Field(default=None, max_length=64)
    description: str | None = None
    summary: str | None = Field(default=None, max_length=500)
    origin_country: str | None = Field(default=None, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    farm: str | None = Field(default=None, max_length=255)
    altitude_m: int | None = Field(default=None, ge=0)
    processing_method: str | None = Field(default=None, max_length=100)
    roast_level: RoastLevel | None = None
    grind_options: list[GrindOption] | None = None
    flavor_notes: list[str] | None = None
    price_per_unit: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    weight_grams: int | None = Field(default=None, gt=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    status: ProductStatus | None = None
    image_url: str | None = Field(default=None, max_length=500)
    is_featured: bool | None = None


class ProductOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    slug: str
    sku: str
    description: str | None
    summary: str | None
    origin_country: str
    region: str | None
    farm: str | None
    altitude_m: int | None
    processing_method: str | None
    roast_level: RoastLevel
    grind_options: list[str]
    flavor_notes: list[str]
    price_per_unit: Decimal
    weight_grams: int
    stock_quantity: int
    status: ProductStatus
    image_url: str | None
    is_featured: bool
    created_at: datetime.datetime


class StockAdjustRequest(BaseModel):
    quantity: int  # signed delta, e.g. -5 or +10

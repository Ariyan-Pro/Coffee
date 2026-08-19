"""Coffee products."""

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Enum, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeEngine

from app.database.base import Base, TimestampMixin
from app.models.enums import GrindOption, ProductStatus, RoastLevel

if TYPE_CHECKING:
    from app.models.order import OrderItem
    from app.models.subscription import Subscription

# JSON column that uses native JSONB on PostgreSQL and portable JSON elsewhere
# (SQLite for tests). Lets the same model run in any environment.
JsonDict: TypeEngine = JSON().with_variant(JSONB(), "postgresql")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(300), unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Sourcing / origin
    origin_country: Mapped[str] = mapped_column(String(100), index=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    farm: Mapped[str | None] = mapped_column(String(255), nullable=True)
    altitude_m: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processing_method: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Taste / preparation
    roast_level: Mapped[RoastLevel] = mapped_column(
        Enum(RoastLevel, native_enum=False, length=16), nullable=False
    )
    grind_options: Mapped[list] = mapped_column(JsonDict, default=list, nullable=False)
    flavor_notes: Mapped[list] = mapped_column(JsonDict, default=list, nullable=False)

    # Pricing / inventory
    price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    weight_grams: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    status: Mapped[ProductStatus] = mapped_column(
        Enum(ProductStatus, native_enum=False, length=16),
        default=ProductStatus.DRAFT,
        nullable=False,
    )
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="product", lazy="selectin"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="product", lazy="selectin"
    )

    @property
    def is_active(self) -> bool:
        return self.status == ProductStatus.ACTIVE

    @property
    def in_stock(self) -> bool:
        return self.stock_quantity > 0

"""Shared API dependencies (pagination, auth shortcuts)."""

from typing import Annotated

from fastapi import Query

from app.config.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.models.enums import DeliveryStatus, OrderStatus, ProductStatus, RoastLevel

PageQuery = Annotated[int, Query(ge=1, description="Page number (1-based).")]
PageSizeQuery = Annotated[
    int, Query(ge=1, le=MAX_PAGE_SIZE, description="Items per page.")
]


def default_page_size() -> int:
    return DEFAULT_PAGE_SIZE


# Filter query aliases used across admin list endpoints.
ProductStatusQuery = ProductStatus | None
OrderStatusQuery = OrderStatus | None
DeliveryStatusQuery = DeliveryStatus | None
RoastLevelQuery = RoastLevel | None

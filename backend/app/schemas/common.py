"""Common response envelopes and pagination schemas."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Uniform response envelope: `{success, message, data}`."""

    success: bool = True
    message: str | None = None
    data: T | None = None


class Page(BaseModel, Generic[T]):
    """Paginated list payload carried inside `APIResponse.data`."""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


def paginate(items: list, total: int, page: int, page_size: int, pages: int) -> Page:
    return Page(items=items, total=total, page=page, page_size=page_size, pages=pages)

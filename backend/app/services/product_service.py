"""Product catalogue management."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ProductStatus, RoastLevel
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.utils.exceptions import BusinessRuleError, ConflictError, NotFoundError


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    existing = await db.execute(
        select(Product).where(
            (Product.slug == data.slug) | (Product.sku == data.sku)
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("A product with this slug or SKU already exists.")

    product = Product(
        **{
            **data.model_dump(),
            "grind_options": [g.value for g in data.grind_options],
            "flavor_notes": list(data.flavor_notes),
        }
    )
    db.add(product)
    await db.flush()
    return product


async def get_product(db: AsyncSession, product_id: int, *, active_only: bool = False) -> Product:
    product = await db.get(Product, product_id)
    if product is None or (active_only and not product.is_active):
        raise NotFoundError("Product not found.")
    return product


async def get_product_by_slug(db: AsyncSession, slug: str, *, active_only: bool = False) -> Product:
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalar_one_or_none()
    if product is None or (active_only and not product.is_active):
        raise NotFoundError("Product not found.")
    return product


async def list_products(
    db: AsyncSession,
    page: int,
    page_size: int,
    *,
    status: ProductStatus | None = None,
    roast_level: RoastLevel | None = None,
    origin: str | None = None,
    search: str | None = None,
    active_only: bool = False,
) -> tuple[list[Product], int]:
    page_size = min(page_size, 100)
    stmt = select(Product)
    count_stmt = select(func.count()).select_from(Product)

    conditions = []
    if active_only:
        conditions.append(Product.status == ProductStatus.ACTIVE)
    if status:
        conditions.append(Product.status == status)
    if roast_level:
        conditions.append(Product.roast_level == roast_level)
    if origin:
        conditions.append(Product.origin_country.ilike(f"%{origin.strip()}%"))
    if search:
        conditions.append(
            Product.name.ilike(f"%{search.strip()}%")
            | Product.slug.ilike(f"%{search.strip()}%")
        )

    if conditions:
        stmt = stmt.where(*conditions)
        count_stmt = count_stmt.where(*conditions)

    total = (await db.execute(count_stmt)).scalar_one()
    stmt = (
        stmt.order_by(Product.is_featured.desc(), Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list((await db.execute(stmt)).scalars().all())
    return items, total


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    product = await get_product(db, product_id)
    updates = data.model_dump(exclude_unset=True)
    if "grind_options" in updates and updates["grind_options"] is not None:
        updates["grind_options"] = [g.value for g in updates["grind_options"]]
    for field, value in updates.items():
        setattr(product, field, value)
    await db.flush()
    return product


async def adjust_stock(db: AsyncSession, product_id: int, delta: int) -> Product:
    product = await get_product(db, product_id)
    if product.stock_quantity + delta < 0:
        raise BusinessRuleError("Not enough stock for this operation.")
    product.stock_quantity += delta
    await db.flush()
    return product


async def deactivate_product(db: AsyncSession, product_id: int) -> Product:
    product = await get_product(db, product_id)
    product.status = ProductStatus.INACTIVE
    await db.flush()
    return product

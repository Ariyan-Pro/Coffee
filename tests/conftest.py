"""Test fixtures.

The database is a file-backed SQLite database (one per session) accessed with
a NullPool so every request - whether it runs in the test loop or inside
Starlette's TestClient portal thread - opens its own connection. This avoids
the classic asyncio "attached to a different loop" failure mode.
"""

import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["REDIS_URL"] = "redis://localhost:6379/9"

from collections.abc import AsyncGenerator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import event  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import NullPool  # noqa: E402

from app.database.base import Base  # noqa: E402
from app.database.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import *  # noqa: E402,F403  (register all tables on Base.metadata)
from app.models.enums import UserRole  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security.security import create_access_token, hash_password  # noqa: E402


_test_engine = create_async_engine(
    "sqlite+aiosqlite:///./test.db",
    poolclass=NullPool,
    connect_args={"check_same_thread": False},
)


@event.listens_for(_test_engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()


_test_session_factory = async_sessionmaker(
    _test_engine, expire_on_commit=False, autoflush=False
)


async def _override_get_db() -> AsyncGenerator:
    async with _test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
async def _fresh_schema():
    """Drop and recreate all tables before every test (full isolation)."""
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def db() -> AsyncGenerator:
    """Fresh session per test on the already-created schema."""
    async with _test_session_factory() as session:
        yield session
        await session.close()


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def customer_user(db) -> User:
    user = User(
        email="customer@example.com",
        phone="+923001112233",
        full_name="Ayesha Customer",
        password_hash=hash_password("password123"),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    await db.flush()
    await db.commit()
    return user


@pytest.fixture
async def admin_user(db) -> User:
    user = User(
        email="admin@example.com",
        phone="+923004445566",
        full_name="Admin User",
        password_hash=hash_password("adminpass123"),
        role=UserRole.ADMIN,
    )
    db.add(user)
    await db.flush()
    await db.commit()
    return user


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=str(user.id), role=user.role.value)
    return {"Authorization": f"Bearer {token}"}

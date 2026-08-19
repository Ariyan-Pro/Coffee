"""Pydantic schemas (request/response contracts)."""

from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.schemas.customer import (
    AddressCreate,
    AddressOut,
    AddressUpdate,
    CustomerCreate,
    CustomerOut,
    CustomerUpdate,
)
from app.schemas.delivery import (
    DeliveryCreate,
    DeliveryOut,
    DeliveryStatusUpdate,
    DeliveryUpdate,
)
from app.schemas.notification import NotificationOut
from app.schemas.order import (
    CancelOrderRequest,
    OrderCreate,
    OrderItemIn,
    OrderItemOut,
    OrderOut,
    OrderStatusUpdate,
)
from app.schemas.payment import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentOut,
    PaymentVerifyRequest,
)
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, StockAdjustRequest
from app.schemas.subscription import (
    PlanCreate,
    PlanOut,
    PlanUpdate,
    SubscriptionActionRequest,
    SubscriptionCreate,
    SubscriptionOut,
)

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "ChangePasswordRequest",
    "TokenResponse",
    "UserOut",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerOut",
    "AddressCreate",
    "AddressUpdate",
    "AddressOut",
    "ProductCreate",
    "ProductUpdate",
    "ProductOut",
    "StockAdjustRequest",
    "PlanCreate",
    "PlanUpdate",
    "PlanOut",
    "SubscriptionCreate",
    "SubscriptionActionRequest",
    "SubscriptionOut",
    "OrderCreate",
    "OrderItemIn",
    "OrderItemOut",
    "OrderOut",
    "OrderStatusUpdate",
    "CancelOrderRequest",
    "PaymentInitiateRequest",
    "PaymentInitiateResponse",
    "PaymentVerifyRequest",
    "PaymentOut",
    "DeliveryCreate",
    "DeliveryUpdate",
    "DeliveryStatusUpdate",
    "DeliveryOut",
    "NotificationOut",
]

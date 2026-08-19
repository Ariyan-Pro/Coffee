"""Domain enumerations shared by models, schemas and services.

Values are stored as strings in the database (`native_enum=False`) so the
schema stays portable across PostgreSQL and SQLite and can be extended
without ALTER TYPE migrations.
"""

import enum


class _StrEnum(str, enum.Enum):
    def __str__(self) -> str:
        return self.value


class UserRole(_StrEnum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    CUSTOMER = "CUSTOMER"


class UserStatus(_StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED = "BLOCKED"


class ProductStatus(_StrEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class RoastLevel(_StrEnum):
    LIGHT = "LIGHT"
    MEDIUM = "MEDIUM"
    MEDIUM_DARK = "MEDIUM_DARK"
    DARK = "DARK"


class GrindOption(_StrEnum):
    WHOLE_BEAN = "WHOLE_BEAN"
    COARSE = "COARSE"
    MEDIUM = "MEDIUM"
    FINE = "FINE"
    ESPRESSO = "ESPRESSO"


class PlanFrequency(_StrEnum):
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"


class PlanStatus(_StrEnum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    RETIRED = "RETIRED"


class SubscriptionStatus(_StrEnum):
    TRIALING = "TRIALING"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class OrderStatus(_StrEnum):
    PENDING = "PENDING"
    PAID = "PAID"
    PROCESSING = "PROCESSING"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    RETURNED = "RETURNED"
    FAILED = "FAILED"


class PaymentStatus(_StrEnum):
    PENDING = "PENDING"
    INITIATED = "INITIATED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentMethod(_StrEnum):
    JAZZCASH = "JAZZCASH"
    EASYPAISA = "EASYPAISA"
    COD = "COD"


class DeliveryStatus(_StrEnum):
    SCHEDULED = "SCHEDULED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    RETURNED = "RETURNED"


class NotificationChannel(_StrEnum):
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationType(_StrEnum):
    ORDER_CONFIRMED = "ORDER_CONFIRMED"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    ORDER_SHIPPED = "ORDER_SHIPPED"
    ORDER_DELIVERED = "ORDER_DELIVERED"
    SUBSCRIPTION_CREATED = "SUBSCRIPTION_CREATED"
    SUBSCRIPTION_RENEWED = "SUBSCRIPTION_RENEWED"
    SUBSCRIPTION_CANCELLED = "SUBSCRIPTION_CANCELLED"


class NotificationStatus(_StrEnum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    FAILED = "FAILED"

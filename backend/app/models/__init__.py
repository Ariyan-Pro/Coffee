"""Model registry.

Importing every model here guarantees all tables are registered on
`Base.metadata`, which Alembic autogenerate and test setups rely on.
"""

from app.models.user import User
from app.models.address import Address
from app.models.product import Product
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.delivery import Delivery
from app.models.notification import Notification
from app.models.audit import AuditLog

__all__ = [
    "User",
    "Address",
    "Product",
    "SubscriptionPlan",
    "Subscription",
    "Order",
    "OrderItem",
    "Payment",
    "Delivery",
    "Notification",
    "AuditLog",
]

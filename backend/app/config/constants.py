"""Application-wide constants.

Centralised here so no business value is hardcoded across services or routes.
"""

# Currency -------------------------------------------------------------------
CURRENCY = "PKR"

# Money ----------------------------------------------------------------------
MAX_ITEM_QUANTITY = 100
MIN_ORDER_AMOUNT = 1  # In currency minor units of the amount (raw decimal value)

# Default fee values. Can be overridden per order when a real delivery
# carrier integration lands.
DEFAULT_DELIVERY_FEE = 250  # PKR, flat national delivery
FREE_DELIVERY_THRESHOLD = 5000  # PKR

# Subscription ----------------------------------------------------------------
FREQUENCY_INTERVAL_DAYS = {
    "WEEKLY": 7,
    "BIWEEKLY": 14,
    "MONTHLY": 30,
}

DEFAULT_NEXT_DELIVERY_LEAD_DAYS = 2  # minimum days before next delivery

# Order numbering -------------------------------------------------------------
ORDER_NUMBER_PREFIX = "COF"
ORDER_NUMBER_RANDOM_DIGITS = 6

# Pagination -------------------------------------------------------------------
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Auth / rate limiting ----------------------------------------------------------
MAX_LOGIN_ATTEMPTS_PER_WINDOW = 10
LOGIN_RATE_LIMIT_WINDOW_SECONDS = 300  # 5 minutes

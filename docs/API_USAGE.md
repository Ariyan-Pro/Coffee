# API Usage

Base URL: `http://localhost:8000`. Interactive docs at `/docs`.

All responses use a consistent envelope:

```json
{ "success": true, "data": { ... } }
```

Errors: `{ "success": false, "code": "...", "message": "...", "details": null }` with the appropriate HTTP status.

Authentication: `Authorization: Bearer <access_token>`.

## Headers

Every response includes:

- `X-Request-ID` - echo of the caller-supplied request id (or a generated one);
  use it to correlate support tickets with logs.
- `X-API-Version` - the current API major version (`v1`).
- Security headers: `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`,
  `Permissions-Policy` (see `docs/DEPLOYMENT.md`).

Deprecated versions additionally return `Deprecation: true`, a `Sunset` date and
a `Link` header to the successor (see `docs/API_VERSIONING.md`). Unknown version
prefixes (`/api/v99/...`) return `400 UNSUPPORTED_API_VERSION`.

## Observability endpoints

- `GET /metrics` - Prometheus metrics (see `docs/OBSERVABILITY.md`).
- `GET /api/v1/health` - liveness + DB check.

## Auth

### Register

`POST /api/v1/auth/register`

```json
{
  "full_name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "phone": "+923001112233",
  "password": "password123"
}
```

At least one of `email`/`phone` is required. Returns a token (`access_token`, `expires_in`, `user`).

### Login

`POST /api/v1/auth/login` - body `{ "identifier": "email or phone", "password": "..." }`. Same token shape.

### Me

`GET /api/v1/auth/me` - authenticated. Returns the current user.

### Change password

`POST /api/v1/auth/change-password` - body `{ "current_password": "...", "new_password": "..." }`.

## Catalog

### Products

- `GET /api/v1/products` - public list (active products only).
- `GET /api/v1/products/{id}` - public detail.
- `POST /api/v1/products` (admin) - create; body `name`, `slug`, `sku`, `origin_country`, `roast_level`, `grind_options[]`, `flavor_notes[]`, `price_per_unit`, `weight_grams`, `stock_quantity`, `status` (`DRAFT`|`ACTIVE`|`ARCHIVED`), etc.
- `PUT /api/v1/products/{id}` (admin), `PATCH /api/v1/products/{id}/stock` (admin) - `{ "delta": int }`.

### Plans

- `GET /api/v1/plans`, `GET /api/v1/plans/{id}` - public.
- `POST /api/v1/plans`, `PUT /api/v1/plans/{id}` (admin). Plan fields: `name`, `slug`, `frequency` (`WEEKLY`|`BIWEEKLY`|`MONTHLY`), `billing_interval_days`, `discount_percent`, `status`.

## Customer (authenticated customer)

- `GET /api/v1/customers/me` - profile.
- `GET/POST/PUT/DELETE /api/v1/customers/me/addresses` - manage shipping addresses (used for orders).

## Orders (authenticated)

### Create

`POST /api/v1/orders`

```json
{
  "items": [{ "product_id": 1, "quantity": 2 }],
  "address_id": 1,
  "payment_method": "JAZZCASH",
  "notes": "Leave at gate"
}
```

Prices are computed server-side; the response includes `subtotal`, `delivery_fee`, `total_amount`, `status: PENDING`.

### Read / cancel

- `GET /api/v1/orders/{id}` - own order.
- `POST /api/v1/orders/{id}/cancel` - body `{ "reason": "..." }`. Cancels a PENDING/PAID/earlier order and restores stock.
- Admin: `GET /api/v1/admin/orders`, `GET/PATCH /api/v1/admin/orders/{id}`, `PATCH /api/v1/admin/orders/{id}/status` with `{ "status": "PROCESSING" }` (enforced state machine).

## Payments (authenticated)

### Initiate

`POST /api/v1/payments/initiate`

```json
{ "order_id": 1, "method": "JAZZCASH" }
```

Response includes `provider_reference`, `status` (`INITIATED`) and `redirect_url` for the provider page. Method `COD` settles on delivery.

### Verify

`POST /api/v1/payments/{id}/verify` - body `{ "provider_reference": "..." }` (optional). Returns current payment status - poll this after redirecting back from a provider.

### Read

`GET /api/v1/payments/{id}` - own payment.

## Webhooks (provider -> us)

- `POST /api/v1/webhooks/mock?ref=<provider_reference>&success=true|false` - simulate a provider callback (development).
- `POST /api/v1/webhooks/jazzcash`, `POST /api/v1/webhooks/easypaisa` - production callbacks. Success mapping: JazzCash `pp_ResponseCode == "0"`; EasyPaisa status in `("0000", "0", "SUCCESS")`. Callbacks are idempotent.

## Subscriptions (authenticated)

- `POST /api/v1/subscriptions` - `{ "plan_id": 1, "product_id": 1, "quantity": 2, "address_id": 1 }`.
- `GET /api/v1/subscriptions` - own list. `GET /api/v1/subscriptions/{id}`.
- `POST /api/v1/subscriptions/{id}/pause` - `{ "until": "2026-09-01" }` (optional).
- `POST /api/v1/subscriptions/{id}/resume`.
- `POST /api/v1/subscriptions/{id}/cancel` - `{ "reason": "..." }`.

Subscriptions automatically generate orders on `next_delivery_date` via the daily renewal job.

## Deliveries

- `GET /api/v1/deliveries` (staff/admin), `GET /api/v1/deliveries/order/{order_id}`.
- `PATCH /api/v1/deliveries/{delivery_id}/status` (staff/admin) - body `{ "status": "OUT_FOR_DELIVERY" }`. Statuses: `SCHEDULED`, `PACKED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RETURNED`. Marking DELIVERED also settles COD.

## Example: full happy path

```bash
# 1. register + login
TOKEN=$(curl -s -X POST localhost:8000/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"full_name":"Ayesha Khan","email":"a@example.com","password":"password123"}' | jq -r .data.access_token)

# 2. create an order (COD keeps it simple)
ORDER=$(curl -s -X POST localhost:8000/api/v1/orders -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"product_id":1,"quantity":1}],"payment_method":"COD"}')
ORDER_ID=$(echo "$ORDER" | jq -r .data.id)

# 3. initiate payment
PAY=$(curl -s -X POST localhost:8000/api/v1/payments/initiate -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"order_id\":$ORDER_ID,\"method\":\"COD\"}")
PAY_ID=$(echo "$PAY" | jq -r .data.payment_id)

# 4. verify status
curl -s -X POST localhost:8000/api/v1/payments/$PAY_ID/verify -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{}'
```

## Roles

- `CUSTOMER` - default; owns orders/payments/subscriptions/addresses.
- `STAFF` - deliveries, admin order views.
- `ADMIN` - product/plan CRUD, stock, all order operations.

Admins are bootstrapped in the database (no public signup endpoint promotes roles).

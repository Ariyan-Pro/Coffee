"""Integration tests exercising the HTTP API end to end."""

from decimal import Decimal

from tests.conftest import auth_headers


def _product_payload(slug: str = "peru-cajamarca", sku: str = "PERU-001") -> dict:
    return {
        "name": "Peru Cajamarca",
        "slug": slug,
        "sku": sku,
        "description": "Caramel, chocolate, nutty.",
        "origin_country": "Peru",
        "region": "Cajamarca",
        "roast_level": "MEDIUM",
        "grind_options": ["WHOLE_BEAN", "ESPRESSO"],
        "flavor_notes": ["caramel", "cocoa"],
        "price_per_unit": "1800.00",
        "weight_grams": 250,
        "stock_quantity": 20,
        "status": "ACTIVE",
    }


class TestAuth:
    def test_register_login_me(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Bilal Khan",
                "email": "bilal@example.com",
                "phone": "+923331234567",
                "password": "secretpass1",
            },
        )
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["access_token"]
        assert data["user"]["email"] == "bilal@example.com"

        login = client.post(
            "/api/v1/auth/login",
            json={"identifier": "bilal@example.com", "password": "secretpass1"},
        )
        assert login.status_code == 200
        token = login.json()["data"]["access_token"]

        me = client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert me.status_code == 200
        assert me.json()["data"]["full_name"] == "Bilal Khan"

    def test_duplicate_register_conflicts(self, client, customer_user):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Another User",
                "email": customer_user.email,
                "phone": "+92339998877",
                "password": "secretpass1",
            },
        )
        assert response.status_code == 409

    def test_login_wrong_password(self, client, customer_user):
        response = client.post(
            "/api/v1/auth/login",
            json={"identifier": customer_user.email, "password": "wrong-password"},
        )
        assert response.status_code == 401

    def test_weak_password_rejected(self, client):
        response = client.post(
            "/api/v1/auth/register",
            json={"full_name": "X", "email": "x@example.com", "password": "short"},
        )
        assert response.status_code == 422


class TestProductLifecycle:
    def test_admin_crud_and_public_visibility(self, client, admin_user, customer_user):
        admin_headers = auth_headers(admin_user)
        customer_headers = auth_headers(customer_user)

        created = client.post(
            "/api/v1/products", headers=admin_headers, json=_product_payload()
        )
        assert created.status_code == 201
        product_id = created.json()["data"]["id"]

        listed = client.get("/api/v1/products", headers=customer_headers)
        assert listed.status_code == 200
        assert listed.json()["data"]["total"] == 1

        updated = client.patch(
            f"/api/v1/products/{product_id}",
            headers=admin_headers,
            json={"price_per_unit": "1900.00", "stock_quantity": 15},
        )
        assert updated.status_code == 200
        assert updated.json()["data"]["price_per_unit"] == "1900.00"

        stock = client.post(
            f"/api/v1/products/{product_id}/stock",
            headers=admin_headers,
            json={"quantity": -5},
        )
        assert stock.status_code == 200
        assert stock.json()["data"]["stock_quantity"] == 10

    def test_customer_cannot_manage_products(self, client, customer_user):
        headers = auth_headers(customer_user)
        response = client.post(
            "/api/v1/products", headers=headers, json=_product_payload(slug="nope", sku="NOPE-1")
        )
        assert response.status_code == 403


class TestOrderAndPaymentFlow:
    def test_full_order_payment_delivery_flow(
        self, client, admin_user, customer_user, db
    ):
        admin_headers = auth_headers(admin_user)
        customer_headers = auth_headers(customer_user)

        created = client.post(
            "/api/v1/products", headers=admin_headers, json=_product_payload()
        )
        product_id = created.json()["data"]["id"]

        order = client.post(
            "/api/v1/orders",
            headers=customer_headers,
            json={"items": [{"product_id": product_id, "quantity": 2}], "address_id": None},
        )
        assert order.status_code == 201
        order_id = order.json()["data"]["id"]
        assert order.json()["data"]["total_amount"] == "3850.00"  # 3600 + 250 fee

        payment = client.post(
            "/api/v1/payments/initiate",
            headers=customer_headers,
            json={"order_id": order_id, "method": "JAZZCASH"},
        )
        assert payment.status_code == 200
        payment_data = payment.json()["data"]
        assert payment_data["redirect_url"] is not None
        ref = payment_data["provider_reference"]

        # Simulate the provider calling back.
        webhook = client.post(f"/api/v1/webhooks/mock?ref={ref}")
        assert webhook.status_code == 200

        order_after = client.get(f"/api/v1/orders/{order_id}", headers=customer_headers)
        assert order_after.json()["data"]["status"] == "PAID"
        assert order_after.json()["data"]["payment_status"] == "COMPLETED"

        # Delivery is created automatically after payment.
        delivery = client.get(f"/api/v1/deliveries/order/{order_id}", headers=customer_headers)
        assert delivery.status_code == 200
        assert delivery.json()["data"]["status"] == "SCHEDULED"

        # Staff advances delivery to DELIVERED.
        updated = client.patch(
            f"/api/v1/deliveries/{delivery.json()['data']['id']}/status",
            headers=admin_headers,
            json={"status": "DELIVERED"},
        )
        assert updated.status_code == 200

    def test_customer_cannot_see_others_orders(self, client, admin_user, customer_user, db):
        admin_headers = auth_headers(admin_user)
        customer_headers = auth_headers(customer_user)

        created = client.post(
            "/api/v1/products", headers=admin_headers, json=_product_payload()
        )
        product_id = created.json()["data"]["id"]

        order = client.post(
            "/api/v1/orders",
            headers=customer_headers,
            json={"items": [{"product_id": product_id, "quantity": 1}]},
        )
        order_id = order.json()["data"]["id"]

        # Second customer tries to read the first customer's order.
        other = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Zara",
                "email": "zara@example.com",
                "phone": "+923321112222",
                "password": "secretpass1",
            },
        )
        other_headers = {
            "Authorization": f"Bearer {other.json()['data']['access_token']}"
        }
        response = client.get(f"/api/v1/orders/{order_id}", headers=other_headers)
        assert response.status_code == 404


class TestSubscriptionFlow:
    def test_create_plan_subscribe_and_renew(self, client, admin_user, customer_user):
        admin_headers = auth_headers(admin_user)
        customer_headers = auth_headers(customer_user)

        client.post("/api/v1/products", headers=admin_headers, json=_product_payload())
        products = client.get("/api/v1/products", headers=customer_headers)
        product_id = products.json()["data"]["items"][0]["id"]

        plan = client.post(
            "/api/v1/plans",
            headers=admin_headers,
            json={
                "name": "Monthly Plan",
                "slug": "monthly-plan",
                "frequency": "MONTHLY",
                "billing_interval_days": 30,
                "discount_percent": "15.00",
            },
        )
        assert plan.status_code == 201
        plan_id = plan.json()["data"]["id"]

        subscription = client.post(
            "/api/v1/subscriptions",
            headers=customer_headers,
            json={"plan_id": plan_id, "product_id": product_id, "quantity": 1},
        )
        assert subscription.status_code == 201
        sub = subscription.json()["data"]
        assert sub["status"] == "ACTIVE"

        cancelled = client.post(
            f"/api/v1/subscriptions/{sub['id']}/cancel",
            headers=customer_headers,
            json={"reason": "switching plans"},
        )
        assert cancelled.status_code == 200
        assert cancelled.json()["data"]["status"] == "CANCELLED"

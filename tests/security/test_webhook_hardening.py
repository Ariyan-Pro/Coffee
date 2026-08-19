"""Webhook hardening tests (Phase 3).

Verifies the two production-facing webhook safeguards:

- the mock webhook (an unauthenticated payment-completion aid) is disabled in
  production environments and can be force-disabled anywhere; and
- when ``WEBHOOK_HMAC_SECRET`` is configured, provider callbacks without a
  valid HMAC-SHA256 signature over the sorted form fields are rejected.
"""

import hmac
import hashlib

from app.config.settings import settings
from tests.conftest import auth_headers

SIG_FIELDS = {"signature", "pp_SecureHash", "signature_hash", "ppSecureHash"}


def _signature(secret: str, form: dict) -> str:
    fields = [f"{k}={v}" for k, v in sorted(form.items()) if k not in SIG_FIELDS]
    payload = "&".join(fields)
    return hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()


class TestMockWebhookGate:
    def test_mock_webhook_disabled_when_forced_off(self, client, monkeypatch):
        monkeypatch.setattr(settings, "MOCK_WEBHOOK_ENABLED", False)
        res = client.post("/api/v1/webhooks/mock?ref=ANY")
        assert res.status_code == 404

    def test_mock_webhook_completes_payment_in_test_env(
        self, client, admin_user, customer_user, monkeypatch
    ):
        monkeypatch.setattr(settings, "MOCK_WEBHOOK_ENABLED", True)
        admin_headers = auth_headers(admin_user)
        customer_headers = auth_headers(customer_user)

        created = client.post(
            "/api/v1/products",
            headers=admin_headers,
            json={
                "name": "Gate Test",
                "slug": "gate-test",
                "sku": "GATE-001",
                "description": "Harden gate.",
                "origin_country": "Pakistan",
                "region": "Punjab",
                "roast_level": "MEDIUM",
                "grind_options": ["WHOLE_BEAN", "ESPRESSO"],
                "flavor_notes": ["caramel"],
                "price_per_unit": "1000.00",
                "weight_grams": 250,
                "stock_quantity": 5,
                "status": "ACTIVE",
            },
        )
        product_id = created.json()["data"]["id"]
        order = client.post(
            "/api/v1/orders",
            headers=customer_headers,
            json={"items": [{"product_id": product_id, "quantity": 1}], "address_id": None},
        )
        order_id = order.json()["data"]["id"]
        payment = client.post(
            "/api/v1/payments/initiate",
            headers=customer_headers,
            json={"order_id": order_id, "method": "JAZZCASH"},
        )
        ref = payment.json()["data"]["provider_reference"]

        res = client.post(f"/api/v1/webhooks/mock?ref={ref}")
        assert res.status_code == 200
        assert res.json()["data"]["status"] == "COMPLETED"


class TestWebhookSignatureVerification:
    def test_no_secret_skips_verification(self, client, monkeypatch):
        monkeypatch.setattr(settings, "WEBHOOK_HMAC_SECRET", "")
        res = client.post(
            "/api/v1/webhooks/jazzcash",
            data={"pp_TxnRefNo": "NOPE123", "pp_ResponseCode": "0"},
        )
        assert res.status_code == 404  # passed the gate, failed ref lookup

    def test_missing_signature_rejected_when_secret_set(self, client, monkeypatch):
        monkeypatch.setattr(settings, "WEBHOOK_HMAC_SECRET", "test-secret")
        res = client.post(
            "/api/v1/webhooks/jazzcash",
            data={"pp_TxnRefNo": "NOPE123", "pp_ResponseCode": "0"},
        )
        assert res.status_code == 422

    def test_wrong_signature_rejected_when_secret_set(self, client, monkeypatch):
        monkeypatch.setattr(settings, "WEBHOOK_HMAC_SECRET", "test-secret")
        res = client.post(
            "/api/v1/webhooks/jazzcash",
            data={
                "pp_TxnRefNo": "NOPE123",
                "pp_ResponseCode": "0",
                "signature": "0" * 64,
            },
        )
        assert res.status_code == 422

    def test_valid_signature_accepted_when_secret_set(self, client, monkeypatch):
        monkeypatch.setattr(settings, "WEBHOOK_HMAC_SECRET", "test-secret")
        form = {"pp_TxnRefNo": "NOPE123", "pp_ResponseCode": "0"}
        form["signature"] = _signature("test-secret", form)
        res = client.post("/api/v1/webhooks/jazzcash", data=form)
        assert res.status_code == 404  # signature valid; ref lookup fails

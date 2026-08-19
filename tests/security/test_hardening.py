"""Harden tests: malformed payloads must never 500.

Every endpoint is driven with randomized garbage - wrong types, huge
strings, missing keys, invalid enums, nested nonsense - and the invariant is
that the API answers with a clean 4xx (validation/auth) and never an
unhandled 5xx. This is a lightweight stand-in for dedicated fuzzing that can
be replaced by a proper fuzz harness (e.g. Hypothesis + the live API) later.
"""

import random
import string

import pytest

from tests.conftest import auth_headers

_random = random.Random(20260816)


def _fuzz_value() -> object:
    """Return a random value that will be wrong for almost any schema field."""
    return _random.choice(
        [
            None,
            "",
            " ",
            "x" * 5000,
            -1,
            0,
            2**63,
            1.5,
            True,
            [],
            {},
            {"nested": {"deep": ["list", 1, None]}},
            "\x00\x01\x02binary",
            "".join(_random.choices(string.printable, k=_random.randint(1, 64))),
            "INVALID_ENUM_VALUE",
            "DROP TABLE users; --",
            {"": ""},
        ]
    )


def _mutate(seed: dict) -> dict:
    """Return a copy of a valid payload with one field replaced by garbage."""
    mutated = dict(seed)
    key = _random.choice(list(seed))
    mutated[key] = _fuzz_value()
    return mutated


def _random_payload(keys: list[str]) -> dict:
    payload: dict = {}
    for key in _random.sample(keys, _random.randint(1, len(keys))):
        payload[key] = _fuzz_value()
    return payload


class TestNever500:
    @pytest.mark.parametrize(
        "method,url",
        [
            ("POST", "/api/v1/auth/register"),
            ("POST", "/api/v1/auth/login"),
            ("GET", "/api/v1/auth/me"),
            ("GET", "/api/v1/products"),
            ("POST", "/api/v1/orders"),
            ("GET", "/api/v1/orders"),
        ],
    )
    def test_public_endpoints_reject_garbage(self, client, method, url):
        seed = {"name": "ok", "email": "a@b.co", "password": "x", "items": []}
        for _ in range(6):
            kwargs = {}
            if method == "POST":
                kwargs["json"] = _mutate(seed)
            response = client.request(method, url, **kwargs)
            assert response.status_code != 500, (
                f"{method} {url} returned 500 for payload {kwargs.get('json')!r}"
            )

    def test_register_random_payloads_never_500(self, client):
        keys = ["email", "password", "full_name", "phone", "role"]
        for _ in range(10):
            response = client.post("/api/v1/auth/register", json=_random_payload(keys))
            assert response.status_code != 500

    def test_login_random_payloads_never_500(self, client):
        keys = ["email", "password"]
        for _ in range(10):
            response = client.post("/api/v1/auth/login", json=_random_payload(keys))
            assert response.status_code != 500

    def test_create_order_with_garbage_never_500(self, client, customer_user):
        headers = auth_headers(customer_user)
        keys = ["items", "address_id", "notes", "payment_method"]
        for _ in range(8):
            response = client.post(
                "/api/v1/orders", json=_random_payload(keys), headers=headers
            )
            assert response.status_code != 500

    def test_create_product_with_garbage_never_500(self, client, admin_user):
        headers = auth_headers(admin_user)
        keys = [
            "name", "slug", "sku", "description", "price_per_unit",
            "weight_grams", "stock_quantity", "grind_options", "roast_level",
        ]
        for _ in range(8):
            response = client.post(
                "/api/v1/products", json=_random_payload(keys), headers=headers
            )
            assert response.status_code != 500

    def test_malformed_json_never_500(self, client):
        garbage = [b"{", b"[", b'{"a":}', b"\x00\xff", b'"unterminated']
        for body in garbage:
            response = client.post(
                "/api/v1/auth/login", content=body, headers={"content-type": "application/json"}
            )
            assert response.status_code != 500

    def test_bad_bearer_tokens_never_500(self, client):
        tokens = ["", "abc", "a" * 1000, "Bearer", "Bearer invalid", "Bearer " + "z" * 200]
        for token in tokens:
            headers = {"Authorization": token}
            response = client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code != 500

    def test_security_headers_present(self, client):
        response = client.get("/api/v1/health")
        assert response.headers["Strict-Transport-Security"].startswith("max-age=")
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["Referrer-Policy"] == "no-referrer"
        assert "default-src 'none'" in response.headers["Content-Security-Policy"]

    def test_metrics_endpoint_exposed(self, client):
        response = client.get("/metrics")
        assert response.status_code == 200
        body = response.text
        assert "http_requests_total" in body
        assert "http_request_duration_seconds" in body

    def test_metrics_do_not_500_on_mutating_requests(self, client, customer_user):
        headers = auth_headers(customer_user)
        client.post("/api/v1/orders", json={}, headers=headers)
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "http_requests_total" in response.text

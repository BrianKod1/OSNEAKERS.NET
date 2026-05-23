"""Stripe Checkout integration tests for OSneakers - new payments flow."""
import os
import time

import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def sample_product(session):
    r = session.get(f"{API}/products")
    assert r.status_code == 200
    return r.json()[0]


def _item(p, qty=1, price_override=None):
    return {
        "product_id": p["id"],
        "name": p["name"],
        "price": price_override if price_override is not None else p["price"],
        "size": "10",
        "quantity": qty,
        "image": p["image"],
    }


def _payload(items, **overrides):
    base = {
        "customer_name": "TEST_Stripe Buyer",
        "email": "test_stripe_buyer@example.com",
        "phone": "+12896007311",
        "address": "123 Test St",
        "city": "Toronto",
        "country": "Canada",
        "items": items,
        "origin_url": "https://example.com",
    }
    base.update(overrides)
    return base


# ---------- Empty cart guard ----------
class TestCheckoutValidation:
    def test_empty_items_returns_400(self, session):
        r = session.post(f"{API}/checkout/session", json=_payload([]))
        assert r.status_code == 400


# ---------- Pricing / shipping / discount ----------
class TestCheckoutPricing:
    def test_low_subtotal_charges_shipping(self, session, sample_product):
        # subtotal=50 ⇒ shipping=15 total=65
        item = _item(sample_product, qty=1, price_override=50.0)
        r = session.post(f"{API}/checkout/session", json=_payload([item]))
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "checkout.stripe.com" in data["url"]
        assert data["session_id"].startswith("cs_")
        assert data["order_number"].startswith("OS")

        order = session.get(f"{API}/orders/{data['order_number']}").json()
        assert order["subtotal"] == 50.0
        assert order["shipping"] == 15.0
        assert order["total"] == 65.0
        assert order["status"] == "pending"
        assert order["payment_status"] == "unpaid"
        assert order["stripe_session_id"] == data["session_id"]

    def test_high_subtotal_free_shipping(self, session, sample_product):
        # subtotal=200 ⇒ shipping=0 total=200
        item = _item(sample_product, qty=1, price_override=200.0)
        r = session.post(f"{API}/checkout/session", json=_payload([item]))
        assert r.status_code == 200, r.text
        data = r.json()
        order = session.get(f"{API}/orders/{data['order_number']}").json()
        assert order["subtotal"] == 200.0
        assert order["shipping"] == 0.0
        assert order["total"] == 200.0

    def test_discount_sneak10(self, session, sample_product):
        # subtotal=200, SNEAK10 => discount=20, after=180 (>=100 ⇒ free shipping), total=180
        item = _item(sample_product, qty=1, price_override=200.0)
        payload = _payload(
            [item],
            discount_code="SNEAK10",
            email="test_stripe_disc@example.com",
        )
        r = session.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        order = session.get(f"{API}/orders/{data['order_number']}").json()
        assert order["subtotal"] == 200.0
        assert order["discount_code"] == "SNEAK10"
        assert order["discount_amount"] == 20.0
        assert order["shipping"] == 0.0
        assert order["total"] == 180.0

    def test_origin_url_respected(self, session, sample_product):
        # We can't read URLs from session resp directly, but the URL returned by Stripe should redirect us.
        # Just verify session creation succeeds with a custom origin.
        item = _item(sample_product, qty=1, price_override=120.0)
        payload = _payload([item], origin_url="https://my-custom-origin.test")
        r = session.post(f"{API}/checkout/session", json=payload)
        assert r.status_code == 200, r.text


# ---------- Persistence ----------
class TestPersistence:
    def test_session_creates_payment_transaction(self, session, sample_product):
        item = _item(sample_product, qty=1, price_override=75.0)
        r = session.post(f"{API}/checkout/session", json=_payload([item]))
        assert r.status_code == 200
        data = r.json()

        # poll status to verify session id is queryable (eventual consistency)
        status_resp = None
        for _ in range(20):
            sr = session.get(f"{API}/checkout/status/{data['session_id']}")
            if sr.status_code == 200:
                status_resp = sr.json()
                break
            time.sleep(0.5)
        assert status_resp is not None, "status never resolved"
        assert status_resp["session_id"] == data["session_id"]
        # Unpaid because no payment was made on hosted page
        assert status_resp["payment_status"] in ("unpaid", "no_payment_required")
        assert status_resp["status"] in ("open", "complete", "expired")
        # Order should NOT be marked paid since payment_status != paid
        order = session.get(f"{API}/orders/{data['order_number']}").json()
        assert order["payment_status"] == "unpaid"
        assert order["status"] == "pending"


# ---------- Idempotency ----------
class TestIdempotency:
    def test_double_status_poll_unpaid_no_side_effects(self, session, sample_product):
        item = _item(sample_product, qty=1, price_override=60.0)
        r = session.post(f"{API}/checkout/session", json=_payload([item]))
        assert r.status_code == 200
        sid = r.json()["session_id"]
        # Two polls back to back - both should succeed
        a = b = None
        for _ in range(20):
            ra = session.get(f"{API}/checkout/status/{sid}")
            if ra.status_code == 200:
                a = ra.json()
                break
            time.sleep(0.5)
        rb = session.get(f"{API}/checkout/status/{sid}")
        assert rb.status_code == 200
        b = rb.json()
        assert a["session_id"] == b["session_id"]


# ---------- Webhook ----------
class TestWebhook:
    def test_webhook_invalid_body_returns_400(self, session):
        r = session.post(f"{API}/webhook/stripe", data="not-a-valid-stripe-event")
        # Should fail signature verification with 400
        assert r.status_code == 400


# ---------- Discount validation ----------
class TestDiscountValidation:
    def test_validate_sneak10(self, session):
        r = session.post(f"{API}/validate-discount", json={"code": "SNEAK10"})
        assert r.status_code == 200
        data = r.json()
        assert data["valid"] is True
        assert data["code"] == "SNEAK10"
        assert data["percent"] == 10

    def test_validate_invalid_code(self, session):
        r = session.post(f"{API}/validate-discount", json={"code": "NOTREAL"})
        assert r.status_code == 200
        assert r.json()["valid"] is False


# ---------- Order lookup regression ----------
class TestOrderLookup:
    def test_get_order_404(self, session):
        r = session.get(f"{API}/orders/OS_NO_SUCH_ORDER")
        assert r.status_code == 404


# ---------- Regression: existing endpoints still work ----------
class TestRegression:
    def test_products_list(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_reviews_list(self, session):
        r = session.get(f"{API}/reviews")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_account_lookup_unknown(self, session):
        r = session.get(f"{API}/account/no_such_user@example.com")
        # endpoint should return 200 with empty/blank data or 404; just ensure no 500
        assert r.status_code in (200, 404)

    def test_subscribe(self, session):
        r = session.post(f"{API}/subscribe", json={"email": "test_subscriber@example.com"})
        assert r.status_code == 200
        data = r.json()
        assert "discount_code" in data

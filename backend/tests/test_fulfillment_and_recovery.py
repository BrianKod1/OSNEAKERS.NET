"""Backend tests for order fulfillment (ship + tracking + email) and tiered cart recovery."""
import asyncio
import os
from datetime import datetime, timezone, timedelta

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE}/api"
ADMIN = "osneakers-admin-2026"
HDR = {"X-Admin-Passcode": ADMIN}

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def _mongo():
    return AsyncIOMotorClient(MONGO_URL)[DB_NAME]


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def _create_pending_order(email: str, name: str, price: float = 280.0) -> str:
    r = requests.post(f"{API}/checkout/session", json={
        "customer_name": name,
        "email": email,
        "phone": "+1",
        "address": "1 Test",
        "city": "Toronto",
        "country": "Canada",
        "items": [{
            "product_id": "p1", "name": "AJ1", "price": price, "size": "10",
            "quantity": 1, "image": "https://x.jpg",
        }],
        "origin_url": "https://example.com",
    })
    assert r.status_code == 200, r.text
    return r.json()["order_number"]


def _set_paid(order_number: str):
    async def _go():
        db = _mongo()
        await db.orders.update_one(
            {"order_number": order_number},
            {"$set": {
                "status": "paid",
                "payment_status": "paid",
                "paid_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
    _run(_go())


def _backdate(order_number: str, hours: float):
    async def _go():
        db = _mongo()
        ts = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        await db.orders.update_one({"order_number": order_number}, {"$set": {"created_at": ts}})
    _run(_go())


def _cleanup(emails: list):
    async def _go():
        db = _mongo()
        await db.orders.delete_many({"email": {"$in": emails}})
        await db.payment_transactions.delete_many({"email": {"$in": emails}})
    _run(_go())


# ---------- Ship flow ----------
class TestShip:
    def test_ship_unpaid_returns_400(self):
        email = "ship_unpaid@example.com"
        order = _create_pending_order(email, "Ship Tester")
        try:
            r = requests.post(
                f"{API}/admin/orders/{order}/ship",
                headers=HDR,
                json={"carrier": "Canada Post", "tracking_number": "TEST1234"},
            )
            assert r.status_code == 400
            assert "not paid" in r.text.lower()
        finally:
            _cleanup([email])

    def test_ship_paid_order_sends_email(self):
        email = "ship_paid@example.com"
        order = _create_pending_order(email, "Ship Buyer")
        _set_paid(order)
        try:
            r = requests.post(
                f"{API}/admin/orders/{order}/ship",
                headers=HDR,
                json={"carrier": "Canada Post", "tracking_number": "1234567890CA"},
            )
            assert r.status_code == 200, r.text
            doc = r.json()
            assert doc["status"] == "shipped"
            assert doc["tracking_carrier"] == "Canada Post"
            assert doc["tracking_number"] == "1234567890CA"
            # Auto-built URL
            assert doc["tracking_url"] and "canadapost" in doc["tracking_url"]
            assert doc["shipped_email_sent"] is True
        finally:
            _cleanup([email])

    def test_ship_with_custom_tracking_url(self):
        email = "ship_custom_url@example.com"
        order = _create_pending_order(email, "Custom URL Buyer")
        _set_paid(order)
        try:
            custom = "https://tracking.mycarrier.example.com/abc123"
            r = requests.post(
                f"{API}/admin/orders/{order}/ship",
                headers=HDR,
                json={"carrier": "Other", "tracking_number": "ABC123", "tracking_url": custom},
            )
            assert r.status_code == 200
            assert r.json()["tracking_url"] == custom
        finally:
            _cleanup([email])

    def test_ship_unknown_order_404(self):
        r = requests.post(
            f"{API}/admin/orders/OS_NOPE/ship",
            headers=HDR,
            json={"carrier": "UPS", "tracking_number": "X"},
        )
        assert r.status_code == 404

    def test_admin_orders_filter(self):
        r = requests.get(f"{API}/admin/orders", headers=HDR, params={"status": "paid"})
        assert r.status_code == 200
        data = r.json()
        for o in data["orders"]:
            assert o["status"] == "paid"


# ---------- Tiered cart recovery ----------
class TestTieredRecovery:
    def test_tier1_5pct_for_2h_old_order(self):
        email = "tier1@example.com"
        order = _create_pending_order(email, "Tier 1 Buyer")
        _backdate(order, 2)  # 2h old → tier 1
        try:
            r = requests.post(f"{API}/admin/abandoned-cart-recovery", headers=HDR)
            assert r.status_code == 200
            data = r.json()
            # At least 1 candidate processed via stage_1
            tier1 = data["by_tier"].get("stage_1_COMEBACK5", {})
            assert tier1.get("candidates", 0) >= 1
            # Verify db state
            async def check():
                db = _mongo()
                doc = await db.orders.find_one({"order_number": order}, {"_id": 0})
                assert doc["recovery_stage"] == 1
                assert doc["recovery_email_sent"] is True
            _run(check())
        finally:
            _cleanup([email])

    def test_tier2_10pct_for_13h_old_stage1(self):
        email = "tier2@example.com"
        order = _create_pending_order(email, "Tier 2 Buyer")
        _backdate(order, 13)  # 13h old
        # Manually set recovery_stage=1 (simulating tier 1 already sent)
        async def setup():
            db = _mongo()
            await db.orders.update_one({"order_number": order}, {"$set": {"recovery_stage": 1, "recovery_email_sent": True}})
        _run(setup())
        try:
            r = requests.post(f"{API}/admin/abandoned-cart-recovery", headers=HDR)
            assert r.status_code == 200
            tier2 = r.json()["by_tier"].get("stage_2_COMEBACK10", {})
            assert tier2.get("candidates", 0) >= 1
            async def check():
                db = _mongo()
                doc = await db.orders.find_one({"order_number": order}, {"_id": 0})
                assert doc["recovery_stage"] == 2
            _run(check())
        finally:
            _cleanup([email])

    def test_tier3_freeship_for_30h_old_stage2(self):
        email = "tier3@example.com"
        order = _create_pending_order(email, "Tier 3 Buyer")
        _backdate(order, 30)  # 30h old
        async def setup():
            db = _mongo()
            await db.orders.update_one({"order_number": order}, {"$set": {"recovery_stage": 2, "recovery_email_sent": True}})
        _run(setup())
        try:
            r = requests.post(f"{API}/admin/abandoned-cart-recovery", headers=HDR)
            assert r.status_code == 200
            tier3 = r.json()["by_tier"].get("stage_3_SHIPFREE", {})
            assert tier3.get("candidates", 0) >= 1
            async def check():
                db = _mongo()
                doc = await db.orders.find_one({"order_number": order}, {"_id": 0})
                assert doc["recovery_stage"] == 3
            _run(check())
        finally:
            _cleanup([email])

    def test_idempotent_no_double_send(self):
        email = "tier_idem@example.com"
        order = _create_pending_order(email, "Idempotent Buyer")
        _backdate(order, 2)
        try:
            r1 = requests.post(f"{API}/admin/abandoned-cart-recovery", headers=HDR)
            r2 = requests.post(f"{API}/admin/abandoned-cart-recovery", headers=HDR)
            # Second run should not pick the same order again (it's now in stage 1)
            tier1_first = r1.json()["by_tier"].get("stage_1_COMEBACK5", {}).get("candidates", 0)
            tier1_second = r2.json()["by_tier"].get("stage_1_COMEBACK5", {}).get("candidates", 0)
            assert tier1_first >= 1
            assert tier1_second == 0 or tier1_second < tier1_first
        finally:
            _cleanup([email])


# ---------- SHIPFREE discount path ----------
class TestShipFreeAtCheckout:
    def test_shipfree_waives_shipping(self):
        email = "shipfree@example.com"
        r = requests.post(f"{API}/checkout/session", json={
            "customer_name": "Ship Free Buyer",
            "email": email,
            "phone": "+1",
            "address": "1 St",
            "city": "Toronto",
            "country": "Canada",
            "items": [{"product_id": "p1", "name": "Cap", "price": 50.0, "quantity": 1, "image": "https://x.jpg"}],
            "discount_code": "SHIPFREE",
            "origin_url": "https://example.com",
        })
        assert r.status_code == 200
        order = r.json()["order_number"]
        try:
            doc = requests.get(f"{API}/orders/{order}").json()
            assert doc["subtotal"] == 50.0
            # Discount percent is 0 (no $ off) but shipping waived → total = 50, not 65
            assert doc["shipping"] == 0.0
            assert doc["total"] == 50.0
        finally:
            _cleanup([email])

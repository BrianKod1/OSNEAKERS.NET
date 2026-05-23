"""Tests for /api/track (public order lookup with email gate) and search endpoints."""
import asyncio
import os
from datetime import datetime, timezone

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

BASE = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def _mongo():
    return AsyncIOMotorClient(MONGO_URL)[DB_NAME]


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


# ---------- /api/track ----------
class TestPublicTrack:
    @pytest.fixture
    def order_and_email(self):
        email = "track_test@example.com"
        r = requests.post(f"{API}/checkout/session", json={
            "customer_name": "Track Tester",
            "email": email,
            "phone": "+1",
            "address": "X",
            "city": "Toronto",
            "country": "Canada",
            "items": [{"product_id": "p1", "name": "AJ1", "price": 280.0, "quantity": 1, "image": "https://x.jpg"}],
            "origin_url": "https://example.com",
        })
        assert r.status_code == 200
        order = r.json()["order_number"]
        yield order, email
        async def cleanup():
            db = _mongo()
            await db.orders.delete_many({"email": email})
            await db.payment_transactions.delete_many({"email": email})
        _run(cleanup())

    def test_track_with_matching_email(self, order_and_email):
        order, email = order_and_email
        r = requests.post(f"{API}/track", json={"order_number": order, "email": email})
        assert r.status_code == 200
        d = r.json()
        assert d["order_number"] == order
        assert d["status"] == "pending"
        assert "items" in d
        assert d["total"] == 280.0  # Free shipping over $100, no discount
        # Should NOT expose private payment fields
        assert "stripe_session_id" not in d
        assert "id" not in d

    def test_track_with_mismatched_email(self, order_and_email):
        order, _ = order_and_email
        r = requests.post(f"{API}/track", json={"order_number": order, "email": "hacker@bad.com"})
        assert r.status_code == 404
        # Error message should not reveal whether the order exists
        assert "matching" in r.text.lower()

    def test_track_with_case_insensitive_email(self, order_and_email):
        order, email = order_and_email
        r = requests.post(f"{API}/track", json={"order_number": order, "email": email.upper()})
        assert r.status_code == 200

    def test_track_missing_fields(self):
        r = requests.post(f"{API}/track", json={"order_number": ""})
        assert r.status_code == 400
        r = requests.post(f"{API}/track", json={})
        assert r.status_code == 400

    def test_track_nonexistent_order(self):
        r = requests.post(f"{API}/track", json={"order_number": "OS_NOPE", "email": "x@y.com"})
        assert r.status_code == 404


# ---------- /api/search/products + /api/products?q= ----------
class TestProductSearch:
    def test_search_jordan_returns_results(self):
        r = requests.get(f"{API}/search/products", params={"q": "jordan"})
        assert r.status_code == 200
        d = r.json()
        assert d["count"] >= 1
        for p in d["results"]:
            text = (p["name"] + " " + p["brand"]).lower()
            assert "jordan" in text

    def test_search_returns_minimal_fields(self):
        r = requests.get(f"{API}/search/products", params={"q": "nike", "limit": 3})
        assert r.status_code == 200
        for p in r.json()["results"]:
            # Only autocomplete-relevant fields
            assert set(p.keys()) <= {"id", "name", "brand", "price", "image"}

    def test_search_no_match(self):
        r = requests.get(f"{API}/search/products", params={"q": "xyzabc__nothing"})
        assert r.status_code == 200
        assert r.json()["count"] == 0

    def test_search_q_param_too_short(self):
        # min_length=1 in route; empty string should 422
        r = requests.get(f"{API}/search/products", params={"q": ""})
        assert r.status_code == 422

    def test_products_q_filter(self):
        r = requests.get(f"{API}/products", params={"q": "force"})
        assert r.status_code == 200
        data = r.json()
        for p in data:
            text = (p["name"] + " " + p["brand"] + " " + p.get("description", "")).lower()
            assert "force" in text

    def test_search_regex_escapes_special_chars(self):
        # Should not 500 on regex metacharacters
        r = requests.get(f"{API}/search/products", params={"q": ".*"})
        assert r.status_code == 200

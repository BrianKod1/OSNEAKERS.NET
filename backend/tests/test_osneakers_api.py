"""OSneakers backend API tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://neon-kicks-7.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Products ----------
class TestProducts:
    def test_list_products_no_objectid(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 20, f"expected ~24 seeded, got {len(data)}"
        for p in data:
            assert "_id" not in p
            assert "id" in p and "name" in p and "brand" in p and "price" in p

    def test_filter_brand_nike(self, session):
        r = session.get(f"{API}/products", params={"brand": "Nike"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(p["brand"] == "Nike" for p in data)

    def test_price_range_sort_asc(self, session):
        r = session.get(f"{API}/products", params={"min_price": 0, "max_price": 200, "sort": "price_asc"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        prices = [p["price"] for p in data]
        assert all(0 <= pr <= 200 for pr in prices)
        assert prices == sorted(prices)

    def test_featured(self, session):
        r = session.get(f"{API}/products", params={"featured": "true"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(p.get("featured") is True for p in data)

    def test_get_product_by_id(self, session):
        first = session.get(f"{API}/products").json()[0]
        r = session.get(f"{API}/products/{first['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == first["id"]

    def test_get_product_404(self, session):
        r = session.get(f"{API}/products/nonexistent-uuid-xxx")
        assert r.status_code == 404


# ---------- Brands ----------
class TestBrands:
    def test_brands_sorted(self, session):
        r = session.get(f"{API}/brands")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        counts = [b["count"] for b in data]
        assert counts == sorted(counts, reverse=True)
        assert all("name" in b and "count" in b for b in data)


# ---------- Reviews ----------
class TestReviews:
    def test_reviews_seeded(self, session):
        r = session.get(f"{API}/reviews")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 6, f"expected 6 seeded reviews, got {len(data)}"
        for rev in data:
            assert "_id" not in rev
            assert rev["verified"] is True
            assert 1 <= rev["rating"] <= 5


# ---------- Orders ----------
class TestOrders:
    def test_create_and_get_order(self, session):
        products = session.get(f"{API}/products").json()
        p = products[0]
        payload = {
            "customer_name": "TEST_Customer",
            "email": "test_customer@example.com",
            "phone": "+12896007311",
            "address": "123 Test St",
            "city": "Toronto",
            "country": "Canada",
            "items": [{
                "product_id": p["id"],
                "name": p["name"],
                "price": p["price"],
                "size": "10",
                "quantity": 1,
                "image": p["image"],
            }],
            "total": p["price"],
            "notes": "TEST order"
        }
        r = session.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["order_number"].startswith("OS")
        assert order["status"] == "pending"
        assert order["total"] == p["price"]
        assert "_id" not in order

        # GET back
        g = session.get(f"{API}/orders/{order['order_number']}")
        assert g.status_code == 200
        assert g.json()["order_number"] == order["order_number"]

    def test_get_order_404(self, session):
        r = session.get(f"{API}/orders/OS_NONEXISTENT")
        assert r.status_code == 404

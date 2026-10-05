"""Admin CRUD + image upload tests (WooCommerce-style admin panel).

Covers:
- POST /api/admin/products create
- PUT /api/admin/products/{id} update
- DELETE /api/admin/products/{id} delete
- POST /api/admin/upload image upload (returns path + /api/static serving)
- PATCH /api/admin/orders/{id} status update (if orders exist)
- Authz: 401 without token, 403 with customer token

All created products are prefixed 'QA_' and cleaned up at end so the real
10-product catalog stays untouched.
"""
import io
import os
import time
import struct
import zlib

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@kenethglobal.com"
ADMIN_PASS = "Admin@Keneth2026"

PROTECTED_SLUGS = {
    "cumin-seeds", "star-anise-whole", "cloves-whole", "black-cardamom",
    "cinnamon-bark", "black-peppercorns", "medjool-dates", "ajwa-dates",
    "cashew-nuts", "pistachios",
}


def _tiny_png() -> bytes:
    """Return a minimal valid 1x1 PNG byte string."""
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00" + b"\xff\x00\x00"
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def customer_headers():
    email = f"TEST_qa_{int(time.time()*1000)}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": "Password123!", "name": "QA Customer"
    })
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def created_ids(admin_headers):
    """Track created product ids to force cleanup even if a test fails."""
    ids = []
    yield ids
    for pid in ids:
        try:
            requests.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers)
        except Exception:
            pass


# ---------------- AuthZ ----------------
class TestAuthZ:
    def test_create_without_token_401(self):
        r = requests.post(f"{BASE_URL}/api/admin/products", json={
            "name": {"en": "QA_x"}, "vertical": "masalas", "category": "whole-spices", "price_eur": 1.0,
        })
        assert r.status_code == 401, r.text

    def test_update_without_token_401(self):
        r = requests.put(f"{BASE_URL}/api/admin/products/000000000000000000000000", json={
            "name": {"en": "QA_x"}, "vertical": "masalas", "category": "whole-spices", "price_eur": 1.0,
        })
        assert r.status_code == 401

    def test_delete_without_token_401(self):
        r = requests.delete(f"{BASE_URL}/api/admin/products/000000000000000000000000")
        assert r.status_code == 401

    def test_upload_without_token_401(self):
        r = requests.post(f"{BASE_URL}/api/admin/upload", files={"file": ("t.png", _tiny_png(), "image/png")})
        assert r.status_code == 401

    def test_create_with_customer_403(self, customer_headers):
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=customer_headers, json={
            "name": {"en": "QA_x"}, "vertical": "masalas", "category": "whole-spices", "price_eur": 1.0,
        })
        assert r.status_code == 403, r.text

    def test_upload_with_customer_403(self, customer_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=customer_headers,
            files={"file": ("t.png", _tiny_png(), "image/png")},
        )
        assert r.status_code == 403


# ---------------- Image upload ----------------
class TestUpload:
    def test_upload_png_served_via_static(self, admin_headers):
        png = _tiny_png()
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=admin_headers,
            files={"file": ("qa.png", png, "image/png")},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "path" in body and body["path"].startswith("products/")
        assert body["url"].endswith(body["path"])
        # Fetch the file back
        full = f"{BASE_URL}/api/static/{body['path']}"
        g = requests.get(full)
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("image/")
        assert len(g.content) == len(png)

    def test_upload_rejects_non_image(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=admin_headers,
            files={"file": ("x.txt", b"hello", "text/plain")},
        )
        assert r.status_code == 400


# ---------------- Full CRUD ----------------
class TestProductCRUD:
    def test_create_and_get(self, admin_headers, created_ids):
        payload = {
            "name": {"en": "QA_Royal_Test_Masala"},
            "vertical": "masalas",
            "category": "QA_test_category",
            "price_eur": 12.5,
            "unit": "100g",
            "short_description": {"en": "Short QA"},
            "long_description": {"en": "Long QA story"},
            "badge": {"en": "QA"},
        }
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["slug"].startswith("qa-royal-test-masala")
        assert data["name"]["en"] == "QA_Royal_Test_Masala"
        assert data["price_eur"] == 12.5
        assert data["category"] == "QA_test_category"
        assert "_id" not in data and "id" in data
        created_ids.append(data["id"])

        # GET public endpoint - verify persistence
        g = requests.get(f"{BASE_URL}/api/products/{data['slug']}")
        assert g.status_code == 200
        assert g.json()["price_eur"] == 12.5

    def test_update_persists(self, admin_headers, created_ids):
        # Create first
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=admin_headers, json={
            "name": {"en": "QA_Update_Target"}, "vertical": "masalas",
            "category": "QA_test_category", "price_eur": 5.0,
        })
        assert r.status_code == 200
        prod = r.json()
        created_ids.append(prod["id"])
        pid, slug = prod["id"], prod["slug"]

        # Update price + description
        upd = {
            "name": {"en": "QA_Update_Target"},
            "vertical": "masalas",
            "category": "QA_test_category",
            "price_eur": 19.99,
            "long_description": {"en": "Updated long description"},
        }
        pu = requests.put(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers, json=upd)
        assert pu.status_code == 200, pu.text
        assert pu.json()["price_eur"] == 19.99

        # GET verifies persistence
        g = requests.get(f"{BASE_URL}/api/products/{slug}")
        assert g.status_code == 200
        body = g.json()
        assert body["price_eur"] == 19.99
        assert body["long_description"]["en"] == "Updated long description"

    def test_delete_returns_404_on_subsequent_get(self, admin_headers, created_ids):
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=admin_headers, json={
            "name": {"en": "QA_Delete_Me"}, "vertical": "masalas",
            "category": "QA_test_category", "price_eur": 1.0,
        })
        assert r.status_code == 200
        prod = r.json()
        pid, slug = prod["id"], prod["slug"]

        d = requests.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers)
        assert d.status_code == 200
        assert d.json().get("deleted") is True

        g = requests.get(f"{BASE_URL}/api/products/{slug}")
        assert g.status_code == 404

        # Idempotency: deleting again -> 404
        d2 = requests.delete(f"{BASE_URL}/api/admin/products/{pid}", headers=admin_headers)
        assert d2.status_code == 404

    def test_full_flow_with_uploaded_image(self, admin_headers, created_ids):
        # Upload main image
        up = requests.post(
            f"{BASE_URL}/api/admin/upload",
            headers=admin_headers,
            files={"file": ("qa.png", _tiny_png(), "image/png")},
        )
        assert up.status_code == 200
        path = up.json()["path"]

        # Create product using path
        r = requests.post(f"{BASE_URL}/api/admin/products", headers=admin_headers, json={
            "name": {"en": "QA_With_Image"}, "vertical": "masalas",
            "category": "QA_test_category", "price_eur": 7.5, "ai_image": path,
        })
        assert r.status_code == 200
        prod = r.json()
        created_ids.append(prod["id"])
        assert prod["ai_image"] == path

        # Static URL must serve bytes
        s = requests.get(f"{BASE_URL}/api/static/{path}")
        assert s.status_code == 200
        assert s.headers.get("content-type", "").startswith("image/")

    def test_delete_invalid_id_400(self, admin_headers):
        r = requests.delete(f"{BASE_URL}/api/admin/products/not-a-valid-id", headers=admin_headers)
        assert r.status_code == 400


# ---------------- Order status (best-effort) ----------------
class TestOrderStatus:
    def test_patch_order_status_if_any_exists(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        orders = r.json()
        if not orders:
            pytest.skip("No orders to patch")
        oid = orders[0]["id"]
        prev = orders[0]["status"]
        new = "shipped" if prev != "shipped" else "delivered"
        p = requests.patch(f"{BASE_URL}/api/admin/orders/{oid}", headers=admin_headers, json={"status": new})
        assert p.status_code == 200
        assert p.json()["status"] == new
        # Revert
        requests.patch(f"{BASE_URL}/api/admin/orders/{oid}", headers=admin_headers, json={"status": prev})


# ---------------- Safety: do not touch protected catalog ----------------
class TestCatalogIntegrity:
    def test_protected_slugs_still_present(self):
        r = requests.get(f"{BASE_URL}/api/products?limit=500")
        assert r.status_code == 200
        slugs = {p["slug"] for p in r.json()}
        missing = PROTECTED_SLUGS - slugs
        assert not missing, f"Protected slugs disappeared: {missing}"

"""Regression checks for Emergent-removal + direct Stripe migration (public endpoint tests)."""
import os
from pathlib import Path

import pytest
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


ADMIN_EMAIL = "admin@kenethglobal.com"
ADMIN_PASS = "Admin@Keneth2026"


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def admin_headers(api_client):
    login = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
    )
    if login.status_code != 200:
        pytest.skip(f"Admin login failed: {login.status_code} {login.text}")
    return {"Authorization": f"Bearer {login.json()['token']}"}


class TestDependencyAndRouteRemoval:
    """Migration verification: no Emergent runtime dependencies/routes."""

    def test_no_emergent_runtime_dependencies_in_manifests(self):
        backend_req = Path("/app/backend/requirements.txt").read_text().lower()
        frontend_pkg = Path("/app/frontend/package.json").read_text().lower()
        frontend_craco = Path("/app/frontend/craco.config.js").read_text().lower()
        index_html = Path("/app/frontend/public/index.html").read_text().lower()

        assert "emergentintegrations" not in backend_req
        assert "@emergentbase" not in frontend_pkg
        assert "@emergentbase" not in frontend_craco
        assert "emergent" not in index_html

    def test_removed_generation_routes_return_404(self, api_client, admin_headers):
        removed_calls = [
            ("post", f"{BASE_URL}/api/gallery/generate", {}),
            ("post", f"{BASE_URL}/api/admin/products/000000000000000000000000/regenerate-image", {}),
            ("post", f"{BASE_URL}/api/generate-image", {}),
        ]
        for method, url, payload in removed_calls:
            r = getattr(api_client, method)(url, json=payload, headers=admin_headers)
            assert r.status_code == 404, f"expected 404 for removed route {url}, got {r.status_code}"


class TestStorefrontAndCheckoutBlocker:
    """Public flow checks against configured preview URL."""

    def test_catalog_and_health_basics(self, api_client):
        health = api_client.get(f"{BASE_URL}/api/health")
        assert health.status_code == 200
        assert health.json().get("db") is True

        products = api_client.get(f"{BASE_URL}/api/products")
        assert products.status_code == 200
        data = products.json()
        assert len(data) == 21
        assert all("ai_image" in p for p in data)

    def test_certification_pdfs_are_served_as_real_pdf_bytes(self, api_client):
        for path in ["/certificates/iec.pdf", "/certificates/fssai.pdf"]:
            r = api_client.get(f"{BASE_URL}{path}")
            assert r.status_code == 200, path
            assert "application/pdf" in r.headers.get("content-type", "").lower(), path
            assert r.content.startswith(b"%PDF"), path

    def test_checkout_returns_503_without_valid_stripe_config_and_no_false_success(self, api_client, admin_headers):
        before = api_client.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        assert before.status_code == 200
        before_count = len(before.json())

        payload = {
            "items": [{"slug": "royal-garam-masala", "quantity": 1}],
            "origin_url": "https://evil.example",
            "email": "guest@example.com",
        }
        checkout = api_client.post(f"{BASE_URL}/api/checkout/session", json=payload)
        assert checkout.status_code == 503
        body = checkout.json()
        detail = body.get("detail", "")
        assert "Payments are unavailable" in detail
        assert "checkout_url" not in body and "session_id" not in body

        after = api_client.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        assert after.status_code == 200
        assert len(after.json()) == before_count

    def test_status_unknown_session_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/checkout/status/session-does-not-exist")
        assert r.status_code == 404

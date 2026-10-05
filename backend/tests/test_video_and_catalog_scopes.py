"""Video settings API and catalog scope regression tests for homepage/shop changes."""
import os
import requests
import pytest


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
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
def admin_token(api_client):
    r = api_client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json().get("token")


@pytest.fixture(scope="session")
def customer_token(api_client):
    email = "TEST_video_customer_scope@example.com"
    password = "Password123!"
    register = api_client.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": password, "name": "TEST Video Customer"},
    )
    if register.status_code not in (200, 400):
        pytest.skip(f"Could not prepare customer user: {register.status_code} {register.text}")
    login = api_client.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if login.status_code != 200:
        pytest.skip(f"Customer login failed: {login.status_code} {login.text}")
    return login.json().get("token")


@pytest.fixture(scope="module", autouse=True)
def restore_about_video(api_client, admin_token):
    """Capture and restore original about-video setting after this module."""
    before = api_client.get(f"{BASE_URL}/api/site/about-video")
    original = before.json() if before.status_code == 200 else {"url": None, "kind": None}
    yield
    headers = {"Authorization": f"Bearer {admin_token}"}
    if original.get("url"):
        api_client.put(f"{BASE_URL}/api/site/about-video", json={"url": original["url"]}, headers=headers)
    else:
        api_client.delete(f"{BASE_URL}/api/site/about-video", headers=headers)


# Video settings API coverage
class TestAboutVideoSettings:
    """/api/site/about-video GET/PUT/DELETE auth, validation, canonicalization, persistence."""

    def test_get_public_and_no_object_id(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/site/about-video")
        assert r.status_code == 200
        data = r.json()
        assert "_id" not in data
        assert "url" in data and "kind" in data

    def test_put_rejects_unauthenticated(self, api_client):
        r = api_client.put(
            f"{BASE_URL}/api/site/about-video",
            json={"url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"},
        )
        assert r.status_code in (401, 403)

    def test_put_rejects_non_admin(self, api_client, customer_token):
        r = api_client.put(
            f"{BASE_URL}/api/site/about-video",
            json={"url": "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"},
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert r.status_code == 403

    def test_put_accepts_mp4_and_persists(self, api_client, admin_token):
        url = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        headers = {"Authorization": f"Bearer {admin_token}"}
        put = api_client.put(f"{BASE_URL}/api/site/about-video", json={"url": url}, headers=headers)
        assert put.status_code == 200, put.text
        data = put.json()
        assert data["url"] == url
        assert data["kind"] == "video/mp4"

        get = api_client.get(f"{BASE_URL}/api/site/about-video")
        assert get.status_code == 200
        persisted = get.json()
        assert persisted["url"] == url
        assert persisted["kind"] == "video/mp4"

    def test_put_youtube_canonical_idempotent(self, api_client, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        source = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        expected = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"

        put1 = api_client.put(f"{BASE_URL}/api/site/about-video", json={"url": source}, headers=headers)
        assert put1.status_code == 200, put1.text
        assert put1.json()["url"] == expected
        assert put1.json()["kind"] == "youtube"

        put2 = api_client.put(f"{BASE_URL}/api/site/about-video", json={"url": expected}, headers=headers)
        assert put2.status_code == 200, put2.text
        assert put2.json()["url"] == expected
        assert put2.json()["kind"] == "youtube"

    @pytest.mark.parametrize(
        "bad_url",
        [
            "javascript:alert(1)",
            "http://example.com/video.mp4",
            "https://127.0.0.1/video.mp4",
            "https://user:pass@example.com/video.mp4",
            "https://example.com:444/video.mp4",
            "https://youtube.com/watch?v=bad",
            "https://example.com/no-video-page",
            "https://localhost/video.mp4",
        ],
    )
    def test_put_rejects_invalid_urls(self, api_client, admin_token, bad_url):
        r = api_client.put(
            f"{BASE_URL}/api/site/about-video",
            json={"url": bad_url},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 422, f"URL should be rejected: {bad_url} -> {r.status_code} {r.text}"

    def test_delete_requires_admin(self, api_client, customer_token):
        r = api_client.delete(
            f"{BASE_URL}/api/site/about-video",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert r.status_code == 403


# Catalog scope coverage backing house routes/filters
class TestCatalogHouseScopes:
    """Ensure house/category filtering is strict for route-driven pages and tabs."""

    @pytest.mark.parametrize(
        "vertical,expected",
        [
            ("masalas", 6),
            ("home-furnishing", 6),
            ("artificial-jewelry", 5),
            ("christmas-decor", 4),
        ],
    )
    def test_vertical_counts(self, api_client, vertical, expected):
        r = api_client.get(f"{BASE_URL}/api/products", params={"vertical": vertical})
        assert r.status_code == 200
        data = r.json()
        assert len(data) == expected
        assert all(p["vertical"] == vertical for p in data)

    def test_cross_house_category_has_no_leaks(self, api_client):
        r = api_client.get(
            f"{BASE_URL}/api/products",
            params={"vertical": "masalas", "category": "necklaces"},
        )
        assert r.status_code == 200
        assert r.json() == []

    def test_global_products_total(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        assert len(r.json()) == 21

"""Verify 13 newly added products are visible, active, imaged, and categorized."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://keneth-prod-check.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

NEW_PRODUCTS = {
    "oxidised-silver-jhumka": ("artificial-jewelry", "earrings"),
    "beaded-choker-set": ("artificial-jewelry", "necklaces"),
    "pure-leather-wallet": ("artificial-jewelry", "leather-accessories"),
    "felt-christmas-ornament-set": ("christmas-decor", "ornaments"),
    "jute-ball-ornaments": ("christmas-decor", "ornaments"),
    "velvet-embroidered-stocking": ("christmas-decor", "stockings"),
    "beaded-christmas-placemats": ("christmas-decor", "placemats"),
    "embroidered-velvet-tree-skirt": ("christmas-decor", "tree-skirts"),
    "brass-votive-holder": ("home-furnishing", "candle-holders"),
    "figurine-napkin-rings": ("home-furnishing", "napkin-rings"),
    "carved-brass-napkin-rings": ("home-furnishing", "napkin-rings"),
    "wire-mesh-napkin-rings": ("home-furnishing", "napkin-rings"),
    "zari-work-wall-hanging": ("home-furnishing", None),  # category unknown, just check vertical
}


@pytest.fixture(scope="module")
def all_products():
    r = requests.get(f"{API}/products", timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    # /api/products may return list or dict
    if isinstance(data, dict) and "products" in data:
        return data["products"]
    return data


def test_total_product_count_is_44(all_products):
    assert len(all_products) == 44, f"Expected 44 products, got {len(all_products)}"


def test_all_13_new_slugs_present(all_products):
    slugs = {p["slug"] for p in all_products}
    missing = [s for s in NEW_PRODUCTS if s not in slugs]
    assert not missing, f"Missing new slugs: {missing}"


@pytest.mark.parametrize("slug,expected", list(NEW_PRODUCTS.items()))
def test_new_product_detail_and_images(slug, expected):
    expected_vertical, expected_category = expected
    r = requests.get(f"{API}/products/{slug}", timeout=30)
    assert r.status_code == 200, f"{slug}: {r.status_code} {r.text}"
    p = r.json()
    assert p["slug"] == slug
    assert p.get("vertical") == expected_vertical, f"{slug} vertical={p.get('vertical')}"
    if expected_category:
        assert p.get("category") == expected_category, f"{slug} category={p.get('category')}"
    # Price present and > 0
    assert float(p.get("price_eur", 0)) > 0
    # ai_image set
    ai_image = p.get("ai_image")
    assert ai_image, f"{slug} missing ai_image"
    # Fetch the image bytes
    img_url = f"{API}/static/{ai_image}" if not ai_image.startswith("http") else ai_image
    img = requests.get(img_url, timeout=30)
    assert img.status_code == 200, f"{slug} image {img_url} -> {img.status_code}"
    assert img.headers.get("content-type", "").startswith("image/"), f"{slug} content-type={img.headers.get('content-type')}"
    # Gallery
    gallery = p.get("gallery_images") or []
    assert len(gallery) >= 1, f"{slug} has no gallery_images"
    # Verify first gallery image loads
    g0 = gallery[0]
    g_url = f"{API}/static/{g0}" if not g0.startswith("http") else g0
    gi = requests.get(g_url, timeout=30)
    assert gi.status_code == 200, f"{slug} gallery0 {g_url} -> {gi.status_code}"
    assert gi.headers.get("content-type", "").startswith("image/")


def test_vertical_filter_christmas_decor(all_products):
    r = requests.get(f"{API}/products", params={"vertical": "christmas-decor"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    items = data["products"] if isinstance(data, dict) and "products" in data else data
    slugs = {p["slug"] for p in items}
    for s in ["felt-christmas-ornament-set", "jute-ball-ornaments", "velvet-embroidered-stocking",
              "beaded-christmas-placemats", "embroidered-velvet-tree-skirt"]:
        assert s in slugs, f"{s} missing from christmas-decor filter"
    cats = {p.get("category") for p in items}
    assert "tree-skirts" in cats
    assert "placemats" in cats


def test_vertical_filter_home_furnishing(all_products):
    r = requests.get(f"{API}/products", params={"vertical": "home-furnishing"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    items = data["products"] if isinstance(data, dict) and "products" in data else data
    slugs = {p["slug"] for p in items}
    for s in ["brass-votive-holder", "figurine-napkin-rings", "carved-brass-napkin-rings",
              "wire-mesh-napkin-rings", "zari-work-wall-hanging"]:
        assert s in slugs, f"{s} missing from home-furnishing filter"
    cats = {p.get("category") for p in items}
    assert "napkin-rings" in cats
    assert "candle-holders" in cats


def test_vertical_filter_artificial_jewelry(all_products):
    r = requests.get(f"{API}/products", params={"vertical": "artificial-jewelry"}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    items = data["products"] if isinstance(data, dict) and "products" in data else data
    slugs = {p["slug"] for p in items}
    for s in ["oxidised-silver-jhumka", "beaded-choker-set", "pure-leather-wallet"]:
        assert s in slugs
    cats = {p.get("category") for p in items}
    assert "earrings" in cats
    assert "necklaces" in cats
    assert "leather-accessories" in cats


def test_regression_original_products_intact(all_products):
    slugs = {p["slug"] for p in all_products}
    originals = ["royal-garam-masala", "black-cardamom", "cinnamon-bark", "black-peppercorns",
                 "medjool-dates", "ajwa-dates", "cashew-nuts", "pistachios"]
    for s in originals:
        assert s in slugs, f"Original product {s} missing"

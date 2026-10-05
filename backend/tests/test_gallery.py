"""Backend tests for /api/gallery endpoint and static media serving."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://deploy-now-163.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def gallery_items():
    r = requests.get(f"{BASE_URL}/api/gallery", timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


def test_gallery_list_shape(gallery_items):
    assert isinstance(gallery_items, list)
    assert len(gallery_items) == 28
    for item in gallery_items:
        assert "type" in item and "src" in item
        assert item["type"] in ("image", "video")
        assert item["src"].startswith("gallery/")


def test_gallery_counts(gallery_items):
    images = [i for i in gallery_items if i["type"] == "image"]
    videos = [i for i in gallery_items if i["type"] == "video"]
    assert len(images) == 27
    assert len(videos) == 1


def test_image_served_with_image_content_type(gallery_items):
    img = next(i for i in gallery_items if i["type"] == "image")
    r = requests.head(f"{BASE_URL}/api/static/{img['src']}", timeout=20)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/")


def test_video_served_with_video_content_type(gallery_items):
    vid = next(i for i in gallery_items if i["type"] == "video")
    r = requests.head(f"{BASE_URL}/api/static/{vid['src']}", timeout=20)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("video/")


def test_all_media_fetchable(gallery_items):
    missing = []
    for i in gallery_items:
        r = requests.head(f"{BASE_URL}/api/static/{i['src']}", timeout=20)
        if r.status_code != 200:
            missing.append((i["src"], r.status_code))
    assert not missing, f"Missing media: {missing}"

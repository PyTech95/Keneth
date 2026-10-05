"""Reconcile bundled product photos and journal covers without external services."""
import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)
STATIC_DIR = Path(__file__).parent / "static" / "products"


async def reconcile_static_images(db):
    files = sorted(p.name for p in STATIC_DIR.glob("*.png"))
    if not files:
        logger.warning("No bundled catalog images found in static/products")
        return
    products = await db.products.find({}, {"_id": 0, "slug": 1, "ai_image": 1, "gallery_images": 1}).to_list(length=None)
    for product in products:
        slug = product.get("slug")
        if not slug:
            continue
        updates = {}
        main_pattern = re.compile(rf"^{re.escape(slug)}-[0-9a-f]{{6,}}\.png$")
        gallery_pattern = re.compile(rf"^{re.escape(slug)}-g\d+-[0-9a-f]{{6,}}\.png$")
        # Keep the existing field name to preserve API/cart compatibility.
        if not product.get("ai_image"):
            main = next((name for name in files if main_pattern.match(name)), None)
            if main:
                updates["ai_image"] = f"products/{main}"
        if not product.get("gallery_images"):
            gallery = [f"products/{name}" for name in files if gallery_pattern.match(name)]
            if gallery:
                updates["gallery_images"] = gallery
        if updates:
            await db.products.update_one({"slug": slug}, {"$set": updates})
    posts = await db.journal.find({}, {"_id": 0, "slug": 1, "cover_image": 1}).to_list(length=None)
    for post in posts:
        if post.get("cover_image") or not post.get("slug"):
            continue
        pattern = re.compile(rf"^journal-{re.escape(post['slug'])}-[0-9a-f]{{6,}}\.png$")
        cover = next((name for name in files if pattern.match(name)), None)
        if cover:
            await db.journal.update_one({"slug": post["slug"]}, {"$set": {"cover_image": f"products/{cover}"}})
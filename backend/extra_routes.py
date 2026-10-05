"""Additional backend routes: wishlist, journal, product gallery."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from bson import ObjectId

from auth_utils import get_current_user, require_admin
from seed_journal import JOURNAL

extra_router = APIRouter(prefix="/api")


def _get_db():
    from server import db
    return db


# ================== WISHLIST ==================
@extra_router.get("/wishlist")
async def get_wishlist(user=Depends(get_current_user)):
    db = _get_db()
    doc = await db.wishlists.find_one({"user_id": user["id"]})
    slugs = doc.get("slugs", []) if doc else []
    if not slugs:
        return []
    products = await db.products.find({"slug": {"$in": slugs}, "active": {"$ne": False}}).to_list(length=200)
    out = []
    for p in products:
        p["id"] = str(p.pop("_id"))
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
        out.append(p)
    return out


class WishlistPayload(BaseModel):
    slug: str


@extra_router.post("/wishlist")
async def add_wishlist(payload: WishlistPayload, user=Depends(get_current_user)):
    db = _get_db()
    prod = await db.products.find_one({"slug": payload.slug})
    if not prod:
        raise HTTPException(404, "Product not found")
    await db.wishlists.update_one(
        {"user_id": user["id"]},
        {"$addToSet": {"slugs": payload.slug}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"status": "ok"}


@extra_router.delete("/wishlist/{slug}")
async def remove_wishlist(slug: str, user=Depends(get_current_user)):
    db = _get_db()
    await db.wishlists.update_one(
        {"user_id": user["id"]},
        {"$pull": {"slugs": slug}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return {"status": "ok"}


class WishlistSync(BaseModel):
    slugs: list[str]


@extra_router.post("/wishlist/sync")
async def sync_wishlist(payload: WishlistSync, user=Depends(get_current_user)):
    """Merge a guest wishlist (from localStorage) into the user's persisted list."""
    db = _get_db()
    await db.wishlists.update_one(
        {"user_id": user["id"]},
        {"$addToSet": {"slugs": {"$each": payload.slugs}}, "$set": {"updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"status": "ok"}


# ================== JOURNAL ==================
@extra_router.get("/journal")
async def list_journal():
    db = _get_db()
    docs = await db.journal.find({"published": True}).sort("date", -1).to_list(length=100)
    out = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("body", None)  # excerpt list only
        out.append(d)
    return out


@extra_router.get("/journal/{slug}")
async def get_journal_post(slug: str):
    db = _get_db()
    doc = await db.journal.find_one({"slug": slug, "published": True})
    if not doc:
        raise HTTPException(404, "Post not found")
    doc["id"] = str(doc.pop("_id"))
    return doc


# ================== WHOLESALE ENQUIRY ==================
class WholesaleEnquiryIn(BaseModel):
    company: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    country: str
    interest: str  # 'spices' | 'home-decor' | 'jewelry' | 'all'
    volume: str    # '25-100kg' | '100-500kg' | '500kg+' | 'custom'
    message: Optional[str] = ""


@extra_router.post("/wholesale/enquiry")
async def submit_wholesale(payload: WholesaleEnquiryIn):
    db = _get_db()
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["status"] = "new"
    res = await db.wholesale_enquiries.insert_one(doc)
    return {"status": "received", "id": str(res.inserted_id)}


@extra_router.get("/admin/wholesale")
async def list_wholesale(admin=Depends(require_admin)):
    db = _get_db()
    docs = await db.wholesale_enquiries.find().sort("created_at", -1).limit(500).to_list(length=500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


# ================== PRODUCT B2B / BULK WORK ORDER ==================
class BulkEnquiryIn(BaseModel):
    name: str
    phone: str
    quantity: str
    product_slug: Optional[str] = None
    product_name: Optional[str] = None
    email: Optional[str] = ""
    message: Optional[str] = ""


@extra_router.post("/product/enquiry")
async def submit_bulk_enquiry(payload: BulkEnquiryIn):
    """Lightweight B2B / bulk work-order request from a product page."""
    db = _get_db()
    doc = payload.model_dump()
    doc["name"] = (doc.get("name") or "").strip()[:120]
    doc["phone"] = (doc.get("phone") or "").strip()[:40]
    doc["quantity"] = (doc.get("quantity") or "").strip()[:60]
    doc["message"] = (doc.get("message") or "").strip()[:1000]
    if not doc["name"] or not doc["phone"] or not doc["quantity"]:
        raise HTTPException(400, "Name, phone and quantity are required")
    doc["created_at"] = datetime.now(timezone.utc)
    doc["status"] = "new"
    res = await db.bulk_enquiries.insert_one(doc)
    return {"status": "received", "id": str(res.inserted_id)}


@extra_router.get("/admin/bulk-enquiries")
async def list_bulk_enquiries(admin=Depends(require_admin)):
    db = _get_db()
    docs = await db.bulk_enquiries.find().sort("created_at", -1).limit(500).to_list(length=500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        if isinstance(d.get("created_at"), datetime):
            d["created_at"] = d["created_at"].isoformat()
    return docs


# ================== SEED JOURNAL ==================
async def seed_journal(db):
    now = datetime.now(timezone.utc)
    for post in JOURNAL:
        existing = await db.journal.find_one({"slug": post["slug"]})
        doc = {**post, "published": True, "updated_at": now}
        if existing is None:
            doc["created_at"] = now
            doc["cover_image"] = ""
            await db.journal.insert_one(doc)
        else:
            await db.journal.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "title": post["title"],
                    "excerpt": post["excerpt"],
                    "category": post["category"],
                    "read_time": post["read_time"],
                    "author": post["author"],
                    "date": post["date"],
                    "cover_prompt": post["cover_prompt"],
                    "cover_hint": post["cover_hint"],
                    "body": post["body"],
                    "updated_at": now,
                }},
            )

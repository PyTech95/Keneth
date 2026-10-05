"""Keneth Global — FastAPI backend.
E-commerce API: products, orders, direct Stripe checkout, auth and admin.
"""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    require_admin,
    seed_admin,
    _sanitize_user,
)
from seed_catalog import CATALOG
from uploaded_catalog import REMOVED_SLUGS
from static_catalog import reconcile_static_images
from extra_routes import extra_router, seed_journal
from video_settings import video_router
from payments import payment_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ---------------- Mongo ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------- FastAPI ----------------
app = FastAPI(title="Keneth Global API")
api = APIRouter(prefix="/api")

# Serve generated product images under /api/static/*
STATIC_ROOT = ROOT_DIR / "static"
STATIC_ROOT.mkdir(exist_ok=True)
app.mount("/api/static", StaticFiles(directory=str(STATIC_ROOT)), name="static")


# ================== HELPERS ==================
def doc_to_product(doc: dict) -> dict:
    """Convert mongo product doc to API-serializable dict."""
    d = dict(doc)
    d["id"] = str(d.pop("_id"))
    if isinstance(d.get("created_at"), datetime):
        d["created_at"] = d["created_at"].isoformat()
    return d


def doc_to_order(doc: dict) -> dict:
    d = dict(doc)
    d["id"] = str(d.pop("_id"))
    for k in ("created_at", "updated_at"):
        if isinstance(d.get(k), datetime):
            d[k] = d[k].isoformat()
    return d


# ================== AUTH ==================
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": "customer",
        "created_at": datetime.now(timezone.utc),
    }
    res = await db.users.insert_one(doc)
    user_id = str(res.inserted_id)
    token = create_access_token(user_id, email, "customer")
    doc["_id"] = res.inserted_id
    return {"token": token, "user": _sanitize_user(doc)}


@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email, user.get("role", "customer"))
    return {"token": token, "user": _sanitize_user(user)}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ================== PRODUCTS ==================
@api.get("/products")
async def list_products(vertical: Optional[str] = None, category: Optional[str] = None, q: Optional[str] = None, limit: int = 500):
    query = {"active": {"$ne": False}}
    if vertical:
        query["vertical"] = vertical
    if category:
        query["category"] = category
    if q:
        query["$or"] = [
            {"name.en": {"$regex": q, "$options": "i"}},
            {"slug": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.products.find(query).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [doc_to_product(d) for d in docs]


@api.get("/products/verticals")
async def verticals():
    """Return counts by vertical + category."""
    pipeline = [
        {"$match": {"active": {"$ne": False}}},
        {"$group": {"_id": {"v": "$vertical", "c": "$category"}, "count": {"$sum": 1}}},
    ]
    result = await db.products.aggregate(pipeline).to_list(length=None)
    tree = {}
    for r in result:
        v = r["_id"]["v"]
        c = r["_id"]["c"]
        tree.setdefault(v, {"total": 0, "categories": {}})
        tree[v]["categories"][c] = r["count"]
        tree[v]["total"] += r["count"]
    return tree


@api.get("/products/{slug}")
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug, "active": {"$ne": False}})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc_to_product(doc)


# ================== ORDERS ==================
@api.get("/orders/mine")
async def my_orders(user=Depends(get_current_user)):
    cursor = db.orders.find({"user_id": user["id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [doc_to_order(d) for d in docs]


@api.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order id")
    doc = await db.orders.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if user.get("role") != "admin" and doc.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return doc_to_order(doc)


# ================== ADMIN ==================
@api.get("/admin/orders")
async def admin_orders(admin=Depends(require_admin)):
    cursor = db.orders.find().sort("created_at", -1).limit(200)
    docs = await cursor.to_list(length=200)
    return [doc_to_order(d) for d in docs]


@api.get("/admin/users")
async def admin_users(admin=Depends(require_admin)):
    docs = await db.users.find().sort("created_at", -1).limit(500).to_list(length=500)
    return [_sanitize_user(d) for d in docs]


@api.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    total_products = await db.products.count_documents({"active": {"$ne": False}})
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"payment_status": "paid"})
    total_users = await db.users.count_documents({})
    revenue_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    rev = await db.orders.aggregate(revenue_pipeline).to_list(length=1)
    revenue = rev[0]["total"] if rev else 0
    return {
        "products": total_products,
        "orders": total_orders,
        "paid_orders": paid_orders,
        "users": total_users,
        "revenue_eur": round(revenue, 2),
    }


class ProductPatch(BaseModel):
    price_eur: Optional[float] = None
    active: Optional[bool] = None
    badge: Optional[dict] = None


@api.patch("/admin/products/{product_id}")
async def update_product(product_id: str, patch: ProductPatch, admin=Depends(require_admin)):
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    updates = {k: v for k, v in patch.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    updates["updated_at"] = datetime.now(timezone.utc)
    await db.products.update_one({"_id": oid}, {"$set": updates})
    doc = await db.products.find_one({"_id": oid})
    return doc_to_product(doc)


# ---------- Full product CRUD (WooCommerce-style admin) ----------
import re as _re
import uuid as _uuid


def _slugify(text: str) -> str:
    s = _re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s or f"product-{_uuid.uuid4().hex[:6]}"


class ProductUpsert(BaseModel):
    slug: Optional[str] = None
    name: dict
    vertical: str
    category: str
    price_eur: float = Field(ge=0)
    unit: Optional[str] = ""
    short_description: Optional[dict] = None
    long_description: Optional[dict] = None
    badge: Optional[dict] = None
    ai_image: Optional[str] = ""
    gallery_images: Optional[List[str]] = None
    image_hint: Optional[str] = ""
    active: Optional[bool] = True


@api.post("/admin/products")
async def create_product(payload: ProductUpsert, admin=Depends(require_admin)):
    if not payload.name.get("en"):
        raise HTTPException(status_code=400, detail="English name is required")
    slug = _slugify(payload.slug or payload.name.get("en"))
    if await db.products.find_one({"slug": slug}):
        slug = f"{slug}-{_uuid.uuid4().hex[:4]}"
    now = datetime.now(timezone.utc)
    doc = {
        "slug": slug,
        "name": payload.name,
        "vertical": payload.vertical,
        "category": payload.category,
        "price_eur": payload.price_eur,
        "unit": payload.unit or "",
        "short_description": payload.short_description or {"en": ""},
        "long_description": payload.long_description or {"en": ""},
        "badge": payload.badge or None,
        "ai_image": payload.ai_image or "",
        "gallery_images": payload.gallery_images or [],
        "image_hint": payload.image_hint or "",
        "active": payload.active if payload.active is not None else True,
        "created_at": now,
        "updated_at": now,
    }
    res = await db.products.insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc_to_product(doc)


@api.put("/admin/products/{product_id}")
async def replace_product(product_id: str, payload: ProductUpsert, admin=Depends(require_admin)):
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    existing = await db.products.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    updates = {
        "name": payload.name,
        "vertical": payload.vertical,
        "category": payload.category,
        "price_eur": payload.price_eur,
        "unit": payload.unit or "",
        "short_description": payload.short_description or {"en": ""},
        "long_description": payload.long_description or {"en": ""},
        "badge": payload.badge or None,
        "ai_image": payload.ai_image or "",
        "gallery_images": payload.gallery_images or [],
        "image_hint": payload.image_hint or "",
        "active": payload.active if payload.active is not None else True,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.slug:
        new_slug = _slugify(payload.slug)
        clash = await db.products.find_one({"slug": new_slug, "_id": {"$ne": oid}})
        if not clash:
            updates["slug"] = new_slug
    await db.products.update_one({"_id": oid}, {"$set": updates})
    doc = await db.products.find_one({"_id": oid})
    return doc_to_product(doc)


@api.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(require_admin)):
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.products.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": True}


_ALLOWED_IMG = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


@api.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin=Depends(require_admin)):
    if file.content_type not in _ALLOWED_IMG:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be 8MB or smaller")
    products_dir = STATIC_ROOT / "products"
    products_dir.mkdir(parents=True, exist_ok=True)
    fname = f"upload-{_uuid.uuid4().hex[:12]}{_EXT[file.content_type]}"
    (products_dir / fname).write_bytes(data)
    rel = f"products/{fname}"
    return {"path": rel, "url": f"/api/static/{rel}"}


class OrderStatusPatch(BaseModel):
    status: str  # 'shipped' | 'delivered' | 'cancelled'


@api.patch("/admin/orders/{order_id}")
async def update_order(order_id: str, patch: OrderStatusPatch, admin=Depends(require_admin)):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    if patch.status not in {"initiated", "completed", "shipped", "delivered", "cancelled", "failed"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.orders.update_one(
        {"_id": oid},
        {"$set": {"status": patch.status, "updated_at": datetime.now(timezone.utc)}},
    )
    doc = await db.orders.find_one({"_id": oid})
    return doc_to_order(doc)


# ================== SEED ==================
async def seed_catalog(db):
    now = datetime.now(timezone.utc)
    for item in CATALOG:
        existing = await db.products.find_one({"slug": item["slug"]})
        base_doc = {
            **item,
            "active": True,
            "updated_at": now,
        }
        if existing is None:
            base_doc["created_at"] = now
            base_doc["ai_image"] = ""
            await db.products.insert_one(base_doc)
        else:
            # only update non-image editorial fields on re-seed
            await db.products.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "name": item["name"],
                    "short_description": item["short_description"],
                    "long_description": item["long_description"],
                    "price_eur": item["price_eur"],
                    "unit": item["unit"],
                    "vertical": item["vertical"],
                    "category": item["category"],
                    "image_prompt": item["image_prompt"],
                    "image_hint": item.get("image_hint", ""),
                    "badge": item.get("badge"),
                    "updated_at": now,
                }},
            )


# ================== STARTUP ==================
@app.on_event("startup")
async def on_startup():
    logger.info("Starting Keneth Global API...")
    # indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("vertical")
    await db.orders.create_index("session_id", unique=True)
    await db.orders.create_index("user_id")
    # seed
    await seed_admin(db)
    await seed_catalog(db)
    # Drop old grouped listings now replaced by individual uploaded products.
    if REMOVED_SLUGS:
        await db.products.delete_many({"slug": {"$in": REMOVED_SLUGS}})
    await seed_journal(db)
    # Restore bundled photo paths on a fresh database; no generation or network calls.
    await reconcile_static_images(db)
    logger.info("Seed + image reconcile complete.")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


@api.get("/")
async def root():
    return {"status": "ok", "app": "Keneth Global API"}


@api.get("/health")
async def health():
    try:
        await db.command("ping")
        db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok" if db_ok else "degraded", "db": db_ok}


# Register routes
app.include_router(api)
app.include_router(extra_router)
app.include_router(video_router)
app.include_router(payment_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=[origin.strip() for origin in os.environ["CORS_ORIGINS"].split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

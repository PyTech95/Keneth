"""Hosted checkout and signed payment events using the official Stripe SDK."""
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from auth_utils import get_optional_user
from payment_gateway import euro_cents, public_origin, stripe_client, webhook_secret

payment_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def get_db():
    from server import db
    return db


class CartItemIn(BaseModel):
    slug: str
    quantity: int = Field(ge=1, le=50)


class CheckoutIn(BaseModel):
    items: list[CartItemIn] = Field(max_length=100)
    origin_url: Optional[str] = None  # Accepted for older clients, never used for redirects.
    email: Optional[EmailStr] = None
    gift_wrap: bool = False
    gift_message: Optional[str] = Field(default=None, max_length=500)


class CheckoutOut(BaseModel):
    checkout_url: str
    session_id: str


class PaymentStatusOut(BaseModel):
    session_id: str
    status: str
    payment_status: str
    amount: float
    currency: str


@payment_router.post("/checkout/session", response_model=CheckoutOut)
async def create_checkout(payload: CheckoutIn, user=Depends(get_optional_user)):
    if not payload.items:
        raise HTTPException(400, "Cart is empty")
    db = get_db()
    lines, order_items, total_cents = [], [], 0
    for item in payload.items:
        product = await db.products.find_one({"slug": item.slug, "active": {"$ne": False}})
        if not product:
            raise HTTPException(400, f"Product not found: {item.slug}")
        price = euro_cents(product["price_eur"])
        total_cents += price * item.quantity
        lines.append({"price_data": {"currency": "eur", "unit_amount": price, "product_data": {"name": product["name"]["en"]}}, "quantity": item.quantity})
        order_items.append({"slug": item.slug, "product_id": str(product["_id"]), "name_en": product["name"]["en"], "quantity": item.quantity, "unit_price": price / 100, "line_total": price * item.quantity / 100})
    subtotal_cents = total_cents
    shipping_cents = 0 if subtotal_cents >= 12000 else 1200
    if shipping_cents:
        total_cents += shipping_cents
        lines.append({"price_data": {"currency": "eur", "unit_amount": shipping_cents, "product_data": {"name": "Delivery"}}, "quantity": 1})
    if payload.gift_wrap:
        total_cents += 500
        lines.append({"price_data": {"currency": "eur", "unit_amount": 500, "product_data": {"name": "Premium gift wrap"}}, "quantity": 1})
    if total_cents < 50:
        raise HTTPException(400, "The order total must be at least €0.50")
    client = stripe_client()
    webhook_secret()  # Never accept a payment without a configured signed-event handler.
    origin = public_origin()
    reference = uuid4().hex
    email = user["email"] if user else payload.email
    params = {
        "mode": "payment", "payment_method_types": ["card"], "line_items": lines,
        "success_url": f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{origin}/payment/cancel", "client_reference_id": reference,
        "metadata": {"application": "keneth-store", "order_ref": reference, "user_id": user["id"] if user else "guest", "gift_wrap": str(payload.gift_wrap)},
    }
    if email:
        params["customer_email"] = str(email)
    try:
        session = await client.v1.checkout.sessions.create_async(params, {"idempotency_key": f"checkout-{reference}"})
    except stripe.StripeError:
        logger.warning("Stripe checkout request failed")
        raise HTTPException(502, "Unable to start payment. Please try again later.")
    now = datetime.now(timezone.utc)
    await db.orders.insert_one({
        "session_id": session.id, "order_ref": reference, "user_id": user["id"] if user else None,
        "email": str(email or ""), "items": order_items, "amount": total_cents / 100,
        "amount_cents": total_cents, "subtotal_cents": subtotal_cents, "shipping_cents": shipping_cents,
        "currency": "eur", "status": "initiated", "payment_status": "pending",
        "gift_wrap": payload.gift_wrap, "gift_message": (payload.gift_message or "").strip(),
        "created_at": now, "updated_at": now,
    })
    return CheckoutOut(checkout_url=session.url, session_id=session.id)


def validate_session(order, session):
    expected = order.get("amount_cents")
    if expected is None:
        expected = euro_cents(order["amount"])
    if session.get("amount_total") != expected or session.get("currency") != order["currency"]:
        raise HTTPException(400, "Payment amount or currency does not match the order")
    if order.get("order_ref") and session.get("metadata", {}).get("order_ref") != order["order_ref"]:
        raise HTTPException(400, "Payment reference does not match the order")


@payment_router.get("/checkout/status/{session_id}", response_model=PaymentStatusOut)
async def checkout_status(session_id: str):
    order = await get_db().orders.find_one({"session_id": session_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if order.get("payment_status") != "paid":
        client = stripe_client()
        try:
            session = await client.v1.checkout.sessions.retrieve_async(session_id)
        except stripe.StripeError:
            raise HTTPException(502, "Payment status is temporarily unavailable")
        validate_session(order, session)
        # Paid state comes only from a signature-verified webhook, never the redirect.
        order = await get_db().orders.find_one({"session_id": session_id}, {"_id": 0})
    return PaymentStatusOut(**{k: order[k] for k in PaymentStatusOut.model_fields})


@payment_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    signature = request.headers.get("Stripe-Signature")
    if not signature:
        raise HTTPException(400, "Missing Stripe signature")
    secret = webhook_secret()
    try:
        event = stripe.Webhook.construct_event(await request.body(), signature, secret)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(400, "Invalid webhook signature or payload")
    supported = {"checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"}
    if event["type"] not in supported:
        return {"status": "ok"}
    db = get_db()
    if await db.stripe_events.find_one({"_id": event["id"]}, {"_id": 0, "processed_at": 1}):
        return {"status": "ok"}
    session = event["data"]["object"]
    order = await db.orders.find_one({"session_id": session["id"]}, {"_id": 0})
    if not order:
        if session.get("metadata", {}).get("application") == "keneth-store":
            raise HTTPException(503, "Order is not yet available; retry this event")
        return {"status": "ok"}
    validate_session(order, session)
    updates = None
    if event["type"] in {"checkout.session.completed", "checkout.session.async_payment_succeeded"} and session.get("payment_status") == "paid":
        updates = {"status": "completed", "payment_status": "paid", "stripe_payment_intent": session.get("payment_intent")}
    elif event["type"] == "checkout.session.async_payment_failed":
        updates = {"status": "failed", "payment_status": "failed"}
    elif event["type"] == "checkout.session.expired":
        updates = {"status": "cancelled", "payment_status": "unpaid"}
    if updates:
        await db.orders.update_one({"session_id": session["id"], "payment_status": {"$ne": "paid"}}, {"$set": {**updates, "updated_at": datetime.now(timezone.utc)}})
    # Record only AFTER mutation so failed DB writes can safely be retried.
    await db.stripe_events.update_one({"_id": event["id"]}, {"$set": {"processed_at": datetime.now(timezone.utc)}}, upsert=True)
    return {"status": "ok"}
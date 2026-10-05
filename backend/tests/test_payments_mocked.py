"""MOCKED unit/integration tests for Stripe payment routes and signature handling."""
import hashlib
import hmac
import json
import sys
import time
from datetime import datetime, timezone
from types import SimpleNamespace
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import payment_gateway
import payments


def _sign(payload_bytes: bytes, secret: str, timestamp: int | None = None) -> str:
    ts = int(time.time()) if timestamp is None else int(timestamp)
    digest = hmac.new(secret.encode(), f"{ts}.".encode() + payload_bytes, hashlib.sha256).hexdigest()
    return f"t={ts},v1={digest}"


class FakeProducts:
    def __init__(self):
        self.by_slug = {
            "royal-garam-masala": {
                "_id": "prod_1",
                "slug": "royal-garam-masala",
                "name": {"en": "Royal Garam Masala"},
                "price_eur": 8.90,
                "active": True,
            }
        }

    async def find_one(self, query):
        doc = self.by_slug.get(query.get("slug"))
        if not doc:
            return None
        if query.get("active") == {"$ne": False} and doc.get("active") is False:
            return None
        return dict(doc)


class FakeOrders:
    def __init__(self):
        self.by_session = {}

    async def insert_one(self, doc):
        self.by_session[doc["session_id"]] = dict(doc)
        return SimpleNamespace(inserted_id=doc["session_id"])

    async def find_one(self, query, projection=None):
        session_id = query.get("session_id")
        doc = self.by_session.get(session_id)
        if not doc:
            return None
        return {k: v for k, v in doc.items() if projection is None or projection.get(k, 1) != 0}

    async def update_one(self, query, update, upsert=False):
        session_id = query.get("session_id")
        doc = self.by_session.get(session_id)
        if not doc:
            return SimpleNamespace(modified_count=0)
        status_guard = query.get("payment_status", {}).get("$ne")
        if status_guard is not None and doc.get("payment_status") == status_guard:
            return SimpleNamespace(modified_count=0)
        for k, v in update.get("$set", {}).items():
            doc[k] = v
        return SimpleNamespace(modified_count=1)


class FakeStripeEvents:
    def __init__(self):
        self.events = {}

    async def find_one(self, query, projection=None):
        ev = self.events.get(query.get("_id"))
        if not ev:
            return None
        return dict(ev)

    async def update_one(self, query, update, upsert=False):
        ev_id = query.get("_id")
        if ev_id not in self.events and not upsert:
            return SimpleNamespace(modified_count=0)
        self.events[ev_id] = {"_id": ev_id, **update.get("$set", {})}
        return SimpleNamespace(modified_count=1)


class FakeDB:
    def __init__(self):
        self.products = FakeProducts()
        self.orders = FakeOrders()
        self.stripe_events = FakeStripeEvents()


class FakeSessionsAPI:
    def __init__(self):
        self.created = []
        self.retrieved = {}

    async def create_async(self, params, options):
        self.created.append({"params": params, "options": options})
        return SimpleNamespace(id="cs_test_mocked", url="https://checkout.stripe.com/c/pay/cs_test_mocked")

    async def retrieve_async(self, session_id):
        return self.retrieved[session_id]


class FakeStripeClient:
    def __init__(self):
        self.sessions_api = FakeSessionsAPI()
        self.v1 = SimpleNamespace(checkout=SimpleNamespace(sessions=self.sessions_api))


@pytest.fixture
def mocked_client(monkeypatch):
    db = FakeDB()
    stripe_client = FakeStripeClient()

    monkeypatch.setattr(payments, "get_db", lambda: db)
    monkeypatch.setattr(payments, "stripe_client", lambda: stripe_client)
    monkeypatch.setattr(payments, "webhook_secret", lambda: "whsec_testsecret123456")
    monkeypatch.setattr(payments, "public_origin", lambda: "https://store.example")

    app = FastAPI()
    app.include_router(payments.payment_router)
    client = TestClient(app)
    return client, db, stripe_client


class TestMockedCheckoutAndStatus:
    """MOCKED checkout/status semantics without real Stripe credentials."""

    def test_create_checkout_uses_server_pricing_and_public_origin(self, mocked_client):
        client, db, stripe = mocked_client
        r = client.post(
            "/api/checkout/session",
            json={
                "items": [{"slug": "royal-garam-masala", "quantity": 2, "price_eur": 0.01}],
                "origin_url": "https://attacker.example",
                "gift_wrap": True,
                "gift_message": "Happy Birthday",
                "email": "guest@example.com",
            },
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert set(body.keys()) == {"checkout_url", "session_id"}
        assert body["session_id"] == "cs_test_mocked"

        created = stripe.sessions_api.created[-1]["params"]
        assert created["success_url"].startswith("https://store.example/payment/success")
        assert created["cancel_url"] == "https://store.example/payment/cancel"
        assert created["line_items"][0]["price_data"]["unit_amount"] == 890
        assert any(li["price_data"]["unit_amount"] == 500 for li in created["line_items"])
        assert db.orders.by_session["cs_test_mocked"]["amount_cents"] == 3480

    @pytest.mark.parametrize("price,quantity,gift,shipping,total", [
        (8.90, 2, False, 1200, 2980),
        (8.90, 2, True, 1200, 3480),
        (120.00, 1, False, 0, 12000),
        (119.00, 1, True, 1200, 13600),
    ])
    def test_shipping_and_gift_totals_match_cart(self, mocked_client, price, quantity, gift, shipping, total):
        client, db, stripe = mocked_client
        db.products.by_slug["royal-garam-masala"]["price_eur"] = price
        response = client.post("/api/checkout/session", json={"items": [{"slug": "royal-garam-masala", "quantity": quantity}], "gift_wrap": gift})
        assert response.status_code == 200
        order = db.orders.by_session["cs_test_mocked"]
        assert order["shipping_cents"] == shipping
        assert order["amount_cents"] == total
        assert sum(line["price_data"]["unit_amount"] * line["quantity"] for line in stripe.sessions_api.created[-1]["params"]["line_items"]) == total

    def test_status_retrieval_keeps_local_pending_until_signed_webhook(self, mocked_client):
        client, db, stripe = mocked_client
        db.orders.by_session["cs_pending"] = {
            "session_id": "cs_pending",
            "order_ref": "ref_pending",
            "amount": 8.90,
            "amount_cents": 890,
            "currency": "eur",
            "status": "initiated",
            "payment_status": "pending",
        }
        stripe.sessions_api.retrieved["cs_pending"] = {
            "id": "cs_pending",
            "status": "complete",
            "payment_status": "unpaid",
            "amount_total": 890,
            "currency": "eur",
            "metadata": {"order_ref": "ref_pending"},
        }
        r = client.get("/api/checkout/status/cs_pending")
        assert r.status_code == 200
        assert r.json()["payment_status"] == "pending"


class TestMockedWebhookSignaturesAndState:
    """MOCKED webhook processing with real Stripe signature verification path."""

    def test_valid_paid_event_marks_order_paid_and_replay_is_idempotent(self, mocked_client):
        client, db, _ = mocked_client
        db.orders.by_session["cs_paid"] = {
            "session_id": "cs_paid", "order_ref": "ref_paid", "amount": 8.90,
            "amount_cents": 890, "currency": "eur", "status": "initiated", "payment_status": "pending",
        }
        event = {
            "id": "evt_paid_1",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_paid", "amount_total": 890, "currency": "eur", "payment_status": "paid", "payment_intent": "pi_1", "metadata": {"order_ref": "ref_paid", "application": "keneth-store"}}},
        }
        raw = json.dumps(event).encode()
        sig = _sign(raw, "whsec_testsecret123456")

        ok1 = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
        assert ok1.status_code == 200
        assert db.orders.by_session["cs_paid"]["payment_status"] == "paid"

        ok2 = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
        assert ok2.status_code == 200
        assert db.orders.by_session["cs_paid"]["payment_status"] == "paid"

    def test_completed_unpaid_never_marks_paid_and_expired_sets_cancelled(self, mocked_client):
        client, db, _ = mocked_client
        db.orders.by_session["cs_unpaid"] = {
            "session_id": "cs_unpaid", "order_ref": "ref_unpaid", "amount": 8.90,
            "amount_cents": 890, "currency": "eur", "status": "initiated", "payment_status": "pending",
        }
        completed_unpaid = {
            "id": "evt_unpaid",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_unpaid", "amount_total": 890, "currency": "eur", "payment_status": "unpaid", "metadata": {"order_ref": "ref_unpaid", "application": "keneth-store"}}},
        }
        raw1 = json.dumps(completed_unpaid).encode()
        sig1 = _sign(raw1, "whsec_testsecret123456")
        r1 = client.post("/api/webhook/stripe", data=raw1, headers={"Stripe-Signature": sig1, "Content-Type": "application/json"})
        assert r1.status_code == 200
        assert db.orders.by_session["cs_unpaid"]["payment_status"] == "pending"

        expired = {
            "id": "evt_expired",
            "type": "checkout.session.expired",
            "data": {"object": {"id": "cs_unpaid", "amount_total": 890, "currency": "eur", "payment_status": "unpaid", "metadata": {"order_ref": "ref_unpaid", "application": "keneth-store"}}},
        }
        raw2 = json.dumps(expired).encode()
        sig2 = _sign(raw2, "whsec_testsecret123456")
        r2 = client.post("/api/webhook/stripe", data=raw2, headers={"Stripe-Signature": sig2, "Content-Type": "application/json"})
        assert r2.status_code == 200
        assert db.orders.by_session["cs_unpaid"]["status"] == "cancelled"

    def test_late_failure_cannot_downgrade_already_paid(self, mocked_client):
        client, db, _ = mocked_client
        db.orders.by_session["cs_late"] = {
            "session_id": "cs_late", "order_ref": "ref_late", "amount": 8.90,
            "amount_cents": 890, "currency": "eur", "status": "completed", "payment_status": "paid",
        }
        failed = {
            "id": "evt_late_fail",
            "type": "checkout.session.async_payment_failed",
            "data": {"object": {"id": "cs_late", "amount_total": 890, "currency": "eur", "payment_status": "unpaid", "metadata": {"order_ref": "ref_late", "application": "keneth-store"}}},
        }
        raw = json.dumps(failed).encode()
        sig = _sign(raw, "whsec_testsecret123456")
        r = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
        assert r.status_code == 200
        assert db.orders.by_session["cs_late"]["payment_status"] == "paid"

    def test_invalid_tampered_and_stale_signatures_return_400(self, mocked_client):
        client, db, _ = mocked_client
        db.orders.by_session["cs_sig"] = {
            "session_id": "cs_sig", "order_ref": "ref_sig", "amount": 8.90,
            "amount_cents": 890, "currency": "eur", "status": "initiated", "payment_status": "pending",
        }
        event = {
            "id": "evt_sig",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_sig", "amount_total": 890, "currency": "eur", "payment_status": "paid", "metadata": {"order_ref": "ref_sig", "application": "keneth-store"}}},
        }
        raw = json.dumps(event).encode()

        bad = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": "t=1,v1=deadbeef", "Content-Type": "application/json"})
        assert bad.status_code == 400

        tampered_sig = _sign(raw, "whsec_testsecret123456")
        tampered = client.post("/api/webhook/stripe", data=raw + b" ", headers={"Stripe-Signature": tampered_sig, "Content-Type": "application/json"})
        assert tampered.status_code == 400

        stale_sig = _sign(raw, "whsec_testsecret123456", timestamp=int(time.time()) - 1000)
        stale = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": stale_sig, "Content-Type": "application/json"})
        assert stale.status_code == 400

    def test_mismatched_amount_currency_reference_400_no_mutation(self, mocked_client):
        client, db, _ = mocked_client
        db.orders.by_session["cs_mismatch"] = {
            "session_id": "cs_mismatch", "order_ref": "ref_match", "amount": 8.90,
            "amount_cents": 890, "currency": "eur", "status": "initiated", "payment_status": "pending",
        }
        event = {
            "id": "evt_mismatch",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_mismatch", "amount_total": 999, "currency": "usd", "payment_status": "paid", "metadata": {"order_ref": "wrong_ref", "application": "keneth-store"}}},
        }
        raw = json.dumps(event).encode()
        sig = _sign(raw, "whsec_testsecret123456")
        r = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
        assert r.status_code == 400
        assert db.orders.by_session["cs_mismatch"]["payment_status"] == "pending"

    def test_absent_order_with_app_metadata_returns_503_retryable(self, mocked_client):
        client, _, _ = mocked_client
        event = {
            "id": "evt_no_order",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_missing", "amount_total": 890, "currency": "eur", "payment_status": "paid", "metadata": {"order_ref": "r1", "application": "keneth-store"}}},
        }
        raw = json.dumps(event).encode()
        sig = _sign(raw, "whsec_testsecret123456")
        r = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
        assert r.status_code == 503

    def test_unrelated_event_type_is_ignored(self, mocked_client):
        client, _, _ = mocked_client
        event = {"id": "evt_other", "type": "payment_intent.succeeded", "data": {"object": {"id": "pi_1"}}}
        raw = json.dumps(event).encode()
        sig = _sign(raw, "whsec_testsecret123456")
        r = client.post("/api/webhook/stripe", data=raw, headers={"Stripe-Signature": sig, "Content-Type": "application/json"})
        assert r.status_code == 200


class TestPaymentGatewayValidation:
    """Key/origin validators for config gating behavior."""

    def test_stripe_api_key_validation(self, monkeypatch):
        monkeypatch.delenv("STRIPE_API_KEY", raising=False)
        with pytest.raises(HTTPException) as e1:
            payment_gateway.stripe_client()
        assert e1.value.status_code == 503

        monkeypatch.setenv("STRIPE_API_KEY", "sk_test_emergent")
        with pytest.raises(HTTPException) as e2:
            payment_gateway.stripe_client()
        assert e2.value.status_code == 503

        monkeypatch.setenv("STRIPE_API_KEY", "sk_live_123456789012345678901234")
        with pytest.raises(HTTPException) as e3:
            payment_gateway.stripe_client()
        assert e3.value.status_code == 503

    def test_webhook_secret_and_public_origin_validation(self, monkeypatch):
        monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
        with pytest.raises(HTTPException) as e1:
            payment_gateway.webhook_secret()
        assert e1.value.status_code == 503

        monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_short")
        with pytest.raises(HTTPException) as e2:
            payment_gateway.webhook_secret()
        assert e2.value.status_code == 503

        monkeypatch.setenv("PUBLIC_BASE_URL", "https://shop.example.com/path")
        with pytest.raises(HTTPException) as e3:
            payment_gateway.public_origin()
        assert e3.value.status_code == 503

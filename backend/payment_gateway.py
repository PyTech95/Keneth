"""Direct Stripe SDK configuration and currency helpers."""
import os
import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.parse import urlsplit

import stripe
from fastapi import HTTPException


def euro_cents(value) -> int:
    try:
        amount = Decimal(str(value))
        if not amount.is_finite() or amount < 0:
            raise ValueError("Invalid price")
        return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    except (InvalidOperation, ValueError, TypeError):
        raise HTTPException(400, "Invalid product price")


def stripe_client():
    key = os.environ.get("STRIPE_API_KEY")
    if not key or not re.fullmatch(r"(?:sk|rk)_test_[A-Za-z0-9]{24,}", key):
        raise HTTPException(503, "Payments are unavailable. A valid Stripe test API key must be configured by the store owner.")
    return stripe.StripeClient(key, max_network_retries=2)


def webhook_secret():
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not secret or not re.fullmatch(r"whsec_[A-Za-z0-9]{16,}", secret):
        raise HTTPException(503, "Payments are unavailable. The Stripe webhook signing secret has not been configured.")
    return secret


def public_origin():
    value = os.environ.get("PUBLIC_BASE_URL")
    if not value:
        raise HTTPException(503, "PUBLIC_BASE_URL is not configured")
    try:
        p = urlsplit(value)
        valid_scheme = p.scheme == "https" or (p.scheme == "http" and p.hostname in {"localhost", "127.0.0.1"})
        if not valid_scheme or not p.hostname or p.username or p.password or p.query or p.fragment or p.path not in {"", "/"}:
            raise ValueError("Invalid origin")
        _ = p.port
    except ValueError:
        raise HTTPException(503, "PUBLIC_BASE_URL must be the store's public origin, without a path")
    return value.rstrip("/")
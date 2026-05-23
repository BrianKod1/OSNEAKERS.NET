"""Service layer — referral helpers, email send wrapper, scheduled jobs."""
import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import resend

import email_templates as tpl
from config import (
    CREDIT_EXPIRY_DAYS,
    RESEND_API_KEY,
    SENDER_EMAIL,
)
from database import db
from models import Referral

logger = logging.getLogger(__name__)

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


# ---------- Email send wrapper ----------
async def send_email(to: str, subject: str, html: str, reply_to: Optional[str] = None) -> bool:
    """Single point to dispatch a Resend email. Returns True on success."""
    if not RESEND_API_KEY:
        return False
    params = {
        "from": f"OSneakers <{SENDER_EMAIL}>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if reply_to:
        params["reply_to"] = reply_to
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return bool(result.get("id"))
    except Exception as e:
        logger.error(f"Resend send failed for {to}: {e}")
        return False


# ---------- Referrals ----------
async def prune_expired_credits(email: str) -> Optional[dict]:
    """Zero out credits if last accrual was >CREDIT_EXPIRY_DAYS days ago."""
    ref = await db.referrals.find_one({"owner_email": email.lower().strip()}, {"_id": 0})
    if not ref:
        return None
    last = ref.get("last_credit_at")
    if last and ref.get("credits_earned", 0) > 0:
        try:
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) - last_dt > timedelta(days=CREDIT_EXPIRY_DAYS):
                await db.referrals.update_one(
                    {"owner_email": email.lower().strip()},
                    {"$set": {"credits_earned": 0.0, "expired_at": datetime.now(timezone.utc).isoformat()}},
                )
                ref["credits_earned"] = 0.0
        except (ValueError, TypeError):
            pass
    return ref


async def get_or_create_referral(email: str) -> dict:
    email = email.lower().strip()
    existing = await prune_expired_credits(email)
    if existing:
        return existing
    prefix = "".join(c for c in email.split("@")[0] if c.isalnum()).upper()[:6] or "OS"
    code = f"{prefix}{uuid.uuid4().hex[:4].upper()}"
    ref = Referral(owner_email=email, code=code).model_dump()
    await db.referrals.insert_one(ref)
    return ref


# ---------- Discount validation ----------
async def resolve_discount(code: str, buyer_email: str) -> dict:
    """Return {valid, code, percent, type}. Type is promo|campaign|referral|None."""
    from config import DISCOUNT_CODE, DISCOUNT_PERCENT

    code = (code or "").strip().upper()
    buyer_email = (buyer_email or "").strip().lower()

    if code == DISCOUNT_CODE.upper():
        return {"valid": True, "code": DISCOUNT_CODE, "percent": DISCOUNT_PERCENT, "type": "promo"}

    # Recovery code tiers (issued by run_abandoned_cart_recovery escalation)
    if code == "COMEBACK5":
        return {"valid": True, "code": "COMEBACK5", "percent": 5, "type": "recovery"}
    if code == "COMEBACK10":
        return {"valid": True, "code": "COMEBACK10", "percent": 10, "type": "recovery"}
    if code == "SHIPFREE":
        # Free-shipping flag — handled at checkout via metadata, but also accepted as 0% promo for tracking
        return {"valid": True, "code": "SHIPFREE", "percent": 0, "type": "free_shipping"}

    now_iso = datetime.now(timezone.utc).isoformat()
    camp = await db.campaigns.find_one(
        {"code": code, "expires_at": {"$gt": now_iso}}, {"_id": 0}
    )
    if camp:
        return {"valid": True, "code": camp["code"], "percent": int(camp["percent"]), "type": "campaign"}

    ref = await db.referrals.find_one({"code": code}, {"_id": 0})
    if ref and ref["owner_email"] != buyer_email:
        return {"valid": True, "code": ref["code"], "percent": int(ref["percent"]), "type": "referral"}

    return {"valid": False, "code": code, "percent": 0, "type": None}


# ---------- Scheduled jobs ----------
async def run_digest() -> dict:
    highlights = await db.products.find(
        {"$or": [{"is_new": True}, {"featured": True}]}, {"_id": 0}
    ).sort([("is_new", -1), ("featured", -1)]).to_list(3)
    if not highlights:
        highlights = await db.products.find({}, {"_id": 0}).to_list(3)
    subscribers = await db.subscribers.find({}, {"_id": 0, "email": 1}).to_list(10000)
    sent = 0
    failed = 0
    for sub in subscribers:
        ref = await get_or_create_referral(sub["email"])
        ok = await send_email(
            to=sub["email"],
            subject="This week's drop digest · OSneakers",
            html=tpl.digest_html(highlights, ref),
        )
        if ok:
            sent += 1
        else:
            failed += 1
    return {
        "sent": sent,
        "failed": failed,
        "total_subscribers": len(subscribers),
        "products_featured": len(highlights),
    }


async def run_credit_reminder() -> dict:
    """Every Monday — nudge users whose credits expire within 14 days."""
    now = datetime.now(timezone.utc)
    threshold = (now - timedelta(days=CREDIT_EXPIRY_DAYS - 14)).isoformat()
    cutoff = (now - timedelta(days=CREDIT_EXPIRY_DAYS)).isoformat()
    candidates = await db.referrals.find(
        {"credits_earned": {"$gt": 0}, "last_credit_at": {"$lt": threshold, "$gt": cutoff}},
        {"_id": 0},
    ).to_list(10000)
    sent = 0
    for r in candidates:
        ok = await send_email(
            to=r["owner_email"],
            subject=f"${r['credits_earned']:.2f} in credits expiring soon",
            html=tpl.credit_reminder_html(r["credits_earned"]),
        )
        if ok:
            sent += 1
    return {"sent": sent, "candidates": len(candidates)}


async def run_abandoned_cart_recovery() -> dict:
    """Hourly — 3-touch escalating sequence for pending orders.

    Touch 1: 1–6h old, stage=0 → COMEBACK5 (5% off).
    Touch 2: 12h+ old, stage=1 → COMEBACK10 (10% off).
    Touch 3: 24h+ old, stage=2 → SHIPFREE (free shipping). Final touch.
    """
    from models import Order  # local import to avoid circular ref

    now = datetime.now(timezone.utc)
    h1 = (now - timedelta(hours=1)).isoformat()
    h6 = (now - timedelta(hours=6)).isoformat()
    h12 = (now - timedelta(hours=12)).isoformat()
    h24 = (now - timedelta(hours=24)).isoformat()
    h48 = (now - timedelta(hours=48)).isoformat()

    tiers = [
        # (stage_to_set, code, percent, subject, time_filter)
        (1, "COMEBACK5", 5, "You left {n} item(s) at OSneakers — 5% off if you finish today",
         {"created_at": {"$gt": h6, "$lt": h1}, "recovery_stage": 0}),
        (2, "COMEBACK10", 10, "Still thinking? Bump it to 10% off — final hours.",
         {"created_at": {"$gt": h24, "$lt": h12}, "recovery_stage": 1}),
        (3, "SHIPFREE", 0, "Last chance — free shipping on your cart, ends tonight.",
         {"created_at": {"$gt": h48, "$lt": h24}, "recovery_stage": 2}),
    ]

    total_sent = 0
    total_candidates = 0
    by_tier: dict = {}

    for stage, code, percent, subject_tpl, time_filter in tiers:
        q = {
            "status": "pending",
            "payment_status": {"$ne": "paid"},
            **time_filter,
        }
        candidates = await db.orders.find(q, {"_id": 0}).to_list(10000)
        tier_sent = 0
        for doc in candidates:
            try:
                order = Order(**doc)
                subject = subject_tpl.format(n=len(order.items))
                ok = await send_email(
                    to=order.email,
                    subject=subject,
                    html=tpl.abandoned_cart_html(order, code=code, percent=percent),
                )
                await db.orders.update_one(
                    {"order_number": order.order_number},
                    {"$set": {
                        "recovery_email_sent": True,
                        "recovery_stage": stage,
                        f"recovery_stage_{stage}_at": now.isoformat(),
                    }},
                )
                if ok:
                    tier_sent += 1
            except Exception as e:
                logger.error(f"Recovery touch {stage} failed for {doc.get('order_number')}: {e}")
        total_sent += tier_sent
        total_candidates += len(candidates)
        by_tier[f"stage_{stage}_{code}"] = {"candidates": len(candidates), "sent": tier_sent}

    return {"sent": total_sent, "candidates": total_candidates, "by_tier": by_tier}


# ---------- Shipping notification ----------
CARRIER_TRACKING_URLS = {
    "canada post": "https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={n}",
    "ups": "https://www.ups.com/track?tracknum={n}",
    "fedex": "https://www.fedex.com/fedextrack/?trknbr={n}",
    "dhl": "https://www.dhl.com/en/express/tracking.html?AWB={n}",
    "purolator": "https://www.purolator.com/en/shipping/tracker?pin={n}",
    "usps": "https://tools.usps.com/go/TrackConfirmAction?tLabels={n}",
}


def build_tracking_url(carrier: str, tracking_number: str) -> Optional[str]:
    if not carrier or not tracking_number:
        return None
    key = carrier.strip().lower()
    template = CARRIER_TRACKING_URLS.get(key)
    if not template:
        return None
    return template.format(n=tracking_number.strip())


async def send_shipped_notification(order_number: str) -> dict:
    """Mark order shipped (requires tracking_carrier/number to be set already) and send email."""
    from models import Order  # local

    doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not doc:
        return {"sent": False, "reason": "order_not_found"}
    if not doc.get("tracking_number") or not doc.get("tracking_carrier"):
        return {"sent": False, "reason": "missing_tracking"}
    if doc.get("shipped_email_sent"):
        return {"sent": False, "reason": "already_sent"}

    order = Order(**doc)
    ok = await send_email(
        to=order.email,
        subject=f"Your OSneakers order is on the way — {order.order_number}",
        html=tpl.shipped_html(order),
    )
    await db.orders.update_one(
        {"order_number": order_number},
        {"$set": {
            "shipped_email_sent": ok,
            "shipped_at": datetime.now(timezone.utc).isoformat(),
            "status": "shipped",
        }},
    )
    return {"sent": ok, "reason": "ok" if ok else "send_failed"}

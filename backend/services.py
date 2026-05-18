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

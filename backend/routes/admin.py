"""Admin routes — campaigns, product CRUD, overview, manual digest triggers."""
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException

import email_templates as tpl
from config import ADMIN_PASSCODE
from database import db
from models import (
    CampaignCreate,
    CampaignResult,
    Product,
    ProductUpsert,
)
from services import run_abandoned_cart_recovery, run_credit_reminder, run_digest, send_email

router = APIRouter(prefix="/admin")
logger = logging.getLogger(__name__)


def _require_admin(passcode: str | None):
    if not passcode or passcode != ADMIN_PASSCODE:
        raise HTTPException(401, "Invalid admin passcode")


@router.post("/products", response_model=Product)
async def create_product(payload: ProductUpsert, x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    p = Product(**payload.model_dump())
    await db.products.insert_one(p.model_dump())
    return p


@router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, payload: ProductUpsert, x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    res = await db.products.update_one({"id": product_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    res = await db.products.delete_one({"id": product_id})
    return {"deleted": res.deleted_count}


@router.post("/credit-reminder")
async def trigger_credit_reminder(x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    return await run_credit_reminder()


@router.post("/digest")
async def trigger_digest(x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    return await run_digest()


@router.post("/abandoned-cart-recovery")
async def trigger_abandoned_cart_recovery(x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    return await run_abandoned_cart_recovery()


@router.get("/overview")
async def overview(x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    subs = await db.subscribers.count_documents({})
    orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"status": "paid"})
    pending_orders = await db.orders.count_documents({
        "status": "pending",
        "payment_status": {"$ne": "paid"},
    })
    recovered_orders = await db.orders.count_documents({
        "recovery_email_sent": True,
        "status": "paid",
    })
    campaigns = await db.campaigns.count_documents({})
    recent_orders = await db.orders.find({}, {"_id": 0}).sort([("created_at", -1)]).to_list(10)
    recent_subs = await db.subscribers.find({}, {"_id": 0}).sort([("subscribed_at", -1)]).to_list(10)
    top_referrers = await db.referrals.find(
        {"uses": {"$gt": 0}}, {"_id": 0}
    ).sort([("credits_earned", -1)]).to_list(10)
    return {
        "subscribers": subs,
        "orders": orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "recovered_orders": recovered_orders,
        "campaigns": campaigns,
        "recent_orders": recent_orders,
        "recent_subscribers": recent_subs,
        "top_referrers": top_referrers,
    }


@router.post("/campaigns", response_model=CampaignResult)
async def send_campaign(payload: CampaignCreate, x_admin_passcode: str = Header(default="")):
    _require_admin(x_admin_passcode)
    code = payload.code.strip().upper()
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=max(1, payload.expires_hours))).isoformat()
    campaign_id = str(uuid.uuid4())

    await db.campaigns.insert_one({
        "id": campaign_id,
        "code": code,
        "percent": payload.percent,
        "subject": payload.subject,
        "headline": payload.headline,
        "body": payload.body,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
    })

    subscribers = await db.subscribers.find({}, {"_id": 0, "email": 1}).to_list(10000)
    sent = 0
    failed = 0
    html = tpl.campaign_html(code, payload.percent, payload.headline, payload.body, expires_at)
    for sub in subscribers:
        ok = await send_email(to=sub["email"], subject=payload.subject, html=html)
        if ok:
            sent += 1
        else:
            failed += 1

    return CampaignResult(
        id=campaign_id,
        code=code,
        percent=payload.percent,
        sent_count=sent,
        failed_count=failed,
        total_subscribers=len(subscribers),
        expires_at=expires_at,
    )

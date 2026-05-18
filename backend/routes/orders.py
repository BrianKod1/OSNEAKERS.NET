"""Order & checkout routes."""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

import email_templates as tpl
from database import db
from models import Order, OrderCreate
from services import get_or_create_referral, resolve_discount, send_email

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/validate-discount")
async def validate_discount(payload: dict):
    return await resolve_discount(payload.get("code", ""), payload.get("email", ""))


@router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    subtotal = round(sum(i.price * i.quantity for i in payload.items), 2)
    discount_amount = 0.0
    discount_code = None
    discount_type = None
    discount_percent = 0
    if payload.discount_code:
        validation = await resolve_discount(payload.discount_code, payload.email)
        if validation["valid"]:
            discount_code = validation["code"]
            discount_type = validation.get("type")
            discount_percent = int(validation["percent"])
            discount_amount = round(subtotal * (discount_percent / 100.0), 2)
    total = round(subtotal - discount_amount, 2)

    credits_applied = 0.0
    if payload.use_credits and total > 0:
        buyer_ref_doc = await db.referrals.find_one(
            {"owner_email": payload.email.lower().strip()}, {"_id": 0}
        )
        if buyer_ref_doc and buyer_ref_doc.get("credits_earned", 0) > 0:
            credits_applied = round(min(buyer_ref_doc["credits_earned"], total), 2)
            total = round(total - credits_applied, 2)
            await db.referrals.update_one(
                {"owner_email": payload.email.lower().strip()},
                {"$inc": {"credits_earned": -credits_applied}},
            )

    order_number = f"OS{datetime.now(timezone.utc).strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        order_number=order_number,
        customer_name=payload.customer_name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        country=payload.country,
        items=payload.items,
        subtotal=subtotal,
        discount_code=discount_code,
        discount_amount=discount_amount,
        credits_applied=credits_applied,
        total=total,
        notes=payload.notes,
    )

    if discount_type == "referral" and discount_code:
        credit = round(subtotal * 0.05, 2)
        await db.referrals.update_one(
            {"code": discount_code},
            {
                "$inc": {"uses": 1, "credits_earned": credit},
                "$set": {"last_credit_at": datetime.now(timezone.utc).isoformat()},
            },
        )

    buyer_ref = await get_or_create_referral(payload.email)

    sent = await send_email(
        to=payload.email,
        subject=f"Order {order_number} confirmed · OSneakers",
        html=tpl.order_html(order, buyer_ref["code"]),
    )
    order.confirmation_email_sent = sent

    await db.orders.insert_one(order.model_dump())
    return order


@router.get("/orders/{order_number}", response_model=Order)
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Order not found")
    return doc

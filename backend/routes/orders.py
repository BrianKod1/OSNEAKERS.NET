"""Order lookup + discount validation. Order creation is handled by /checkout/session (Stripe)."""
import logging

from fastapi import APIRouter, HTTPException

from database import db
from models import Order
from services import resolve_discount

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/validate-discount")
async def validate_discount(payload: dict):
    return await resolve_discount(payload.get("code", ""), payload.get("email", ""))


@router.get("/orders/{order_number}", response_model=Order)
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Order not found")
    return doc


@router.post("/track")
async def public_track(payload: dict):
    """Public order lookup — requires order_number AND email match for privacy.
    Returns a minimal status payload (no payment details, no internal IDs).
    """
    order_number = (payload.get("order_number") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    if not order_number or not email:
        raise HTTPException(400, "Order number and email are required")

    doc = await db.orders.find_one(
        {"order_number": order_number},
        {"_id": 0},
    )
    if not doc or doc.get("email", "").lower() != email:
        # Same error for not-found vs email-mismatch — prevents email enumeration
        raise HTTPException(404, "No order found matching that order number and email")

    return {
        "order_number": doc["order_number"],
        "status": doc.get("status"),
        "payment_status": doc.get("payment_status"),
        "customer_name": doc.get("customer_name"),
        "items": [
            {"name": i["name"], "size": i.get("size"), "quantity": i.get("quantity", 1), "image": i.get("image")}
            for i in doc.get("items", [])
        ],
        "subtotal": doc.get("subtotal"),
        "shipping": doc.get("shipping"),
        "total": doc.get("total"),
        "tracking_carrier": doc.get("tracking_carrier"),
        "tracking_number": doc.get("tracking_number"),
        "tracking_url": doc.get("tracking_url"),
        "created_at": doc.get("created_at"),
        "paid_at": doc.get("paid_at"),
        "shipped_at": doc.get("shipped_at"),
    }

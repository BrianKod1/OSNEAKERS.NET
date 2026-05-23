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

"""Customer account routes (orders, credits, referral)."""
from fastapi import APIRouter, HTTPException

from database import db
from models import Order
from services import get_or_create_referral

router = APIRouter()


@router.get("/account/{email}")
async def get_account(email: str):
    email = email.lower().strip()
    ref = await get_or_create_referral(email)
    orders = await db.orders.find({"email": email}, {"_id": 0}).sort([("created_at", -1)]).to_list(50)
    return {
        "email": email,
        "referral": {
            "code": ref["code"],
            "percent": ref["percent"],
            "uses": ref["uses"],
            "credits_earned": ref["credits_earned"],
        },
        "orders": orders,
        "order_count": len(orders),
        "total_spent": round(sum(o.get("total", 0) for o in orders), 2),
    }


@router.get("/account/{email}/orders/{order_number}", response_model=Order)
async def get_account_order(email: str, order_number: str):
    """Fetch a single order, scoped to the email (acts as ownership check)."""
    doc = await db.orders.find_one(
        {"order_number": order_number, "email": email.lower().strip()},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(404, "Order not found")
    return doc

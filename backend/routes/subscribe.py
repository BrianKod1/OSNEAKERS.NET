"""Newsletter subscription routes."""
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

import email_templates as tpl
from config import DISCOUNT_CODE, DISCOUNT_PERCENT, RESEND_API_KEY
from database import db
from models import SubscribeRequest, SubscribeResponse
from services import send_email

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(payload: SubscribeRequest):
    email = payload.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    existing = await db.subscribers.find_one({"email": email}, {"_id": 0})
    if not existing:
        await db.subscribers.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "discount_code": DISCOUNT_CODE,
            "subscribed_at": now_iso,
        })

    message = "Welcome to OSneakers. Your discount code is ready."
    email_sent = False
    if RESEND_API_KEY:
        email_sent = await send_email(
            to=email,
            subject=f"You're in. Here's {DISCOUNT_PERCENT}% off your first drop.",
            html=tpl.welcome_html(DISCOUNT_CODE, DISCOUNT_PERCENT),
        )
        if not email_sent:
            message = "Code generated. Email delivery failed but your code is valid."
    else:
        message = "Code generated (email service not configured)."

    return SubscribeResponse(
        email=email,
        discount_code=DISCOUNT_CODE,
        discount_percent=DISCOUNT_PERCENT,
        email_sent=email_sent,
        message=message,
    )

"""Referral & share routes."""
from fastapi import APIRouter

import email_templates as tpl
from models import ShareInvite
from services import get_or_create_referral, send_email

router = APIRouter()


@router.get("/referral/{email}")
async def get_referral(email: str):
    ref = await get_or_create_referral(email)
    return {
        "code": ref["code"],
        "percent": ref["percent"],
        "uses": ref["uses"],
        "credits_earned": ref["credits_earned"],
    }


@router.post("/referral/share")
async def share_referral(payload: ShareInvite):
    ref = await get_or_create_referral(payload.from_email)
    note = (payload.note or "Thought you'd love OSneakers — premium sneakers shipped fast from Ontario.").strip()
    sent = await send_email(
        to=payload.to_email,
        subject=f"A friend wants you to try OSneakers ({ref['percent']}% off)",
        html=tpl.referral_invite_html(ref["code"], ref["percent"], note),
        reply_to=payload.from_email,
    )
    return {"sent": sent, "code": ref["code"], "to": payload.to_email}

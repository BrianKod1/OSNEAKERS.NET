"""Stripe Checkout integration — session creation, status polling, webhook."""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import stripe
from emergentintegrations.payments.stripe.checkout import StripeCheckout
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

import email_templates as tpl
from config import (
    CURRENCY,
    SHIPPING_FLAT_RATE,
    SHIPPING_FREE_THRESHOLD,
    STRIPE_API_KEY,
    STRIPE_TAX_ENABLED,
)
from database import db
from models import CheckoutSessionCreate, Order, PaymentTransaction
from services import get_or_create_referral, resolve_discount, send_email

router = APIRouter()
logger = logging.getLogger(__name__)


def _configure_stripe() -> None:
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe is not configured")
    stripe.api_key = STRIPE_API_KEY
    if "sk_test_emergent" in STRIPE_API_KEY:
        stripe.api_base = "https://integrations.emergentagent.com/stripe"
    else:
        stripe.api_base = "https://api.stripe.com"


class CheckoutStatus(BaseModel):
    """Local status DTO — bypasses an upstream library Pydantic bug on metadata."""
    status: str
    payment_status: str
    amount_total: Optional[int] = None
    currency: Optional[str] = None
    metadata: dict = {}


def _stripe_client(request: Request) -> StripeCheckout:
    """Used for webhook signature verification only."""
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe is not configured")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)


def _calc_shipping(subtotal_after_discount: float) -> float:
    return 0.0 if subtotal_after_discount >= SHIPPING_FREE_THRESHOLD else SHIPPING_FLAT_RATE


async def _resolve_amounts(payload: CheckoutSessionCreate) -> dict:
    """Server-side compute of subtotal/discount/credits/shipping/total. NEVER trust client."""
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
    after_discount = round(subtotal - discount_amount, 2)

    credits_available = 0.0
    credits_applied = 0.0
    if payload.use_credits and after_discount > 0:
        buyer_ref = await db.referrals.find_one(
            {"owner_email": payload.email.lower().strip()}, {"_id": 0}
        )
        if buyer_ref and buyer_ref.get("credits_earned", 0) > 0:
            credits_available = float(buyer_ref["credits_earned"])
            credits_applied = round(min(credits_available, after_discount), 2)

    after_credits = round(after_discount - credits_applied, 2)
    shipping = _calc_shipping(after_credits)
    total = round(max(after_credits + shipping, 0.5), 2)  # Stripe min ~$0.50

    return {
        "subtotal": subtotal,
        "discount_code": discount_code,
        "discount_type": discount_type,
        "discount_amount": discount_amount,
        "credits_applied": credits_applied,
        "shipping": shipping,
        "total": total,
    }


@router.post("/checkout/session")
async def create_checkout_session(payload: CheckoutSessionCreate, request: Request):
    if not payload.items:
        raise HTTPException(400, "Cart is empty")

    amounts = await _resolve_amounts(payload)
    order_number = f"OS{datetime.now(timezone.utc).strftime('%Y%m%d')}{uuid.uuid4().hex[:6].upper()}"

    # Persist pending order so admin sees it even if Stripe never returns
    order = Order(
        order_number=order_number,
        customer_name=payload.customer_name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        country=payload.country,
        items=payload.items,
        subtotal=amounts["subtotal"],
        discount_code=amounts["discount_code"],
        discount_amount=amounts["discount_amount"],
        credits_applied=amounts["credits_applied"],
        shipping=amounts["shipping"],
        total=amounts["total"],
        notes=payload.notes,
        status="pending",
        payment_status="unpaid",
    )
    await db.orders.insert_one(order.model_dump())

    # Build success/cancel URLs from frontend origin
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/checkout/cancel?order={order_number}"

    metadata = {
        "order_number": order_number,
        "email": payload.email,
        "discount_code": amounts["discount_code"] or "",
        "discount_type": amounts["discount_type"] or "",
        "credits_applied": str(amounts["credits_applied"]),
    }
    # Webhook URL (needed so handle_webhook can pick the right route on incoming event)
    host_url = str(request.base_url).rstrip("/")
    metadata["webhook_url"] = f"{host_url}/api/webhook/stripe"

    _configure_stripe()
    amount_cents = int(round(float(amounts["total"]) * 100))
    create_kwargs = dict(
        # 'card' surfaces Apple Pay & Google Pay automatically on supported devices
        # (must be enabled in Stripe Dashboard → Settings → Payment Methods).
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": CURRENCY,
                "product_data": {
                    "name": f"OSneakers order {order_number}",
                    "description": f"{len(payload.items)} item(s)",
                },
                "unit_amount": amount_cents,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
        customer_email=payload.email,
    )
    if STRIPE_TAX_ENABLED:
        # Requires Stripe Tax to be enabled in Dashboard + tax registrations configured.
        # Customer billing address will be collected at checkout for accurate tax computation.
        create_kwargs["automatic_tax"] = {"enabled": True}
        create_kwargs["billing_address_collection"] = "required"
        create_kwargs["customer_creation"] = "always"

    try:
        session = stripe.checkout.Session.create(**create_kwargs)
    except stripe.error.StripeError as e:
        logger.exception("Stripe session creation failed")
        await db.orders.delete_one({"order_number": order_number})
        raise HTTPException(502, f"Could not initiate checkout: {e}")

    # Link session to order
    await db.orders.update_one(
        {"order_number": order_number},
        {"$set": {"stripe_session_id": session.id}},
    )

    # Create payment_transactions record
    tx = PaymentTransaction(
        session_id=session.id,
        order_number=order_number,
        email=payload.email,
        amount=float(amounts["total"]),
        currency=CURRENCY,
        payment_status="initiated",
        status="open",
        metadata=metadata,
    )
    await db.payment_transactions.insert_one(tx.model_dump())

    return {
        "url": session.url,
        "session_id": session.id,
        "order_number": order_number,
    }


async def _fulfill_order(session_id: str, status_resp: CheckoutStatus) -> Optional[dict]:
    """Idempotent: only fulfills if not already fulfilled. Returns order doc or None."""
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        logger.warning(f"No transaction found for session {session_id}")
        return None

    new_payment_status = status_resp.payment_status  # 'paid' | 'unpaid' | 'no_payment_required'
    new_status = status_resp.status  # 'open' | 'complete' | 'expired'

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "payment_status": new_payment_status,
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )

    if tx.get("fulfilled"):
        # Already processed — return current order
        return await db.orders.find_one({"order_number": tx["order_number"]}, {"_id": 0})

    if new_payment_status != "paid":
        return await db.orders.find_one({"order_number": tx["order_number"]}, {"_id": 0})

    # Mark transaction fulfilled FIRST (idempotency lock)
    lock = await db.payment_transactions.update_one(
        {"session_id": session_id, "fulfilled": False},
        {"$set": {"fulfilled": True}},
    )
    if lock.modified_count == 0:
        # Another concurrent caller won the race
        return await db.orders.find_one({"order_number": tx["order_number"]}, {"_id": 0})

    order_number = tx["order_number"]
    order_doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not order_doc:
        return None

    # Apply credits debit, referral payout, mark paid, send email
    email = order_doc["email"].lower().strip()
    credits_applied = float(order_doc.get("credits_applied", 0.0))
    if credits_applied > 0:
        await db.referrals.update_one(
            {"owner_email": email},
            {"$inc": {"credits_earned": -credits_applied}},
        )

    # Referral payout to referrer
    if order_doc.get("discount_code"):
        ref_doc = await db.referrals.find_one({"code": order_doc["discount_code"]}, {"_id": 0})
        if ref_doc and ref_doc.get("owner_email") != email:
            credit = round(float(order_doc.get("subtotal", 0)) * 0.05, 2)
            await db.referrals.update_one(
                {"code": order_doc["discount_code"]},
                {"$inc": {"uses": 1, "credits_earned": credit},
                 "$set": {"last_credit_at": datetime.now(timezone.utc).isoformat()}},
            )

    # Send confirmation email
    buyer_ref = await get_or_create_referral(order_doc["email"])
    order_obj = Order(**order_doc)
    sent = await send_email(
        to=order_doc["email"],
        subject=f"Order {order_number} confirmed · OSneakers",
        html=tpl.order_html(order_obj, buyer_ref["code"]),
    )

    await db.orders.update_one(
        {"order_number": order_number},
        {"$set": {
            "status": "paid",
            "payment_status": "paid",
            "confirmation_email_sent": sent,
            "paid_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return await db.orders.find_one({"order_number": order_number}, {"_id": 0})


def _fetch_status(session_id: str) -> CheckoutStatus:
    """Direct Stripe SDK status fetch with retry — emergent proxy has eventual consistency."""
    _configure_stripe()

    import time as _t

    last_err: Optional[Exception] = None
    # Real users only reach this endpoint AFTER returning from Stripe (10s+ later),
    # by which time the proxy has propagated. Few quick retries cover the edge case
    # of immediately polling after session creation (e.g. tests).
    for attempt in range(5):
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            meta = session.metadata
            if meta is None:
                meta_dict: dict = {}
            elif hasattr(meta, "to_dict_recursive"):
                meta_dict = meta.to_dict_recursive()
            elif hasattr(meta, "to_dict"):
                meta_dict = meta.to_dict()
            else:
                meta_dict = {k: meta[k] for k in meta.keys()}  # type: ignore
            return CheckoutStatus(
                status=session.status or "open",
                payment_status=session.payment_status or "unpaid",
                amount_total=session.amount_total,
                currency=session.currency,
                metadata=meta_dict,
            )
        except stripe.error.InvalidRequestError as e:
            # Proxy lag — session not yet propagated. Retry briefly.
            if "No such checkout.session" in str(e):
                last_err = e
                _t.sleep(0.4)
                continue
            raise HTTPException(502, f"Could not fetch payment status: {e}")
        except stripe.error.StripeError as e:
            raise HTTPException(502, f"Could not fetch payment status: {e}")
    raise HTTPException(502, f"Could not fetch payment status: {last_err}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    status_resp = _fetch_status(session_id)
    order = await _fulfill_order(session_id, status_resp)
    return {
        "session_id": session_id,
        "status": status_resp.status,
        "payment_status": status_resp.payment_status,
        "amount_total": status_resp.amount_total,
        "currency": status_resp.currency,
        "order_number": (order or {}).get("order_number") if order else None,
        "order": order,
    }


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    stripe_checkout = _stripe_client(request)
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
    except Exception as e:
        logger.exception("Stripe webhook verification failed")
        raise HTTPException(400, f"Invalid webhook: {e}")

    session_id = event.session_id
    if not session_id:
        return {"received": True}

    try:
        status_resp = _fetch_status(session_id)
        await _fulfill_order(session_id, status_resp)
    except Exception:
        logger.exception("Webhook fulfillment failed")

    return {"received": True}

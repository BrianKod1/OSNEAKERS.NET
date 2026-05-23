"""All Pydantic models — request/response/database schemas."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Catalog ----------
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    brand: str
    price: float
    original_price: Optional[float] = None
    image: str
    gallery: List[str] = []
    description: str
    sizes: List[str] = []
    colors: List[str] = []
    stock: int = 10
    featured: bool = False
    is_new: bool = False
    tag: Optional[str] = None


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    rating: int
    text: str
    image: Optional[str] = None
    product_name: Optional[str] = None
    verified: bool = True
    created_at: str = Field(default_factory=_now_iso)


# ---------- Orders ----------
class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    size: Optional[str] = None
    quantity: int = 1
    image: Optional[str] = None


class OrderCreate(BaseModel):
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    country: str = "Canada"
    items: List[OrderItem]
    total: float
    notes: Optional[str] = None
    discount_code: Optional[str] = None
    use_credits: bool = False


class CheckoutSessionCreate(BaseModel):
    """Frontend payload to initiate Stripe Checkout. Backend recomputes amounts."""
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    country: str = "Canada"
    items: List[OrderItem]
    notes: Optional[str] = None
    discount_code: Optional[str] = None
    use_credits: bool = False
    origin_url: str


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    email: str
    phone: str
    address: str
    city: str
    country: str
    items: List[OrderItem]
    subtotal: float = 0.0
    discount_code: Optional[str] = None
    discount_amount: float = 0.0
    credits_applied: float = 0.0
    shipping: float = 0.0
    total: float
    notes: Optional[str] = None
    status: str = "pending"
    payment_status: str = "unpaid"
    stripe_session_id: Optional[str] = None
    confirmation_email_sent: bool = False
    created_at: str = Field(default_factory=_now_iso)
    paid_at: Optional[str] = None


class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    order_number: str
    email: str
    amount: float
    currency: str
    payment_status: str = "initiated"  # initiated | paid | failed | expired
    status: str = "open"  # open | complete | expired
    metadata: dict = Field(default_factory=dict)
    fulfilled: bool = False
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


# ---------- Subscribers ----------
class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    email: str
    discount_code: str
    discount_percent: int
    email_sent: bool
    message: str


# ---------- Campaigns ----------
class CampaignCreate(BaseModel):
    code: str
    percent: int
    subject: str
    headline: str
    body: str
    expires_hours: int = 24


class CampaignResult(BaseModel):
    id: str
    code: str
    percent: int
    sent_count: int
    failed_count: int
    total_subscribers: int
    expires_at: str


# ---------- Referrals ----------
class Referral(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_email: str
    code: str
    percent: int = 5
    uses: int = 0
    credits_earned: float = 0.0
    created_at: str = Field(default_factory=_now_iso)


class ShareInvite(BaseModel):
    from_email: EmailStr
    to_email: EmailStr
    note: Optional[str] = None


# ---------- Admin ----------
class ProductUpsert(BaseModel):
    name: str
    brand: str
    price: float
    original_price: Optional[float] = None
    image: str
    gallery: List[str] = []
    description: str = ""
    sizes: List[str] = []
    stock: int = 10
    featured: bool = False
    is_new: bool = False
    tag: Optional[str] = None

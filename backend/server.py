from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
DISCOUNT_CODE = os.environ.get('DISCOUNT_CODE', 'SNEAK10')
DISCOUNT_PERCENT = os.environ.get('DISCOUNT_PERCENT', '10')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

app = FastAPI(title="OSneakers API")
api_router = APIRouter(prefix="/api")


# ============== Models ==============
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
    tag: Optional[str] = None  # e.g. "Limited", "Hot", "New Drop"


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
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


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
    total: float
    notes: Optional[str] = None
    status: str = "pending"
    confirmation_email_sent: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SubscribeRequest(BaseModel):
    email: EmailStr


class SubscribeResponse(BaseModel):
    email: str
    discount_code: str
    discount_percent: int
    email_sent: bool
    message: str


# ============== Seed Data ==============
SEED_PRODUCTS = [
    # Air Jordan
    {"name": "Air Jordan 1 High OG 'Chicago'", "brand": "Air Jordan", "price": 320, "original_price": 380,
     "image": "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwzfHxhaXIlMjBqb3JkYW4lMjBzaG9lfGVufDB8fHx8MTc3OTEzNjU1MHww&ixlib=rb-4.1.0&q=85",
     "description": "The iconic silhouette that started a movement. Premium leather construction with the legendary Chicago colorway.",
     "sizes": ["7", "8", "9", "10", "11", "12"], "colors": ["Red/White/Black"], "featured": True, "tag": "Hot"},
    {"name": "Air Jordan 1 Low 'Reverse Bred'", "brand": "Air Jordan", "price": 240,
     "image": "https://images.unsplash.com/photo-1656944227421-416b1d2186c9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwyfHxhaXIlMjBqb3JkYW4lMjBzaG9lfGVufDB8fHx8MTc3OTEzNjU1MHww&ixlib=rb-4.1.0&q=85",
     "description": "Low-cut take on the iconic AJ1. Classic black-and-red tooling with premium materials.",
     "sizes": ["7", "8", "9", "10", "11"], "colors": ["Black/Red"], "featured": True, "is_new": True, "tag": "New Drop"},
    {"name": "Air Jordan 1 Low 'Triple White'", "brand": "Air Jordan", "price": 220,
     "image": "https://images.unsplash.com/photo-1556906781-9a412961c28c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxhaXIlMjBqb3JkYW4lMjBzaG9lfGVufDB8fHx8MTc3OTEzNjU1MHww&ixlib=rb-4.1.0&q=85",
     "description": "Clean white-on-white minimalism. Pure leather upper, perfect everyday rotation.",
     "sizes": ["8", "9", "10", "11", "12"], "colors": ["White"]},
    {"name": "Air Jordan 4 Retro 'Bred'", "brand": "Air Jordan", "price": 360,
     "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "The grail. Nubuck overlays, visible Air, MJ's championship colorway.",
     "sizes": ["8", "9", "10", "11"], "colors": ["Black/Red"], "featured": True, "tag": "Limited"},

    # Nike
    {"name": "Nike Dunk Low 'Panda'", "brand": "Nike", "price": 180,
     "image": "https://images.unsplash.com/photo-1520316587275-5e4f06f355e6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHw0fHxzbmVha2VyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc5MTM2NTUwfDA&ixlib=rb-4.1.0&q=85",
     "description": "The world's most-wanted Dunk. Crisp white leather with black overlays.",
     "sizes": ["7", "8", "9", "10", "11", "12"], "colors": ["Black/White"], "featured": True},
    {"name": "Nike Air Max 'Volt Orange'", "brand": "Nike", "price": 210,
     "image": "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxzbmVha2VyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc5MTM2NTUwfDA&ixlib=rb-4.1.0&q=85",
     "description": "Built for speed. Bold orange streak across the upper and visible Max Air cushioning.",
     "sizes": ["8", "9", "10", "11"], "colors": ["Orange/Black"], "is_new": True, "tag": "New Drop"},
    {"name": "Nike Kobe 8 'Halo'", "brand": "Nike", "price": 280,
     "image": "https://images.unsplash.com/photo-1605523741177-cd660595c2cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc5MTM2NTUwfDA&ixlib=rb-4.1.0&q=85",
     "description": "Mamba mentality. Premium build for performance and lifestyle.",
     "sizes": ["8", "9", "10", "11", "12"], "colors": ["Red/White"], "tag": "Hot"},
    {"name": "Nike Air Force 1 '07 Triple Black", "brand": "Nike", "price": 160,
     "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Stealth mode AF1. All-black premium leather, the streetwear staple.",
     "sizes": ["7", "8", "9", "10", "11", "12"], "colors": ["Triple Black"]},

    # Adidas
    {"name": "Adidas Samba OG 'Cloud White'", "brand": "Adidas", "price": 150,
     "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Heritage terrace classic. Smooth leather, gum sole, three stripes.",
     "sizes": ["7", "8", "9", "10", "11"], "colors": ["White/Black"], "featured": True},
    {"name": "Adidas Gazelle Bold 'Pink'", "brand": "Adidas", "price": 170,
     "image": "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Elevated retro silhouette with bold platform sole.",
     "sizes": ["6", "7", "8", "9", "10"], "colors": ["Pink/White"], "is_new": True},
    {"name": "Adidas Campus 00s 'Grey'", "brand": "Adidas", "price": 140,
     "image": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Y2K skate classic reborn. Suede upper, vintage silhouette.",
     "sizes": ["7", "8", "9", "10", "11"], "colors": ["Grey/White"]},

    # Yeezy
    {"name": "Yeezy Boost 350 V2 'Zebra'", "brand": "Yeezy", "price": 380, "original_price": 450,
     "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "The most coveted Yeezy. Primeknit upper with iconic SPLY-350 striping.",
     "sizes": ["8", "9", "10", "11"], "colors": ["White/Black"], "featured": True, "tag": "Limited"},
    {"name": "Yeezy Slide 'Bone'", "brand": "Yeezy", "price": 120,
     "image": "https://images.unsplash.com/photo-1620227776637-0bea64c33e29?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Minimalist EVA-based slide. Soft, sculpted, instantly recognizable.",
     "sizes": ["8", "9", "10", "11", "12"], "colors": ["Bone"]},
    {"name": "Yeezy 700 'Wave Runner'", "brand": "Yeezy", "price": 420,
     "image": "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Chunky dad-shoe aesthetic perfected. Boost cushioning beneath suede and mesh.",
     "sizes": ["9", "10", "11"], "colors": ["Solid Grey"], "tag": "Hot"},

    # Balenciaga
    {"name": "Balenciaga Triple S 'Clear Sole'", "brand": "Balenciaga", "price": 1150,
     "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Luxury chunky sneaker. Layered sole, premium mesh and leather construction.",
     "sizes": ["8", "9", "10", "11"], "colors": ["White/Grey"], "featured": True, "tag": "Luxury"},
    {"name": "Balenciaga Speed 2.0 'Black'", "brand": "Balenciaga", "price": 980,
     "image": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Sock-fit silhouette. Stretch knit upper, monochrome finish.",
     "sizes": ["8", "9", "10", "11"], "colors": ["Triple Black"]},
    {"name": "Balenciaga Track Trainer", "brand": "Balenciaga", "price": 1090,
     "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Futuristic 176-piece hiking-inspired luxury trainer.",
     "sizes": ["8", "9", "10", "11"], "colors": ["Black/Yellow"], "tag": "Luxury"},

    # Off-White / Apparel
    {"name": "Off-White x Nike Air Presto", "brand": "Off-White", "price": 890,
     "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Virgil's deconstructed take on the Presto. Industrial branding, premium build.",
     "sizes": ["8", "9", "10", "11"], "colors": ["White/Black"], "featured": True, "tag": "Limited"},
    {"name": "Off-White 'Industrial' Hoodie", "brand": "Off-White", "price": 520,
     "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Heavyweight cotton fleece. Signature diagonal lines, industrial typography.",
     "sizes": ["S", "M", "L", "XL"], "colors": ["Black"]},

    # New Balance
    {"name": "New Balance 9060 'Sea Salt'", "brand": "New Balance", "price": 230,
     "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Futuristic take on the 99X line. Wavy lines and chunky proportions.",
     "sizes": ["8", "9", "10", "11", "12"], "colors": ["Sea Salt"], "is_new": True, "tag": "New Drop"},
    {"name": "New Balance 550 'White Green'", "brand": "New Balance", "price": 180,
     "image": "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Retro basketball revival. Leather upper, perforated toe box.",
     "sizes": ["7", "8", "9", "10", "11"], "colors": ["White/Green"]},

    # Apparel
    {"name": "Essentials Fleece Crewneck", "brand": "Apparel", "price": 130,
     "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Heavyweight fleece crewneck. Premium cotton blend, oversized fit.",
     "sizes": ["S", "M", "L", "XL"], "colors": ["Cement", "Black"]},
    {"name": "Premium Cargo Pants 'Slate'", "brand": "Apparel", "price": 160,
     "image": "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?crop=entropy&cs=srgb&fm=jpg&q=85",
     "description": "Tactical-inspired cargo pant. Heavyweight twill, multi-pocket utility.",
     "sizes": ["S", "M", "L", "XL"], "colors": ["Slate Grey"]},
]

SEED_REVIEWS = [
    {"name": "Marcus T.", "location": "Toronto, ON", "rating": 5,
     "text": "Got my Jordan 1s in 4 days. Packaging was insane and the shoes are 100% legit. OSneakers is the real deal — won't buy anywhere else.",
     "product_name": "Air Jordan 1 High OG",
     "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Aisha K.", "location": "Vancouver, BC", "rating": 5,
     "text": "I've ordered 3 pairs over the past year. Quality and authenticity are unmatched. The team responds within minutes on Instagram.",
     "product_name": "Yeezy 350 V2",
     "image": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Diego R.", "location": "Montréal, QC", "rating": 5,
     "text": "Honestly didn't expect this level of service from a dropshipping site. Tracking was clear, customs handled, and the Balenciagas are perfect.",
     "product_name": "Balenciaga Triple S",
     "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Jordan P.", "location": "Calgary, AB", "rating": 5,
     "text": "Seven years strong. These guys built trust in a market full of scams. Best prices, fastest shipping in Canada.",
     "product_name": "Nike Dunk Low",
     "image": "https://images.unsplash.com/photo-1520316587275-5e4f06f355e6?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Sienna L.", "location": "Ottawa, ON", "rating": 5,
     "text": "Customer service is on another level. They helped me size correctly and shipped same day. Sneakers smell like a boutique.",
     "product_name": "Nike Air Max",
     "image": "https://images.unsplash.com/photo-1585232004423-244e0e6904e3?crop=entropy&cs=srgb&fm=jpg&q=85"},
    {"name": "Kai M.", "location": "Mississauga, ON", "rating": 5,
     "text": "Walked into an event with the Off-White Prestos — got stopped 10 times. OSneakers always has the heat first.",
     "product_name": "Off-White Presto",
     "image": "https://images.unsplash.com/photo-1605523741177-cd660595c2cf?crop=entropy&cs=srgb&fm=jpg&q=85"},
]


# ============== Routes ==============
@api_router.get("/")
async def root():
    return {"message": "OSneakers API", "version": "1.0"}


@api_router.get("/products", response_model=List[Product])
async def list_products(
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = Query(None, regex="^(price_asc|price_desc|newest|featured)$"),
    limit: int = 100,
):
    query = {}
    if brand and brand.lower() != "all":
        query["brand"] = brand
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if featured is not None:
        query["featured"] = featured

    sort_spec = [("featured", -1)]
    if sort == "price_asc":
        sort_spec = [("price", 1)]
    elif sort == "price_desc":
        sort_spec = [("price", -1)]
    elif sort == "newest":
        sort_spec = [("is_new", -1), ("featured", -1)]

    docs = await db.products.find(query, {"_id": 0}).sort(sort_spec).to_list(limit)
    return docs


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return doc


@api_router.get("/brands")
async def list_brands():
    brands = await db.products.distinct("brand")
    counts = []
    for b in brands:
        c = await db.products.count_documents({"brand": b})
        counts.append({"name": b, "count": c})
    return sorted(counts, key=lambda x: -x["count"])


@api_router.get("/reviews", response_model=List[Review])
async def list_reviews():
    docs = await db.reviews.find({}, {"_id": 0}).to_list(100)
    return docs


@api_router.post("/orders", response_model=Order)
async def create_order(payload: OrderCreate):
    # Recompute subtotal & discount server-side
    subtotal = round(sum(i.price * i.quantity for i in payload.items), 2)
    discount_amount = 0.0
    discount_code = None
    if payload.discount_code and payload.discount_code.strip().upper() == DISCOUNT_CODE.upper():
        discount_code = DISCOUNT_CODE
        discount_amount = round(subtotal * (int(DISCOUNT_PERCENT) / 100.0), 2)
    total = round(subtotal - discount_amount, 2)

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
        total=total,
        notes=payload.notes,
    )

    # Try sending confirmation email
    if RESEND_API_KEY:
        try:
            params = {
                "from": f"OSneakers <{SENDER_EMAIL}>",
                "to": [payload.email],
                "subject": f"Order {order_number} confirmed · OSneakers",
                "html": _order_html(order),
            }
            result = await asyncio.to_thread(resend.Emails.send, params)
            order.confirmation_email_sent = bool(result.get("id"))
            logger.info(f"Sent order confirmation to {payload.email}: {result.get('id')}")
        except Exception as e:
            logger.error(f"Failed to send order confirmation to {payload.email}: {e}")

    await db.orders.insert_one(order.model_dump())
    return order


@api_router.get("/orders/{order_number}", response_model=Order)
async def get_order(order_number: str):
    doc = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Order not found")
    return doc


def _welcome_html(discount_code: str, discount_percent: str) -> str:
    return f"""
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;">
          <tr><td align="center">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
              <tr><td style="padding:40px 40px 24px;">
                <div style="font-size:11px;letter-spacing:3px;color:#00E5FF;font-weight:700;text-transform:uppercase;">[ WELCOME TO THE DROP ]</div>
                <h1 style="margin:16px 0 0;font-size:42px;line-height:1;letter-spacing:-1.5px;color:#ffffff;font-weight:900;text-transform:uppercase;">You're in.</h1>
              </td></tr>
              <tr><td style="padding:0 40px 24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#a1a1aa;font-weight:300;">Thanks for stepping into OSneakers. As promised, here's <strong style="color:#fff;font-weight:600;">{discount_percent}% off</strong> your first drop:</p>
              </td></tr>
              <tr><td align="center" style="padding:8px 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="background:#050505;border:1px solid #00E5FF;">
                  <tr><td align="center" style="padding:22px 36px;">
                    <div style="font-size:10px;letter-spacing:4px;color:#71717a;text-transform:uppercase;font-weight:700;margin-bottom:6px;">CODE</div>
                    <div style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:6px;color:#00E5FF;font-weight:700;">{discount_code}</div>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td align="center" style="padding:0 40px 40px;">
                <a href="https://osneakers.net" style="display:inline-block;background:#00E5FF;color:#050505;padding:16px 36px;font-weight:900;letter-spacing:3px;font-size:12px;text-decoration:none;text-transform:uppercase;">SHOP THE DROP →</a>
              </td></tr>
              <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;color:#71717a;line-height:1.6;">OSneakers · Ontario, Canada · est. 2018<br/>Premium dropshipping for the world's most-wanted sneakers.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
    """


def _order_html(order: "Order") -> str:
    rows = "".join(
        f"""<tr>
            <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:14px;">
                <strong style="color:#fff;font-weight:600;">{i.name}</strong>
                <div style="color:#71717a;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">
                    {f"Size {i.size} · " if i.size else ""}Qty {i.quantity}
                </div>
            </td>
            <td align="right" style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-family:'Courier New',monospace;font-size:14px;">${i.price * i.quantity:.2f}</td>
        </tr>"""
        for i in order.items
    )
    discount_row = (
        f"""<tr><td style="padding:6px 0;color:#CCFF00;font-size:13px;">Discount ({order.discount_code})</td>
        <td align="right" style="padding:6px 0;color:#CCFF00;font-family:'Courier New',monospace;font-size:13px;">−${order.discount_amount:.2f}</td></tr>"""
        if order.discount_amount > 0 else ""
    )
    return f"""
    <!doctype html><html><body style="margin:0;padding:0;background:#050505;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#fff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:48px 16px;">
        <tr><td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.08);">
            <tr><td style="padding:40px 40px 8px;">
              <div style="font-size:11px;letter-spacing:3px;color:#00E5FF;font-weight:700;text-transform:uppercase;">[ ORDER CONFIRMED ]</div>
              <h1 style="margin:14px 0 6px;font-size:38px;line-height:1;letter-spacing:-1.5px;color:#fff;font-weight:900;text-transform:uppercase;">You're locked in.</h1>
              <p style="margin:8px 0 0;font-size:12px;letter-spacing:3px;color:#71717a;text-transform:uppercase;font-weight:700;">{order.order_number}</p>
            </td></tr>
            <tr><td style="padding:24px 40px 0;">
              <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.7;">Hey {order.customer_name.split()[0]} — we got your order. Our team will reach out within the hour to confirm sizing & payment.</p>
            </td></tr>
            <tr><td style="padding:24px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table>
            </td></tr>
            <tr><td style="padding:8px 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#a1a1aa;font-size:13px;">Subtotal</td>
                <td align="right" style="padding:6px 0;color:#a1a1aa;font-family:'Courier New',monospace;font-size:13px;">${order.subtotal:.2f}</td></tr>
                {discount_row}
                <tr><td style="padding:6px 0;color:#a1a1aa;font-size:13px;">Shipping</td>
                <td align="right" style="padding:6px 0;color:#CCFF00;font-family:'Courier New',monospace;font-size:13px;">FREE</td></tr>
                <tr><td style="padding:14px 0 6px;border-top:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">Total</td>
                <td align="right" style="padding:14px 0 6px;border-top:1px solid rgba(255,255,255,0.1);color:#00E5FF;font-family:'Courier New',monospace;font-size:24px;font-weight:700;">${order.total:.2f}</td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:8px 40px 40px;color:#71717a;font-size:11px;line-height:1.7;">
              <strong style="color:#fff;letter-spacing:2px;text-transform:uppercase;">Ship to</strong><br/>
              {order.customer_name}<br/>{order.address}<br/>{order.city}, {order.country}<br/>{order.phone}
            </td></tr>
            <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);color:#71717a;font-size:11px;">
              OSneakers · Ontario, Canada · est. 2018<br/>Questions? Reply to this email or call +1 (289) 600-7311.
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>"""


@api_router.post("/validate-discount")
async def validate_discount(payload: dict):
    code = (payload.get("code") or "").strip().upper()
    if code == DISCOUNT_CODE.upper():
        return {"valid": True, "code": DISCOUNT_CODE, "percent": int(DISCOUNT_PERCENT)}
    return {"valid": False, "code": code, "percent": 0}


@api_router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(payload: SubscribeRequest):
    email = payload.email.lower()
    discount_pct = int(DISCOUNT_PERCENT)
    now_iso = datetime.now(timezone.utc).isoformat()

    existing = await db.subscribers.find_one({"email": email}, {"_id": 0})
    if not existing:
        await db.subscribers.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "discount_code": DISCOUNT_CODE,
            "subscribed_at": now_iso,
        })

    email_sent = False
    message = "Welcome to OSneakers. Your discount code is ready."
    if RESEND_API_KEY:
        try:
            params = {
                "from": f"OSneakers <{SENDER_EMAIL}>",
                "to": [email],
                "subject": f"You're in. Here's {DISCOUNT_PERCENT}% off your first drop.",
                "html": _welcome_html(DISCOUNT_CODE, DISCOUNT_PERCENT),
            }
            result = await asyncio.to_thread(resend.Emails.send, params)
            email_sent = bool(result.get("id"))
            logger.info(f"Sent welcome email to {email}: {result.get('id')}")
        except Exception as e:
            logger.error(f"Failed to send welcome email to {email}: {e}")
            message = "Code generated. Email delivery failed but your code is valid."
    else:
        message = "Code generated (email service not configured)."

    return SubscribeResponse(
        email=email,
        discount_code=DISCOUNT_CODE,
        discount_percent=discount_pct,
        email_sent=email_sent,
        message=message,
    )


# ============== Seed on startup ==============
@app.on_event("startup")
async def seed_db():
    if await db.products.count_documents({}) == 0:
        products = [Product(**p).model_dump() for p in SEED_PRODUCTS]
        await db.products.insert_many(products)
        logging.info(f"Seeded {len(products)} products")
    if await db.reviews.count_documents({}) == 0:
        reviews = [Review(**r).model_dump() for r in SEED_REVIEWS]
        await db.reviews.insert_many(reviews)
        logging.info(f"Seeded {len(reviews)} reviews")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

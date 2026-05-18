"""Product catalog routes."""
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from database import db
from models import Product

router = APIRouter()


@router.get("/products", response_model=List[Product])
async def list_products(
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = Query(None, regex="^(price_asc|price_desc|newest|featured)$"),
    limit: int = 100,
):
    query: dict = {}
    if brand and brand.lower() != "all":
        query["brand"] = brand
    if min_price is not None or max_price is not None:
        price_q: dict = {}
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


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return doc


@router.get("/brands")
async def list_brands():
    brands = await db.products.distinct("brand")
    counts = []
    for b in brands:
        c = await db.products.count_documents({"brand": b})
        counts.append({"name": b, "count": c})
    return sorted(counts, key=lambda x: -x["count"])

"""Reviews routes."""
from typing import List

from fastapi import APIRouter

from database import db
from models import Review

router = APIRouter()


@router.get("/reviews", response_model=List[Review])
async def list_reviews():
    docs = await db.reviews.find({}, {"_id": 0}).to_list(100)
    return docs

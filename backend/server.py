"""OSneakers FastAPI entry point — wires middleware, routers, scheduler, seed."""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import close_db, db
from models import Product, Review
from routes import account, admin, orders, products, referrals, reviews, subscribe
from seed import SEED_PRODUCTS, SEED_REVIEWS
from services import run_credit_reminder, run_digest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="OSneakers API")

# All routes mounted under /api
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "OSneakers API", "version": "1.0"}


api_router.include_router(products.router)
api_router.include_router(reviews.router)
api_router.include_router(orders.router)
api_router.include_router(subscribe.router)
api_router.include_router(referrals.router)
api_router.include_router(account.router)
api_router.include_router(admin.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Seed catalog on first run
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([Product(**p).model_dump() for p in SEED_PRODUCTS])
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products")
    if await db.reviews.count_documents({}) == 0:
        await db.reviews.insert_many([Review(**r).model_dump() for r in SEED_REVIEWS])
        logger.info(f"Seeded {len(SEED_REVIEWS)} reviews")

    # Background jobs — weekly digest + credit reminders
    try:
        scheduler = AsyncIOScheduler(timezone="America/Toronto")
        scheduler.add_job(
            run_digest,
            CronTrigger(day_of_week="fri", hour=10, minute=0),
            id="weekly_digest",
            replace_existing=True,
        )
        scheduler.add_job(
            run_credit_reminder,
            CronTrigger(day_of_week="mon", hour=10, minute=0),
            id="weekly_credit_reminder",
            replace_existing=True,
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info("Background scheduler started (Fri digest 10:00 ET, Mon credit reminder 10:00 ET)")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    await close_db()

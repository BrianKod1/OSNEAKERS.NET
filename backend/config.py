"""Centralized configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
DISCOUNT_CODE = os.environ.get("DISCOUNT_CODE", "SNEAK10")
DISCOUNT_PERCENT = int(os.environ.get("DISCOUNT_PERCENT", "10"))
ADMIN_PASSCODE = os.environ.get("ADMIN_PASSCODE", "osneakers-admin-2026")

CREDIT_EXPIRY_DAYS = 90
STORE_URL = os.environ.get("STORE_URL", "https://osneakers.net")

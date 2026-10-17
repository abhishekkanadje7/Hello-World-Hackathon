import os
from pydantic import BaseModel
from datetime import timedelta

class SystemWeights(BaseModel):
    frustration_weight: float = 0.40
    urgency_weight: float = 0.40
    customer_value_weight: float = 0.20
    critical_threshold: int = 70
    standard_threshold: int = 40

CURRENT_WEIGHTS = SystemWeights()

PLAN_VALUE_MAP = {
    "vip": 100,
    "enterprise": 100,
    "premium": 60,
    "pro": 60,
    "regular": 20,
    "free": 20
}

JWT_SECRET = os.getenv("JWT_SECRET", "triagex-jwt-secret-demo-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 12

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "abhishekkanadje7@gmail.com").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Abhi*2007...")


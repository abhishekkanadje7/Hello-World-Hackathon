import os
from pydantic import BaseModel

class SystemWeights(BaseModel):
    frustration_weight: float = 0.40
    urgency_weight: float = 0.40
    customer_value_weight: float = 0.20
    critical_threshold: int = 70
    standard_threshold: int = 40

# Current active weights (can be updated dynamically by Admin)
CURRENT_WEIGHTS = SystemWeights()

PLAN_VALUE_MAP = {
    "enterprise": 100,
    "pro": 60,
    "free": 20
}

SECRET_KEY = "triagex-secret-key-hackathon-2026"
ALGORITHM = "HS256"

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    # Client might try to pass role or customer_type, server will explicitly ignore them
    role: Optional[str] = None
    customer_type: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str  # "customer" | "agent" | "admin"
    agent_level: Optional[str] = None  # "Senior" | "Standard" | null
    customer_type: Optional[str] = None  # "Regular" | "Premium" | "VIP" | null
    is_active: bool = True
    must_change_password: bool = False
    created_at: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TicketCreateCustomerRequest(BaseModel):
    subject: str
    description: str
    category: Optional[str] = "Technical"
    channel: Optional[str] = "web"

class TicketReplyRequest(BaseModel):
    message: str
    is_internal: bool = False

class TicketReplyResponse(BaseModel):
    id: str
    ticket_id: str
    author_id: Optional[str] = None
    author_name: str
    author_role: str
    message: str
    is_internal: bool = False
    created_at: str

class ExplainabilityItem(BaseModel):
    factor: str
    score: float
    weight: float
    contribution: float
    detail: str

class ExplainabilityBreakdown(BaseModel):
    frustration_score: float
    urgency_score: float
    customer_value_score: float
    total_priority_score: int
    assigned_tier: str  # "Critical" | "Standard" | "Routine"
    factors: List[ExplainabilityItem]
    detected_keywords: List[str]
    sentiment_compound: float
    summary: str

class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_email: str
    customer_type: str
    channel: str
    category: str
    subject: str
    description: str
    created_at: str
    status: str  # "Open" | "In Progress" | "Resolved"
    priority_score: int
    assigned_tier: str  # "Critical" | "Standard" | "Routine"
    assigned_agent_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    routing_reason: str
    explainability: ExplainabilityBreakdown
    kb_auto_reply: Optional[Dict[str, Any]] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[str] = None
    sla_due_at: str
    replies: Optional[List[TicketReplyResponse]] = None

class WeightsUpdateRequest(BaseModel):
    frustration_weight: float
    urgency_weight: float
    customer_value_weight: float
    critical_threshold: int
    standard_threshold: int

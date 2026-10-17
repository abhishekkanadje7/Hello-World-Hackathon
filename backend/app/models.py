from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str  # "admin", "senior_agent", "standard_agent", "customer"
    plan_tier: Optional[str] = "free"
    avatar: Optional[str] = None

class TicketCreateRequest(BaseModel):
    customer_name: str
    customer_email: str
    plan_tier: str = "free"  # "free", "pro", "enterprise"
    channel: str = "web"  # "web", "email", "chat"
    category: str = "Technical"  # "Technical", "Billing", "Account", "Outage", "General"
    subject: str
    description: str

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
    assigned_tier: str  # "Senior Agent", "Standard Agent", "KB Auto-reply"
    factors: List[ExplainabilityItem]
    detected_keywords: List[str]
    sentiment_compound: float
    summary: str

class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    customer_name: str
    customer_email: str
    plan_tier: str
    channel: str
    category: str
    subject: str
    description: str
    created_at: str
    status: str  # "Open", "In Progress", "Escalated", "Resolved", "Auto-Resolved"
    priority_score: int
    assigned_tier: str  # "Senior Agent", "Standard Agent", "KB Auto-reply"
    assigned_agent: Optional[str] = None
    routing_reason: str
    explainability: ExplainabilityBreakdown
    kb_auto_reply: Optional[Dict[str, Any]] = None
    resolution_note: Optional[str] = None
    sla_minutes_remaining: Optional[int] = 60

class TicketStatusUpdate(BaseModel):
    status: str
    assigned_agent: Optional[str] = None
    resolution_note: Optional[str] = None

class WeightsUpdateRequest(BaseModel):
    frustration_weight: float
    urgency_weight: float
    customer_value_weight: float
    critical_threshold: int
    standard_threshold: int

class KnowledgeBaseArticle(BaseModel):
    id: str
    title: str
    category: str
    keywords: List[str]
    content: str
    confidence_threshold: float = 0.65

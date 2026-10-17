import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from .config import CURRENT_WEIGHTS, SystemWeights
from .models import (
    UserLoginRequest, UserProfile, TicketCreateRequest,
    TicketResponse, TicketStatusUpdate, WeightsUpdateRequest
)
from .database import (
    init_db, get_all_tickets, get_ticket_by_id, insert_ticket,
    update_ticket_status, get_user_by_email, get_audit_logs,
    recalculate_all_tickets_scores, get_connection
)
from .nlp_engine import (
    analyze_sentiment_and_frustration, analyze_urgency,
    build_explainability_and_route
)
from .kb_engine import find_kb_match, DEFAULT_KB_ARTICLES
from .websocket_manager import ws_manager

app = FastAPI(
    title="TriageX Predictive Customer Support Triage & Sentiment Router API",
    version="2.0.0",
    description="Full-stack AI-driven support triage with sentiment analysis, urgency detection, and explainable priority routing."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# --- HEALTH ---
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TriageX Engine",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "active_weights": CURRENT_WEIGHTS.dict()
    }

# --- AUTH ---
@app.get("/api/auth/demo-users")
def get_demo_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, role, plan_tier, avatar FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/auth/login")
def login(req: UserLoginRequest):
    user = get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid password")
        
    return {
        "token": f"token-{user['id']}-{int(datetime.utcnow().timestamp())}",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "plan_tier": user["plan_tier"],
            "avatar": user["avatar"]
        }
    }

# --- TICKETS ---
@app.get("/api/tickets")
def list_tickets(status: Optional[str] = None, tier: Optional[str] = None):
    tickets = get_all_tickets()
    if status:
        tickets = [t for t in tickets if t["status"].lower() == status.lower()]
    if tier:
        tickets = [t for t in tickets if t["assigned_tier"].lower() == tier.lower()]
    return tickets

@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.post("/api/tickets/preview-score")
def preview_ticket_score(req: Dict[str, Any]):
    subject = req.get("subject", "")
    description = req.get("description", "")
    plan_tier = req.get("plan_tier", "free")
    
    full_text = f"{subject}\n{description}"
    frust, compound, frust_kws = analyze_sentiment_and_frustration(full_text)
    urgency, urgency_kws = analyze_urgency(full_text)
    kb_match = find_kb_match(full_text)
    
    expl = build_explainability_and_route(subject, description, plan_tier, kb_match, CURRENT_WEIGHTS)
    return {
        "frustration_score": frust,
        "sentiment_compound": compound,
        "urgency_score": urgency,
        "priority_score": expl.total_priority_score,
        "predicted_tier": expl.assigned_tier,
        "kb_match": kb_match,
        "keywords": list(set(frust_kws + urgency_kws))
    }

@app.post("/api/tickets")
async def create_ticket(req: TicketCreateRequest):
    ticket_id = f"t-{uuid.uuid4().hex[:8]}"
    ticket_number = f"TX-{uuid.uuid4().hex[:4].upper()}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # 1. Check Knowledge Base Match
    full_text = f"{req.subject}\n{req.description}"
    kb_match = find_kb_match(full_text)
    
    # 2. Run NLP & Explainability Engine
    expl = build_explainability_and_route(
        req.subject,
        req.description,
        req.plan_tier,
        kb_match,
        CURRENT_WEIGHTS
    )
    
    # 3. Determine status and assignment
    if expl.assigned_tier == "KB Auto-reply":
        initial_status = "Auto-Resolved"
        assigned_agent = "AI Knowledge Base Bot"
        res_note = f"Auto-resolved with article: '{kb_match.get('title')}'. Customer notified via email."
    elif expl.assigned_tier == "Senior Agent":
        initial_status = "Escalated"
        assigned_agent = "Pooja Sharma (Senior Agent)"
        res_note = None
    else:
        initial_status = "Open"
        assigned_agent = "Vikas Patil (Support Agent)"
        res_note = None
        
    ticket_data = {
        "id": ticket_id,
        "ticket_number": ticket_number,
        "customer_name": req.customer_name,
        "customer_email": req.customer_email,
        "plan_tier": req.plan_tier.lower(),
        "channel": req.channel.lower(),
        "category": req.category,
        "subject": req.subject,
        "description": req.description,
        "created_at": now_iso,
        "status": initial_status,
        "priority_score": expl.total_priority_score,
        "assigned_tier": expl.assigned_tier,
        "assigned_agent": assigned_agent,
        "routing_reason": expl.summary,
        "explainability": expl.dict(),
        "kb_auto_reply": kb_match,
        "resolution_note": res_note,
        "sla_minutes_remaining": 30 if expl.total_priority_score >= 70 else 120
    }
    
    saved_ticket = insert_ticket(ticket_data)
    
    # Broadcast to all open agent dashboards via WebSockets!
    await ws_manager.broadcast("TICKET_CREATED", saved_ticket)
    
    return saved_ticket

@app.patch("/api/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, req: TicketStatusUpdate):
    updated = update_ticket_status(
        ticket_id=ticket_id,
        status=req.status,
        assigned_agent=req.assigned_agent,
        note=req.resolution_note
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    await ws_manager.broadcast("TICKET_UPDATED", updated)
    return updated

# --- STATS & ANALYTICS ---
@app.get("/api/stats")
def get_dashboard_stats():
    tickets = get_all_tickets()
    total = len(tickets)
    critical_count = sum(1 for t in tickets if t["priority_score"] >= CURRENT_WEIGHTS.critical_threshold)
    escalated_count = sum(1 for t in tickets if t["status"] in ["Escalated", "In Progress"])
    resolved_count = sum(1 for t in tickets if t["status"] in ["Resolved", "Auto-Resolved"])
    auto_resolved_count = sum(1 for t in tickets if t["status"] == "Auto-Resolved")
    
    avg_score = round(sum(t["priority_score"] for t in tickets) / total, 1) if total > 0 else 0
    kb_deflection_rate = round((auto_resolved_count / total * 100), 1) if total > 0 else 0
    churn_risk_mitigated = sum(1 for t in tickets if t["plan_tier"] == "enterprise" and t["priority_score"] >= 70)
    
    # Sentiment distribution
    sentiment_dist = {"frustrated": 0, "neutral": 0, "satisfied": 0}
    for t in tickets:
        comp = t.get("explainability", {}).get("sentiment_compound", 0)
        if comp <= -0.15:
            sentiment_dist["frustrated"] += 1
        elif comp >= 0.15:
            sentiment_dist["satisfied"] += 1
        else:
            sentiment_dist["neutral"] += 1
            
    # Plan distribution
    plan_dist = {"enterprise": 0, "pro": 0, "free": 0}
    for t in tickets:
        tier = t.get("plan_tier", "free")
        if tier in plan_dist:
            plan_dist[tier] += 1
            
    return {
        "total_tickets": total,
        "critical_priority_count": critical_count,
        "escalated_count": escalated_count,
        "resolved_count": resolved_count,
        "auto_resolved_count": auto_resolved_count,
        "average_priority_score": avg_score,
        "kb_deflection_rate_percentage": kb_deflection_rate,
        "churn_risk_mitigated_vip": churn_risk_mitigated,
        "sentiment_distribution": sentiment_dist,
        "plan_distribution": plan_dist,
        "active_weights": CURRENT_WEIGHTS.dict(),
        "avg_first_response_minutes": 4.2
    }

# --- ADMIN WEIGHTS CONFIGURATION ---
@app.get("/api/admin/weights")
def get_weights():
    return CURRENT_WEIGHTS.dict()

@app.post("/api/admin/weights")
async def update_weights(req: WeightsUpdateRequest):
    global CURRENT_WEIGHTS
    CURRENT_WEIGHTS.frustration_weight = req.frustration_weight
    CURRENT_WEIGHTS.urgency_weight = req.urgency_weight
    CURRENT_WEIGHTS.customer_value_weight = req.customer_value_weight
    CURRENT_WEIGHTS.critical_threshold = req.critical_threshold
    CURRENT_WEIGHTS.standard_threshold = req.standard_threshold
    
    # Trigger recalculation of all tickets
    count = recalculate_all_tickets_scores(CURRENT_WEIGHTS)
    
    all_updated = get_all_tickets()
    await ws_manager.broadcast("WEIGHTS_RECALCULATED", {
        "new_weights": CURRENT_WEIGHTS.dict(),
        "recalculated_count": count,
        "tickets": all_updated
    })
    
    return {
        "message": f"Successfully updated weights and recalculated {count} tickets",
        "weights": CURRENT_WEIGHTS.dict()
    }

@app.get("/api/admin/audit-logs")
def list_audit_logs():
    return get_audit_logs()

# --- KNOWLEDGE BASE ---
@app.get("/api/kb/articles")
def list_kb_articles():
    return DEFAULT_KB_ARTICLES

# --- REAL-TIME WEBSOCKET ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive or client pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

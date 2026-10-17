import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware

from .config import CURRENT_WEIGHTS, SystemWeights
from .models import (
    RegisterRequest, LoginRequest, ChangePasswordRequest, UserResponse,
    AuthTokenResponse, TicketCreateCustomerRequest, TicketReplyRequest,
    TicketReplyResponse, TicketResponse, WeightsUpdateRequest
)
from .auth import (
    hash_password, verify_password, validate_password_strength,
    create_access_token, get_current_user, require_role
)
from .database import (
    init_db, get_user_by_email, get_user_by_id, create_customer_user,
    record_failed_login, reset_failed_login, update_user_password,
    get_tickets_for_user, get_ticket_by_id, insert_ticket,
    get_replies_for_ticket, insert_ticket_reply, update_ticket_status,
    get_audit_logs, recalculate_all_tickets_scores, calculate_sla_due,
    get_connection
)
from .nlp_engine import (
    analyze_sentiment_and_frustration, analyze_urgency,
    build_explainability_and_route
)
from .kb_engine import find_kb_match, DEFAULT_KB_ARTICLES
from .websocket_manager import ws_manager

app = FastAPI(
    title="TriageX Predictive Customer Support Triage & Sentiment Router API",
    version="2.1.0",
    description="Full-stack AI-driven support triage with RBAC, JWT auth, SLA guarantees, and explainable priority routing."
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
        "version": "2.1.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "active_weights": CURRENT_WEIGHTS.dict()
    }

# --- AUTH ENDPOINTS ---

@app.get("/api/auth/demo-users")
def get_demo_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, name, email, role, agent_level, customer_type, is_active, must_change_password 
    FROM users 
    WHERE email IN (
        'admin@triagex.com', 
        'senior@triagex.com', 
        'agent@triagex.com', 
        'customer@triagex.com'
    )
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/auth/register", response_model=AuthTokenResponse)
def register_customer(req: RegisterRequest):
    # Validate password strength (min 8 chars, letter, number)
    validate_password_strength(req.password)
    
    # Check if email exists
    clean_email = req.email.strip().lower()
    existing = get_user_by_email(clean_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    # Strictly enforce role='customer' and customer_type='Regular' regardless of what client sent
    pw_hash = hash_password(req.password)
    new_user = create_customer_user(req.name, clean_email, pw_hash)
    
    token = create_access_token({"sub": new_user["id"], "role": "customer", "email": clean_email})
    
    safe_user = {k: v for k, v in new_user.items() if k != "password_hash"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": safe_user
    }

@app.post("/api/auth/login", response_model=AuthTokenResponse)
def login(req: LoginRequest):
    clean_email = req.email.strip().lower()
    user = get_user_by_email(clean_email)
    
    # Generic error message to prevent account enumeration
    GENERIC_ERR = "Invalid email or password."
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_ERR)
        
    # Check if account is locked
    locked_until_str = user.get("locked_until")
    if locked_until_str:
        try:
            locked_until_dt = datetime.fromisoformat(locked_until_str.replace("Z", ""))
            if datetime.utcnow() < locked_until_dt:
                mins_left = max(1, int((locked_until_dt - datetime.utcnow()).total_seconds() / 60))
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Account is temporarily locked due to multiple failed login attempts. Please try again after {mins_left} minute(s)."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    # Check if active
    if not user.get("is_active", 1):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account is deactivated. Please contact an administrator."
        )
        
    # Verify password
    if not verify_password(req.password, user["password_hash"]):
        attempts = record_failed_login(user)
        if attempts >= 5:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after 5 minutes."
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_ERR)
        
    # Successful login: reset failed counter
    reset_failed_login(user["id"])
    
    token = create_access_token({
        "sub": user["id"],
        "role": user["role"],
        "email": user["email"]
    })
    
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": safe_user
    }

@app.get("/api/auth/me")
def get_current_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@app.post("/api/auth/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_db = get_user_by_id(current_user["id"])
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_password(req.current_password, user_db["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
        
    validate_password_strength(req.new_password)
    
    new_hash = hash_password(req.new_password)
    update_user_password(current_user["id"], new_hash)
    
    return {"message": "Password changed successfully."}

# --- TICKETS ENDPOINTS (RBAC PROTECTED) ---

@app.get("/api/tickets")
def list_tickets(
    status_filter: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    tickets = get_tickets_for_user(current_user)
    if status_filter:
        tickets = [t for t in tickets if t["status"].lower() == status_filter.lower()]
    return tickets

@app.get("/api/tickets/{ticket_id}")
def get_ticket(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Check permissions
    role = current_user.get("role")
    if role == "customer" and ticket.get("customer_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only view your own tickets."
        )
    elif role == "agent":
        agent_level = current_user.get("agent_level", "Standard")
        if agent_level == "Senior":
            if ticket["assigned_tier"] != "Critical" and ticket.get("assigned_agent_id") != current_user["id"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for your agent tier.")
        else:
            if ticket["assigned_tier"] not in ["Standard", "Routine"] and ticket.get("assigned_agent_id") != current_user["id"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for your agent tier.")
                
    # Fetch replies
    is_cust = (role == "customer")
    ticket["replies"] = get_replies_for_ticket(ticket["id"], is_customer=is_cust)
    return ticket

@app.post("/api/tickets/preview-score")
def preview_ticket_score(req: Dict[str, Any]):
    subject = req.get("subject", "")
    description = req.get("description", "")
    customer_type = req.get("customer_type", "Regular")
    
    full_text = f"{subject}\n{description}"
    frust, compound, frust_kws = analyze_sentiment_and_frustration(full_text)
    urgency, urgency_kws = analyze_urgency(full_text)
    kb_match = find_kb_match(full_text)
    
    expl = build_explainability_and_route(subject, description, customer_type, kb_match, CURRENT_WEIGHTS)
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
async def create_ticket(
    req: TicketCreateCustomerRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ticket_id = f"t-{uuid.uuid4().hex[:8]}"
    ticket_number = f"TX-{uuid.uuid4().hex[:4].upper()}"
    now_dt = datetime.utcnow()
    now_iso = now_dt.isoformat() + "Z"
    
    # Customer type ALWAYS comes from user account, never from client form!
    customer_type = current_user.get("customer_type") or "Regular"
    customer_id = current_user["id"]
    customer_name = current_user["name"]
    customer_email = current_user["email"]
    
    # 1. Check Knowledge Base Match
    full_text = f"{req.subject}\n{req.description}"
    kb_match = find_kb_match(full_text)
    
    # 2. Run NLP & Explainability Engine
    expl = build_explainability_and_route(
        req.subject,
        req.description,
        customer_type,
        kb_match,
        CURRENT_WEIGHTS
    )
    
    # 3. Calculate SLA
    sla_due = calculate_sla_due(now_dt, expl.assigned_tier)
    
    # 4. Determine status & agent
    if expl.assigned_tier == "Routine" and kb_match:
        initial_status = "Resolved"
        resolved_at = now_iso
        assigned_agent_id = None
        assigned_agent_name = "AI Knowledge Base Bot"
        res_note = f"Auto-resolved with FAQ: '{kb_match.get('title')}'."
    elif expl.assigned_tier == "Critical":
        initial_status = "Open"
        resolved_at = None
        assigned_agent_id = None
        assigned_agent_name = "Senior Agent Queue"
        res_note = None
    else:
        initial_status = "Open"
        resolved_at = None
        assigned_agent_id = None
        assigned_agent_name = "Standard Agent Queue"
        res_note = None
        
    ticket_data = {
        "id": ticket_id,
        "ticket_number": ticket_number,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_type": customer_type,
        "channel": (req.channel or "web").lower(),
        "category": req.category or "General",
        "subject": req.subject,
        "description": req.description,
        "created_at": now_iso,
        "status": initial_status,
        "priority_score": expl.total_priority_score,
        "assigned_tier": expl.assigned_tier,
        "assigned_agent_id": assigned_agent_id,
        "assigned_agent_name": assigned_agent_name,
        "routing_reason": expl.summary,
        "explainability": expl.dict(),
        "kb_auto_reply": kb_match,
        "resolution_note": res_note,
        "resolved_at": resolved_at,
        "sla_due_at": sla_due
    }
    
    saved_ticket = insert_ticket(ticket_data)
    
    # If KB auto-match, store as system reply
    if kb_match and initial_status == "Resolved":
        reply_id = f"rep-{uuid.uuid4().hex[:8]}"
        insert_ticket_reply({
            "id": reply_id,
            "ticket_id": ticket_id,
            "author_id": None,
            "author_name": "AI Knowledge Base",
            "author_role": "system",
            "message": f"Hello {customer_name},\n\nOur automated knowledge base matched your question with our official guide:\n\n### {kb_match['title']}\n{kb_match['snippet']}\n\nThis ticket has been marked as resolved. If this did not solve your inquiry, simply reply to this thread and an agent will assist you.",
            "is_internal": False,
            "created_at": now_iso
        })
        
    # Broadcast to open dashboards via WebSocket
    await ws_manager.broadcast("TICKET_CREATED", saved_ticket)
    return saved_ticket

# --- TICKET REPLIES ENDPOINTS ---

@app.get("/api/tickets/{ticket_id}/replies")
def list_ticket_replies(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    role = current_user.get("role")
    if role == "customer":
        if ticket.get("customer_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        return get_replies_for_ticket(ticket_id, is_customer=True)
    else:
        return get_replies_for_ticket(ticket_id, is_customer=False)

@app.post("/api/tickets/{ticket_id}/replies")
async def create_reply(
    ticket_id: str,
    req: TicketReplyRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    role = current_user.get("role")
    
    # Permission check
    if role == "customer":
        if ticket.get("customer_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        # Customers can NEVER post internal notes
        is_internal = False
    else:
        is_internal = req.is_internal
        
    reply_id = f"rep-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    reply_data = {
        "id": reply_id,
        "ticket_id": ticket_id,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "author_role": role,
        "message": req.message,
        "is_internal": is_internal,
        "created_at": now_iso
    }
    
    saved_reply = insert_ticket_reply(reply_data)
    
    # Broadcast reply
    await ws_manager.broadcast("REPLY_ADDED", {
        "ticket_id": ticket_id,
        "reply": saved_reply
    })
    
    return saved_reply

# --- STATUS & RESOLUTION ---

@app.patch("/api/tickets/{ticket_id}/status")
async def update_status(
    ticket_id: str,
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("agent", "admin"))
):
    new_status = req.get("status")
    if new_status not in ["Open", "In Progress", "Resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")
        
    updated = update_ticket_status(
        ticket_id=ticket_id,
        status=new_status,
        assigned_agent_id=req.get("assigned_agent_id"),
        assigned_agent_name=req.get("assigned_agent_name"),
        note=req.get("resolution_note")
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    await ws_manager.broadcast("TICKET_UPDATED", updated)
    return updated

# --- STATS & ADMIN (WEIGHTS) ---

@app.get("/api/stats")
def get_dashboard_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets")
    rows = cursor.fetchall()
    conn.close()
    
    tickets = [dict(r) for r in rows]
    total = len(tickets)
    critical_count = sum(1 for t in tickets if t["assigned_tier"] == "Critical")
    in_progress_count = sum(1 for t in tickets if t["status"] == "In Progress")
    resolved_count = sum(1 for t in tickets if t["status"] == "Resolved")
    
    avg_score = round(sum(t["priority_score"] for t in tickets) / total, 1) if total > 0 else 0
    kb_deflected = sum(1 for t in tickets if t["assigned_tier"] == "Routine" and t["status"] == "Resolved")
    kb_deflection_rate = round((kb_deflected / total * 100), 1) if total > 0 else 0
    churn_risk_mitigated = sum(1 for t in tickets if t["customer_type"] == "VIP" and t["assigned_tier"] == "Critical")
    
    return {
        "total_tickets": total,
        "critical_priority_count": critical_count,
        "in_progress_count": in_progress_count,
        "resolved_count": resolved_count,
        "average_priority_score": avg_score,
        "kb_deflection_rate_percentage": kb_deflection_rate,
        "churn_risk_mitigated_vip": churn_risk_mitigated,
        "active_weights": CURRENT_WEIGHTS.dict(),
        "avg_first_response_minutes": 4.2
    }

@app.get("/api/admin/weights")
def get_weights(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return CURRENT_WEIGHTS.dict()

@app.post("/api/admin/weights")
async def update_weights(
    req: WeightsUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    global CURRENT_WEIGHTS
    CURRENT_WEIGHTS.frustration_weight = req.frustration_weight
    CURRENT_WEIGHTS.urgency_weight = req.urgency_weight
    CURRENT_WEIGHTS.customer_value_weight = req.customer_value_weight
    CURRENT_WEIGHTS.critical_threshold = req.critical_threshold
    CURRENT_WEIGHTS.standard_threshold = req.standard_threshold
    
    count = recalculate_all_tickets_scores(CURRENT_WEIGHTS)
    
    await ws_manager.broadcast("WEIGHTS_RECALCULATED", {
        "new_weights": CURRENT_WEIGHTS.dict(),
        "recalculated_count": count
    })
    
    return {
        "message": f"Successfully updated weights and recalculated {count} tickets",
        "weights": CURRENT_WEIGHTS.dict()
    }

@app.get("/api/admin/audit-logs")
def list_audit_logs(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return get_audit_logs()

@app.get("/api/kb/articles")
def list_kb_articles():
    return DEFAULT_KB_ARTICLES

# --- WEBSOCKET ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

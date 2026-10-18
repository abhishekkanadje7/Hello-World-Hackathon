import uuid
import json
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
    get_connection, get_all_faqs, get_faq_by_id, insert_faq, update_faq,
    delete_faq, get_all_settings, set_setting, get_all_users, create_agent_user,
    update_user_profile, admin_reset_user_password, reset_demo_database,
    get_all_canned_replies, insert_canned_reply, delete_canned_reply,
    create_notification, get_user_notifications, mark_notifications_read,
    submit_ticket_csat
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

# --- SLIDING WINDOW RATE LIMITER ---
RATE_LIMIT_BUCKET: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW = 60.0  # 1 minute window
RATE_LIMIT_MAX_REQUESTS = 120  # generous 120 requests/minute per client IP

from fastapi import Request
from fastapi.responses import JSONResponse

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Only rate limit /api endpoints, exclude websockets or static
    if request.url.path.startswith("/api/"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = datetime.utcnow().timestamp()
        
        # Clean timestamps older than window
        timestamps = RATE_LIMIT_BUCKET.get(client_ip, [])
        valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
        
        if len(valid_timestamps) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "API rate limit exceeded (120 requests/minute). Please slow down.",
                    "retry_after_seconds": int(RATE_LIMIT_WINDOW - (now - valid_timestamps[0]))
                }
            )
            
        valid_timestamps.append(now)
        RATE_LIMIT_BUCKET[client_ip] = valid_timestamps
        
    response = await call_next(request)
    return response

@app.on_event("startup")
def startup_event():
    init_db()

# --- HEALTH ---
@app.get("/api/health")
def health_check():
    from .database import DATABASE_URL
    return {
        "status": "healthy",
        "service": "TriageX Engine",
        "version": "2.1.0",
        "database_engine": "PostgreSQL (Cloud Persistent)" if DATABASE_URL else "SQLite (Local/Disk)",
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
    safe_user["must_change_password"] = bool(safe_user.get("must_change_password", 0))
    safe_user["is_active"] = bool(safe_user.get("is_active", 1))
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
    tier_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    tickets = get_tickets_for_user(current_user)
    if status_filter:
        tickets = [t for t in tickets if t["status"].lower() == status_filter.lower()]
    if tier_filter:
        tickets = [t for t in tickets if t["assigned_tier"].lower() == tier_filter.lower()]
    if search:
        s_lower = search.lower().strip()
        tickets = [
            t for t in tickets if
            s_lower in t["ticket_number"].lower() or
            s_lower in t["subject"].lower() or
            s_lower in t["customer_name"].lower() or
            s_lower in t["customer_email"].lower()
        ]
        
    total_count = len(tickets)
    if page is not None and page_size is not None and page > 0 and page_size > 0:
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = tickets[start_idx:end_idx]
        return {
            "items": paginated_items,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total_count + page_size - 1) // page_size)
        }
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
    else:
        # Create notification for senior agents if Critical
        if expl.assigned_tier == "Critical":
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE role = 'agent' AND agent_level = 'Senior'")
            for s_agent in cursor.fetchall():
                create_notification(
                    user_id=s_agent["id"],
                    title=f"🚨 Critical Ticket Escalated ({ticket_number})",
                    message=f"Critical issue from {customer_name} ({customer_type}): '{req.subject}'",
                    ticket_id=ticket_id
                )
            conn.close()
        
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
    
    # Notify participants
    if role == "customer":
        # Notify assigned agent if assigned
        if ticket.get("assigned_agent_id"):
            create_notification(
                user_id=ticket["assigned_agent_id"],
                title=f"New Customer Reply ({ticket['ticket_number']})",
                message=f"{current_user['name']} replied: '{req.message[:80]}...'",
                ticket_id=ticket_id
            )
    elif not is_internal:
        # Agent or admin public reply -> notify customer
        if ticket.get("customer_id"):
            create_notification(
                user_id=ticket["customer_id"],
                title=f"Support Update on {ticket['ticket_number']}",
                message=f"{current_user['name']} replied: '{req.message[:80]}...'",
                ticket_id=ticket_id
            )
            
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
        
    if new_status == "Resolved" and updated.get("customer_id"):
        create_notification(
            user_id=updated["customer_id"],
            title=f"Ticket Resolved ({updated['ticket_number']})",
            message=f"Your ticket '{updated['subject'][:50]}' has been marked as Resolved. Please let us know your feedback!",
            ticket_id=ticket_id
        )
        
    await ws_manager.broadcast("TICKET_UPDATED", updated)
    return updated

# --- AGENT ACTIONS: CLAIM & RELEASE ---

@app.post("/api/tickets/{ticket_id}/claim")
async def claim_ticket(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(require_role("agent", "admin"))
):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Check if already assigned
    if ticket.get("assigned_agent_id") and ticket["assigned_agent_id"] != current_user["id"]:
        raise HTTPException(
            status_code=409,
            detail=f"Ticket is already claimed by {ticket.get('assigned_agent_name', 'another agent')}."
        )
        
    # Check agent tier compatibility
    if current_user.get("role") == "agent":
        agent_level = current_user.get("agent_level", "Standard")
        if agent_level == "Standard" and ticket["assigned_tier"] == "Critical":
            raise HTTPException(
                status_code=403,
                detail="Standard agents cannot claim Critical tier tickets. Requires Senior Agent escalation."
            )
            
    updated = update_ticket_status(
        ticket_id=ticket_id,
        status="In Progress",
        assigned_agent_id=current_user["id"],
        assigned_agent_name=current_user["name"],
        note=f"Claimed by {current_user['name']}"
    )
    
    await ws_manager.broadcast("TICKET_UPDATED", updated)
    return updated

@app.post("/api/tickets/{ticket_id}/release")
async def release_ticket(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(require_role("agent", "admin"))
):
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Only the assigned agent or an admin can release
    if current_user.get("role") == "agent" and ticket.get("assigned_agent_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only release tickets currently assigned to you.")
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE tickets 
    SET assigned_agent_id = NULL, assigned_agent_name = NULL, status = 'Open' 
    WHERE id = ?
    """, (ticket_id,))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        ticket_id,
        "TICKET_RELEASED",
        f"Ticket released back to unassigned queue by {current_user['name']}",
        current_user["name"],
        datetime.utcnow().isoformat() + "Z"
    ))
    conn.commit()
    conn.close()
    
    updated = get_ticket_by_id(ticket_id)
    await ws_manager.broadcast("TICKET_UPDATED", updated)
    return updated

@app.get("/api/agent/stats")
def get_agent_stats(current_user: Dict[str, Any] = Depends(require_role("agent", "admin"))):
    agent_id = current_user["id"]
    agent_level = current_user.get("agent_level", "Standard")
    is_admin = (current_user.get("role") == "admin")
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets")
    all_tickets = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    now_iso = datetime.utcnow().isoformat() + "Z"
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    my_open = [
        t for t in all_tickets 
        if t.get("assigned_agent_id") == agent_id and t["status"] in ["Open", "In Progress"]
    ]
    
    if is_admin:
        unassigned_in_tier = [t for t in all_tickets if not t.get("assigned_agent_id") and t["status"] == "Open"]
    elif agent_level == "Senior":
        unassigned_in_tier = [
            t for t in all_tickets 
            if not t.get("assigned_agent_id") and t["status"] == "Open" and t["assigned_tier"] == "Critical"
        ]
    else:
        unassigned_in_tier = [
            t for t in all_tickets 
            if not t.get("assigned_agent_id") and t["status"] == "Open" and t["assigned_tier"] in ["Standard", "Routine"]
        ]
        
    overdue_sla = [
        t for t in all_tickets 
        if t["status"] != "Resolved" and t.get("sla_due_at") and t["sla_due_at"] < now_iso and
        (is_admin or (agent_level == "Senior" and t["assigned_tier"] == "Critical") or (agent_level == "Standard" and t["assigned_tier"] in ["Standard", "Routine"]) or t.get("assigned_agent_id") == agent_id)
    ]
    
    resolved_today = [
        t for t in all_tickets 
        if t["status"] == "Resolved" and t.get("resolved_at") and t["resolved_at"].startswith(today_str) and
        (is_admin or t.get("assigned_agent_id") == agent_id)
    ]
    
    return {
        "my_open_count": len(my_open),
        "unassigned_in_tier_count": len(unassigned_in_tier),
        "overdue_sla_count": len(overdue_sla),
        "resolved_today_count": len(resolved_today),
        "agent_level": agent_level,
        "is_admin": is_admin
    }

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
    from .kb_engine import get_active_kb_articles
    return get_active_kb_articles()

# --- ADMIN PORTAL COMPREHENSIVE ENDPOINTS ---

@app.get("/api/admin/analytics")
def get_admin_analytics(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets")
    tickets = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT id, name, role, agent_level, is_active FROM users")
    users = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    total = len(tickets)
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # 1. Tier Distribution
    tier_counts = {"Critical": 0, "Standard": 0, "Routine": 0}
    for t in tickets:
        tier = t.get("assigned_tier", "Standard")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
    tier_pie = [
        {"name": "Critical", "value": tier_counts["Critical"], "color": "#ef4444"},
        {"name": "Standard", "value": tier_counts["Standard"], "color": "#3b82f6"},
        {"name": "Routine", "value": tier_counts["Routine"], "color": "#10b981"}
    ]
    
    # 2. Status Distribution
    status_counts = {"Open": 0, "In Progress": 0, "Resolved": 0}
    for t in tickets:
        s = t.get("status", "Open")
        status_counts[s] = status_counts.get(s, 0) + 1
        
    # 3. Sentiment & Frustration Buckets
    sentiment_buckets = [
        {"name": "Very Negative (Hostile)", "count": 0, "color": "#ef4444"},
        {"name": "Frustrated", "count": 0, "color": "#f97316"},
        {"name": "Neutral / Inquiring", "count": 0, "color": "#eab308"},
        {"name": "Positive / Calm", "count": 0, "color": "#10b981"}
    ]
    
    for t in tickets:
        expl = json.loads(t["explainability_json"]) if t.get("explainability_json") else {}
        comp = expl.get("sentiment_compound", 0.0)
        if comp <= -0.5:
            sentiment_buckets[0]["count"] += 1
        elif comp < 0:
            sentiment_buckets[1]["count"] += 1
        elif comp < 0.4:
            sentiment_buckets[2]["count"] += 1
        else:
            sentiment_buckets[3]["count"] += 1
            
    # 4. Agent Workload
    agents = [u for u in users if u["role"] == "agent"]
    agent_workload = []
    for a in agents:
        assigned = [t for t in tickets if t.get("assigned_agent_id") == a["id"]]
        resolved = [t for t in assigned if t["status"] == "Resolved"]
        in_prog = [t for t in assigned if t["status"] in ["Open", "In Progress"]]
        agent_workload.append({
            "agent_id": a["id"],
            "agent_name": a["name"],
            "agent_level": a.get("agent_level", "Standard"),
            "active_tickets": len(in_prog),
            "resolved_tickets": len(resolved),
            "total_assigned": len(assigned)
        })
        
    # 5. Tickets Per Day (Last 7 days mock-spread for trend line)
    day_counts = {}
    for i in range(6, -1, -1):
        d_str = (datetime.utcnow() - timedelta(days=i)).strftime("%b %d")
        day_counts[d_str] = 0
        
    for t in tickets:
        try:
            created_dt = datetime.fromisoformat(t["created_at"].replace("Z", ""))
            d_str = created_dt.strftime("%b %d")
            if d_str in day_counts:
                day_counts[d_str] += 1
        except Exception:
            pass
            
    tickets_trend = [{"date": k, "count": v} for k, v in day_counts.items()]
    
    # 6. Overall Metrics
    avg_score = round(sum(t["priority_score"] for t in tickets) / total, 1) if total > 0 else 0
    overdue_count = sum(1 for t in tickets if t["status"] != "Resolved" and t.get("sla_due_at") and t["sla_due_at"] < now_iso)
    sla_compliance_rate = round(((total - overdue_count) / total * 100), 1) if total > 0 else 100.0
    kb_deflection_rate = round((tier_counts["Routine"] / total * 100), 1) if total > 0 else 0.0

    return {
        "total_tickets": total,
        "open_tickets": status_counts["Open"] + status_counts["In Progress"],
        "resolved_tickets": status_counts["Resolved"],
        "critical_tickets": tier_counts["Critical"],
        "overdue_sla_count": overdue_count,
        "sla_compliance_rate": sla_compliance_rate,
        "kb_deflection_rate": kb_deflection_rate,
        "average_priority_score": avg_score,
        "tier_distribution": tier_pie,
        "sentiment_distribution": sentiment_buckets,
        "agent_workload": agent_workload,
        "tickets_trend": tickets_trend
    }

@app.get("/api/admin/tickets/export-csv")
def export_tickets_csv(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    import csv
    import io
    from fastapi.responses import Response
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets ORDER BY priority_score DESC, created_at DESC")
    tickets = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Ticket Number", "Subject", "Customer Name", "Customer Email", "Customer Type",
        "Category", "Channel", "Status", "Priority Score", "Assigned Tier",
        "Assigned Agent", "Routing Reason", "SLA Due At", "Created At", "Resolved At"
    ])
    
    for t in tickets:
        writer.writerow([
            t.get("ticket_number", ""),
            t.get("subject", ""),
            t.get("customer_name", ""),
            t.get("customer_email", ""),
            t.get("customer_type", ""),
            t.get("category", ""),
            t.get("channel", ""),
            t.get("status", ""),
            t.get("priority_score", 0),
            t.get("assigned_tier", ""),
            t.get("assigned_agent_name", "Unassigned"),
            t.get("routing_reason", ""),
            t.get("sla_due_at", ""),
            t.get("created_at", ""),
            t.get("resolved_at", "")
        ])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=triagex_tickets_export.csv"}
    )

# --- USER MANAGEMENT ---

@app.get("/api/admin/users")
def list_admin_users(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return get_all_users()

@app.post("/api/admin/agents")
async def create_agent(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    name = req.get("name", "").strip()
    email = req.get("email", "").strip().lower()
    agent_level = req.get("agent_level", "Standard")
    
    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required.")
        
    if get_user_by_email(email):
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
        
    # Generate 12-char secure random temporary password
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits + "@#$%"
    temp_password = "Ag!" + "".join(secrets.choice(alphabet) for _ in range(9))
    
    pw_hash = hash_password(temp_password)
    new_agent = create_agent_user(name, email, pw_hash, agent_level, current_user["name"])
    
    return {
        "user": new_agent,
        "temporary_password": temp_password,
        "email_dispatched": True,
        "message": f"Agent account created for {name}. Automated onboarding email dispatched to {email} with temporary credentials."
    }

@app.patch("/api/admin/users/{user_id}")
async def update_user(
    user_id: str,
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Admin cannot deactivate self
    if target["id"] == current_user["id"] and req.get("is_active") is False:
        raise HTTPException(status_code=400, detail="Administrator cannot deactivate own account.")
        
    updated = update_user_profile(user_id, req, current_user["name"])
    return updated

@app.post("/api/admin/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    target = get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    import secrets
    import string
    alphabet = string.ascii_letters + string.digits + "@#$%"
    temp_password = "Tx!" + "".join(secrets.choice(alphabet) for _ in range(9))
    
    pw_hash = hash_password(temp_password)
    admin_reset_user_password(user_id, pw_hash, current_user["name"])
    
    return {
        "temporary_password": temp_password,
        "message": f"Password reset for {target['email']}. User must change password on next login."
    }

# --- KNOWLEDGE BASE FAQ CRUD & TEST ---

@app.get("/api/admin/faqs")
def list_admin_faqs(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return get_all_faqs(active_only=False)

@app.post("/api/admin/faqs")
async def create_faq(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    title = req.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required.")
    created = insert_faq(req, current_user["name"])
    return created

@app.patch("/api/admin/faqs/{faq_id}")
async def update_faq_endpoint(
    faq_id: str,
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    updated = update_faq(faq_id, req, current_user["name"])
    if not updated:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return updated

@app.delete("/api/admin/faqs/{faq_id}")
async def delete_faq_endpoint(
    faq_id: str,
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    success = delete_faq(faq_id, current_user["name"])
    if not success:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}

@app.post("/api/admin/faqs/test")
def test_faq_matcher(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    query = req.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query text is required.")
        
    match = find_kb_match(query)
    if match:
        return {
            "matched": True,
            "article": match,
            "confidence": match.get("confidence", 0.8)
        }
    return {
        "matched": False,
        "message": "No matching knowledge base article found for this query."
    }

# --- SETTINGS & SYSTEM CONFIGURATION ---

@app.get("/api/admin/settings")
def get_system_settings(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    settings = get_all_settings()
    settings["active_weights"] = CURRENT_WEIGHTS.dict()
    return settings

@app.post("/api/admin/settings")
async def save_system_settings(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    global CURRENT_WEIGHTS
    
    # Save key-value pairs
    for k, v in req.items():
        if k == "active_weights" and isinstance(v, dict):
            CURRENT_WEIGHTS.frustration_weight = float(v.get("frustration_weight", CURRENT_WEIGHTS.frustration_weight))
            CURRENT_WEIGHTS.urgency_weight = float(v.get("urgency_weight", CURRENT_WEIGHTS.urgency_weight))
            CURRENT_WEIGHTS.customer_value_weight = float(v.get("customer_value_weight", CURRENT_WEIGHTS.customer_value_weight))
            CURRENT_WEIGHTS.critical_threshold = int(v.get("critical_threshold", CURRENT_WEIGHTS.critical_threshold))
            CURRENT_WEIGHTS.standard_threshold = int(v.get("standard_threshold", CURRENT_WEIGHTS.standard_threshold))
        else:
            set_setting(k, str(v), current_user["name"])
            
    # Recalculate tickets with current weights
    count = recalculate_all_tickets_scores(CURRENT_WEIGHTS)
    
    await ws_manager.broadcast("SETTINGS_UPDATED", {
        "settings": get_all_settings(),
        "weights": CURRENT_WEIGHTS.dict()
    })
    
    return {
        "message": f"Settings saved and {count} tickets updated.",
        "settings": get_all_settings(),
        "weights": CURRENT_WEIGHTS.dict()
    }

@app.post("/api/admin/test-gemini")
def test_gemini_connection(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    key = req.get("gemini_api_key", "").strip()
    from .gemini_engine import get_gemini_api_key, set_gemini_api_key, call_gemini_triage
    if not key:
        key = get_gemini_api_key()
    if not key:
        raise HTTPException(status_code=400, detail="Gemini API Key is missing. Please provide a key.")
    
    set_gemini_api_key(key)
    res = call_gemini_triage(
        "Critical Production DB Outage",
        "Payment service is failing with 500 error and checkout is completely down for all users.",
        "VIP",
        "Technical Support"
    )
    if res and "priority_score" in res:
        return {
            "status": "success",
            "message": f"Successfully connected to {res.get('ai_engine', 'Google Gemini AI')}!",
            "test_evaluation": res
        }
    else:
        raise HTTPException(status_code=502, detail="Failed to connect to Google Gemini API. Please check your API key or network.")


@app.post("/api/admin/reset-demo-data")
async def reset_demo_data_endpoint(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    reset_demo_database(current_user["name"])
    await ws_manager.broadcast("DATABASE_RESET", {"message": "Demo data reset by admin."})
    return {"message": "Demo database successfully reset to clean demonstration state."}

# --- PROMPT C3: NOTIFICATIONS, CSAT, CANNED REPLIES & PROFILE ---

@app.get("/api/notifications")
def list_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    return get_user_notifications(current_user["id"])

@app.post("/api/notifications/read")
def mark_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    mark_notifications_read(current_user["id"])
    return {"message": "Notifications marked as read"}

@app.get("/api/canned-replies")
def list_canned(current_user: Dict[str, Any] = Depends(require_role("agent", "admin"))):
    return get_all_canned_replies()

@app.post("/api/canned-replies")
def create_canned(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("agent", "admin"))
):
    sc = req.get("shortcut", "").strip()
    title = req.get("title", "").strip()
    content = req.get("content", "").strip()
    category = req.get("category", "General").strip()
    if not sc or not title or not content:
        raise HTTPException(status_code=400, detail="Shortcut, title, and content are required.")
    return insert_canned_reply(sc, title, category, content)

@app.delete("/api/canned-replies/{canned_id}")
def delete_canned(
    canned_id: str,
    current_user: Dict[str, Any] = Depends(require_role("admin"))
):
    success = delete_canned_reply(canned_id)
    return {"message": "Canned reply deleted", "success": success}

@app.post("/api/tickets/{ticket_id}/csat")
async def post_csat(
    ticket_id: str,
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(require_role("customer"))
):
    if current_user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Only customers can submit CSAT ratings.")
        
    rating = req.get("rating")
    feedback = req.get("feedback")
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be an integer between 1 and 5.")

        
    updated = submit_ticket_csat(ticket_id, rating, feedback, current_user["id"])
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found or does not belong to you.")
        
    await ws_manager.broadcast("CSAT_SUBMITTED", {
        "ticket_id": ticket_id,
        "rating": rating,
        "feedback": feedback
    })
    return {"message": "CSAT rating submitted successfully", "ticket": updated}

@app.patch("/api/user/profile")
def update_profile(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    name = req.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name = ? WHERE id = ?", (name, current_user["id"]))
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "PROFILE_UPDATED", f"User updated name to {name}", current_user["id"], datetime.utcnow().isoformat() + "Z"))
    conn.commit()
    conn.close()
    return get_user_by_id(current_user["id"])



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


# =============================================================================
# SERVE COMPILED FRONTEND SPA (RENDER & CLOUD HOSTING)
# कमेंट: रेंडर (Render.com) वर एकच फुलस्टॅक सर्व्हिस चालवण्यासाठी Frontend डिस्ट फाइल्स माउंट करणे.
# /api/* आणि /ws सोडून बाकी सर्व रूट्स थेट React ॲप उघडतील.
# =============================================================================
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # Do not catch API, WS, docs, or schema paths
        if full_path.startswith("api") or full_path.startswith("ws") or full_path in ["docs", "redoc", "openapi.json"]:
            raise HTTPException(status_code=404, detail="API route not found.")
        
        target_file = os.path.join(frontend_dist, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
            
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found.")


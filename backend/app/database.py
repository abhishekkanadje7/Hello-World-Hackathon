import sqlite3
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from .config import ADMIN_EMAIL, ADMIN_PASSWORD
from .auth import hash_password

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "triagex.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 20000")
    return conn


def calculate_sla_due(created_at_dt: datetime, tier: str) -> str:
    tier_upper = tier.upper()
    if "CRITICAL" in tier_upper:
        due = created_at_dt + timedelta(minutes=15)
    elif "STANDARD" in tier_upper:
        due = created_at_dt + timedelta(hours=2)
    else:  # Routine
        due = created_at_dt + timedelta(hours=24)
    return due.isoformat() + "Z"

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        agent_level TEXT,
        customer_type TEXT,
        is_active INTEGER DEFAULT 1,
        must_change_password INTEGER DEFAULT 0,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        created_at TEXT NOT NULL
    )
    """)
    
    # 2. Tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticket_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_type TEXT NOT NULL,
        channel TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        priority_score INTEGER NOT NULL,
        assigned_tier TEXT NOT NULL,
        assigned_agent_id TEXT,
        assigned_agent_name TEXT,
        routing_reason TEXT NOT NULL,
        explainability_json TEXT NOT NULL,
        kb_auto_reply_json TEXT,
        resolution_note TEXT,
        resolved_at TEXT,
        sla_due_at TEXT NOT NULL,
        csat_rating INTEGER,
        csat_feedback TEXT,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
    )
    """)
    
    # 3. Ticket replies table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ticket_replies (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        author_id TEXT,
        author_name TEXT NOT NULL,
        author_role TEXT NOT NULL,
        message TEXT NOT NULL,
        is_internal INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
    )
    """)
    
    # 4. Audit logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        performed_by TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)
    
    # 5. Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # 6. FAQs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS faqs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        keywords TEXT NOT NULL,
        snippet TEXT NOT NULL,
        full_content TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )
    """)

    # 7. In-App Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        ticket_id TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # 8. Canned Replies table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS canned_replies (
        id TEXT PRIMARY KEY,
        shortcut TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Ensure CSAT columns exist on tickets
    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN csat_rating INTEGER")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE tickets ADD COLUMN csat_feedback TEXT")
    except Exception:
        pass
    
    conn.commit()
    seed_users_and_tickets(conn)
    seed_faqs_and_settings(conn)
    seed_canned_replies(conn)
    conn.close()

def seed_users_and_tickets(conn):
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    now_dt = datetime.utcnow()
    
    # --- ADMIN BOOTSTRAP ---
    cursor.execute("SELECT id FROM users WHERE role = 'admin'")
    admin_row = cursor.fetchone()
    if not admin_row:
        admin_id = "usr-admin-01"
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, role, agent_level, customer_type, is_active, must_change_password, failed_login_attempts, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            admin_id,
            "System Administrator",
            ADMIN_EMAIL.lower(),
            hash_password(ADMIN_PASSWORD),
            "admin",
            None,
            None,
            1,
            0,
            0,
            now_iso
        ))
        
    # --- DEMO ACCOUNTS ---
    demo_accounts = [
        # (id, name, email, password, role, agent_level, customer_type, must_change)
        ("usr-senior-01", "Pooja Sharma", "senior@triagex.com", "Agent@123", "agent", "Senior", None, 0),
        ("usr-agent-01", "Vikas Patil", "agent@triagex.com", "Agent@123", "agent", "Standard", None, 0),
        ("usr-cust-vip1", "Abhishek Kanadje", "customer@triagex.com", "Customer@123", "customer", None, "VIP", 0),
        ("usr-cust-prem1", "Neha Kulkarni", "neha@startuply.io", "Customer@123", "customer", None, "Premium", 0),
        ("usr-cust-vip2", "Rohan Mehta", "rohan@fintech.com", "Customer@123", "customer", None, "VIP", 0),
        ("usr-cust-reg1", "Siddharth Joshi", "siddharth@gmail.com", "Customer@123", "customer", None, "Regular", 0),
        ("usr-cust-reg2", "Ananya Roy", "ananya@consulting.com", "Customer@123", "customer", None, "Regular", 0)
    ]
    
    for uid, name, email, pw, role, a_lvl, c_type, mcp in demo_accounts:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email.lower(),))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO users (id, name, email, password_hash, role, agent_level, customer_type, is_active, must_change_password, failed_login_attempts, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                uid,
                name,
                email.lower(),
                hash_password(pw),
                role,
                a_lvl,
                c_type,
                1,
                mcp,
                0,
                now_iso
            ))
            
    # --- DEMO TICKETS ---
    cursor.execute("SELECT COUNT(*) FROM tickets")
    if cursor.fetchone()[0] == 0:
        from .nlp_engine import build_explainability_and_route
        from .kb_engine import find_kb_match
        
        sample_tickets = [
            {
                "id": "t-1001",
                "ticket_number": "TX-0001",
                "customer_id": "usr-cust-vip1",
                "customer_name": "Abhishek Kanadje",
                "customer_email": "customer@triagex.com",
                "customer_type": "VIP",
                "channel": "email",
                "category": "Outage",
                "subject": "CRITICAL OUTAGE: Production Payment API Down! Losing thousands per minute!",
                "description": "Our live checkout is completely broken. Customers are getting 500 error when submitting payments. This is unacceptable! Fix this immediately or we will terminate our contract today!!!",
                "status": "In Progress",
                "assigned_agent_id": "usr-senior-01",
                "assigned_agent_name": "Pooja Sharma",
                "created_at": (now_dt - timedelta(minutes=45)).isoformat() + "Z"
            },
            {
                "id": "t-1002",
                "ticket_number": "TX-0002",
                "customer_id": "usr-cust-vip2",
                "customer_name": "Rohan Mehta",
                "customer_email": "rohan@fintech.com",
                "customer_type": "VIP",
                "channel": "web",
                "category": "Billing",
                "subject": "Double charged for Enterprise annual billing cycle ($24,000)",
                "description": "Our accounts department noticed two deductions of $12,000 today. We were charged twice. Please reverse the duplicate deduction immediately ASAP.",
                "status": "In Progress",
                "assigned_agent_id": "usr-senior-01",
                "assigned_agent_name": "Pooja Sharma",
                "created_at": (now_dt - timedelta(minutes=30)).isoformat() + "Z"
            },
            {
                "id": "t-1003",
                "ticket_number": "TX-0003",
                "customer_id": "usr-cust-prem1",
                "customer_name": "Neha Kulkarni",
                "customer_email": "neha@startuply.io",
                "customer_type": "Premium",
                "channel": "chat",
                "category": "Technical",
                "subject": "Webhooks failing on user.created event triggers",
                "description": "Hi team, our webhook endpoint receives empty payload for the user.created event since this morning. Could you help inspect the event dispatcher?",
                "status": "Open",
                "assigned_agent_id": "usr-agent-01",
                "assigned_agent_name": "Vikas Patil",
                "created_at": (now_dt - timedelta(minutes=20)).isoformat() + "Z"
            },
            {
                "id": "t-1004",
                "ticket_number": "TX-0004",
                "customer_id": "usr-cust-reg1",
                "customer_name": "Siddharth Joshi",
                "customer_email": "siddharth@gmail.com",
                "customer_type": "Regular",
                "channel": "web",
                "category": "Account",
                "subject": "How do I reset my password? Forgot credentials",
                "description": "Hello, I cannot remember my login password and need to reset it. Where do I click to reset my password?",
                "status": "Resolved",
                "assigned_agent_id": None,
                "assigned_agent_name": "AI Knowledge Base Bot",
                "created_at": (now_dt - timedelta(minutes=15)).isoformat() + "Z"
            },
            {
                "id": "t-1005",
                "ticket_number": "TX-0005",
                "customer_id": "usr-cust-reg2",
                "customer_name": "Ananya Roy",
                "customer_email": "ananya@consulting.com",
                "customer_type": "Regular",
                "channel": "email",
                "category": "Billing",
                "subject": "Need GST tax invoice receipt for last month's payment",
                "description": "Hi, could you please share the invoice receipt with GST number included for our auditing? Thank you!",
                "status": "Resolved",
                "assigned_agent_id": None,
                "assigned_agent_name": "AI Knowledge Base Bot",
                "created_at": (now_dt - timedelta(minutes=10)).isoformat() + "Z"
            }
        ]
        
        for st in sample_tickets:
            kb_match = find_kb_match(f"{st['subject']}\n{st['description']}")
            expl = build_explainability_and_route(
                st["subject"],
                st["description"],
                st["customer_type"],
                kb_match
            )
            created_dt = datetime.fromisoformat(st["created_at"].replace("Z", ""))
            sla_due = calculate_sla_due(created_dt, expl.assigned_tier)
            resolved_at = st["created_at"] if st["status"] == "Resolved" else None
            
            cursor.execute("""
            INSERT INTO tickets (
                id, ticket_number, customer_id, customer_name, customer_email,
                customer_type, channel, category, subject, description,
                created_at, status, priority_score, assigned_tier,
                assigned_agent_id, assigned_agent_name, routing_reason,
                explainability_json, kb_auto_reply_json, resolution_note,
                resolved_at, sla_due_at, csat_rating, csat_feedback
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                st["id"],
                st["ticket_number"],
                st["customer_id"],
                st["customer_name"],
                st["customer_email"],
                st["customer_type"],
                st["channel"],
                st["category"],
                st["subject"],
                st["description"],
                st["created_at"],
                st["status"],
                expl.total_priority_score,
                expl.assigned_tier,
                st.get("assigned_agent_id"),
                st.get("assigned_agent_name"),
                expl.summary,
                json.dumps(expl.dict()),
                json.dumps(kb_match) if kb_match else None,
                "Auto-resolved with Knowledge Base reference" if kb_match else None,
                resolved_at,
                sla_due,
                st.get("csat_rating"),
                st.get("csat_feedback")
            ))

            
            # If KB match, add system auto-reply
            if kb_match:
                reply_id = f"rep-{uuid.uuid4().hex[:8]}"
                cursor.execute("""
                INSERT INTO ticket_replies VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    reply_id,
                    st["id"],
                    None,
                    "AI Knowledge Base",
                    "system",
                    f"Hello {st['customer_name']},\n\nOur automated knowledge base matched your question with our guide: **{kb_match['title']}**.\n\n{kb_match['snippet']}\n\nThis ticket has been marked as resolved. If you need further assistance, please reply to reopen.",
                    0,
                    st["created_at"]
                ))
                
            # If in progress ticket, add initial agent note or reply
            if st["status"] == "In Progress":
                cursor.execute("""
                INSERT INTO ticket_replies VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"rep-{uuid.uuid4().hex[:8]}",
                    st["id"],
                    st["assigned_agent_id"],
                    st["assigned_agent_name"],
                    "agent",
                    "Internal Investigation: Engineering team paged, checking payment gateway logs.",
                    1,  # internal note
                    st["created_at"]
                ))
                cursor.execute("""
                INSERT INTO ticket_replies VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"rep-{uuid.uuid4().hex[:8]}",
                    st["id"],
                    st["assigned_agent_id"],
                    st["assigned_agent_name"],
                    "agent",
                    f"Hello {st['customer_name']},\n\nWe have escalated this critical issue to our on-call engineering team. We are actively investigating and will provide another update shortly.",
                    0,  # public reply
                    st["created_at"]
                ))
                
    conn.commit()

# --- USER QUERIES ---

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    r = cursor.fetchone()
    conn.close()
    return dict(r) if r else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    r = cursor.fetchone()
    conn.close()
    return dict(r) if r else None

def create_customer_user(name: str, email: str, password_hash: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute("""
    INSERT INTO users (id, name, email, password_hash, role, agent_level, customer_type, is_active, must_change_password, failed_login_attempts, created_at)
    VALUES (?, ?, ?, ?, 'customer', NULL, 'Regular', 1, 0, 0, ?)
    """, (user_id, name.strip(), email.strip().lower(), password_hash, now_iso))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "USER_REGISTERED", f"Customer {email} registered", name, now_iso))
    
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)

def record_failed_login(user: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    attempts = user.get("failed_login_attempts", 0) + 1
    locked_until = None
    if attempts >= 5:
        locked_until = (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z"
        
    cursor.execute("""
    UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?
    """, (attempts, locked_until, user["id"]))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "LOGIN_FAILED", f"Failed attempt #{attempts} for {user['email']}" + (" (Account locked for 5 min)" if attempts >= 5 else ""), user["name"], datetime.utcnow().isoformat() + "Z"))
    
    conn.commit()
    conn.close()
    return attempts

def reset_failed_login(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?
    """, (user_id,))
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "LOGIN_SUCCESS", f"User logged in successfully", user_id, datetime.utcnow().isoformat() + "Z"))
    conn.commit()
    conn.close()

def update_user_password(user_id: str, new_hash: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET password_hash = ?, must_change_password = 0, failed_login_attempts = 0, locked_until = NULL WHERE id = ?
    """, (new_hash, user_id))
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "PASSWORD_CHANGED", f"User changed password", user_id, datetime.utcnow().isoformat() + "Z"))
    conn.commit()
    conn.close()

# --- TICKET QUERIES WITH ROLE PERMISSIONS ---

def get_tickets_for_user(current_user: Dict[str, Any]) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    role = current_user.get("role")
    
    if role == "customer":
        cursor.execute("""
        SELECT * FROM tickets WHERE customer_id = ? ORDER BY priority_score DESC, created_at DESC
        """, (current_user["id"],))
    elif role == "agent":
        agent_level = current_user.get("agent_level", "Standard")
        if agent_level == "Senior":
            # Senior sees Critical tier tickets OR tickets assigned to them
            cursor.execute("""
            SELECT * FROM tickets 
            WHERE assigned_tier = 'Critical' OR assigned_agent_id = ?
            ORDER BY priority_score DESC, created_at DESC
            """, (current_user["id"],))
        else:
            # Standard sees Standard and Routine tier tickets OR tickets assigned to them
            cursor.execute("""
            SELECT * FROM tickets 
            WHERE assigned_tier IN ('Standard', 'Routine') OR assigned_agent_id = ?
            ORDER BY priority_score DESC, created_at DESC
            """, (current_user["id"],))
    else:  # admin sees everything
        cursor.execute("SELECT * FROM tickets ORDER BY priority_score DESC, created_at DESC")
        
    rows = cursor.fetchall()
    results = []
    for r in rows:
        item = dict(r)
        item["explainability"] = json.loads(item["explainability_json"]) if item.get("explainability_json") else {}
        item["kb_auto_reply"] = json.loads(item["kb_auto_reply_json"]) if item.get("kb_auto_reply_json") else None
        results.append(item)
    conn.close()
    return results

def get_ticket_by_id(ticket_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE id = ? OR ticket_number = ?", (ticket_id, ticket_id))
    r = cursor.fetchone()
    conn.close()
    if r:
        item = dict(r)
        item["explainability"] = json.loads(item["explainability_json"]) if item.get("explainability_json") else {}
        item["kb_auto_reply"] = json.loads(item["kb_auto_reply_json"]) if item.get("kb_auto_reply_json") else None
        return item
    return None

def insert_ticket(ticket_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tickets (
        id, ticket_number, customer_id, customer_name, customer_email,
        customer_type, channel, category, subject, description,
        created_at, status, priority_score, assigned_tier,
        assigned_agent_id, assigned_agent_name, routing_reason,
        explainability_json, kb_auto_reply_json, resolution_note,
        resolved_at, sla_due_at, csat_rating, csat_feedback
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket_data["id"],
        ticket_data["ticket_number"],
        ticket_data.get("customer_id"),
        ticket_data["customer_name"],
        ticket_data["customer_email"],
        ticket_data["customer_type"],
        ticket_data["channel"],
        ticket_data["category"],
        ticket_data["subject"],
        ticket_data["description"],
        ticket_data["created_at"],
        ticket_data["status"],
        ticket_data["priority_score"],
        ticket_data["assigned_tier"],
        ticket_data.get("assigned_agent_id"),
        ticket_data.get("assigned_agent_name"),
        ticket_data["routing_reason"],
        json.dumps(ticket_data["explainability"]),
        json.dumps(ticket_data.get("kb_auto_reply")) if ticket_data.get("kb_auto_reply") else None,
        ticket_data.get("resolution_note"),
        ticket_data.get("resolved_at"),
        ticket_data["sla_due_at"],
        ticket_data.get("csat_rating"),
        ticket_data.get("csat_feedback")
    ))
    
    # Audit log
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        ticket_data["id"],
        "TICKET_CREATED",
        f"Ticket {ticket_data['ticket_number']} routed to {ticket_data['assigned_tier']} with Priority {ticket_data['priority_score']}",
        ticket_data["customer_name"],
        ticket_data["created_at"]
    ))
    
    conn.commit()
    conn.close()
    return ticket_data

# --- REPLIES QUERIES ---

def get_replies_for_ticket(ticket_id: str, is_customer: bool = False) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if is_customer:
        # Customers NEVER see internal notes
        cursor.execute("""
        SELECT * FROM ticket_replies WHERE ticket_id = ? AND is_internal = 0 ORDER BY created_at ASC
        """, (ticket_id,))
    else:
        # Agents and Admins see all replies including internal notes
        cursor.execute("""
        SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC
        """, (ticket_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_ticket_reply(reply_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO ticket_replies VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        reply_data["id"],
        reply_data["ticket_id"],
        reply_data.get("author_id"),
        reply_data["author_name"],
        reply_data["author_role"],
        reply_data["message"],
        1 if reply_data.get("is_internal") else 0,
        reply_data["created_at"]
    ))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        reply_data["ticket_id"],
        "REPLY_ADDED",
        f"{'Internal note' if reply_data.get('is_internal') else 'Public reply'} from {reply_data['author_role']} {reply_data['author_name']}",
        reply_data["author_name"],
        reply_data["created_at"]
    ))
    
    conn.commit()
    conn.close()
    return reply_data

def update_ticket_status(ticket_id: str, status: str, assigned_agent_id: Optional[str] = None, assigned_agent_name: Optional[str] = None, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    resolved_at = now_iso if status == "Resolved" else None
    
    cursor.execute("""
    UPDATE tickets
    SET status = ?, 
        assigned_agent_id = COALESCE(?, assigned_agent_id),
        assigned_agent_name = COALESCE(?, assigned_agent_name),
        resolution_note = COALESCE(?, resolution_note),
        resolved_at = CASE WHEN ? = 'Resolved' THEN ? ELSE resolved_at END
    WHERE id = ?
    """, (status, assigned_agent_id, assigned_agent_name, note, status, resolved_at, ticket_id))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        ticket_id,
        "STATUS_UPDATED",
        f"Status changed to {status}. Assigned: {assigned_agent_name}. Note: {note}",
        assigned_agent_name or "System",
        now_iso
    ))
    
    conn.commit()
    conn.close()
    return get_ticket_by_id(ticket_id)

def get_audit_logs() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def recalculate_all_tickets_scores(weights):
    from .nlp_engine import build_explainability_and_route
    from .kb_engine import find_kb_match
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, subject, description, customer_type, status FROM tickets")
    rows = cursor.fetchall()
    
    updated_count = 0
    for r in rows:
        ticket_id = r["id"]
        subj = r["subject"]
        desc = r["description"]
        tier = r["customer_type"]
        status = r["status"]
        
        kb_match = find_kb_match(f"{subj}\n{desc}")
        expl = build_explainability_and_route(subj, desc, tier, kb_match, weights)
        
        cursor.execute("""
        UPDATE tickets
        SET priority_score = ?, assigned_tier = ?, routing_reason = ?, explainability_json = ?
        WHERE id = ?
        """, (
            expl.total_priority_score,
            expl.assigned_tier,
            expl.summary,
            json.dumps(expl.dict()),
            ticket_id
        ))
        updated_count += 1
        
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        "SYSTEM",
        "WEIGHTS_RECALCULATED",
        f"Recalculated {updated_count} tickets with weights (F: {weights.frustration_weight}, U: {weights.urgency_weight}, V: {weights.customer_value_weight})",
        "Admin",
        datetime.utcnow().isoformat() + "Z"
    ))
    
    conn.commit()
    conn.close()
    return updated_count

def seed_faqs_and_settings(conn):
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # Check if faqs seeded
    cursor.execute("SELECT COUNT(*) FROM faqs")
    if cursor.fetchone()[0] == 0:
        from .kb_engine import DEFAULT_KB_ARTICLES
        for art in DEFAULT_KB_ARTICLES:
            cursor.execute("""
            INSERT INTO faqs (id, title, category, keywords, snippet, full_content, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (
                art["id"],
                art["title"],
                art.get("category", "General"),
                json.dumps(art["keywords"]),
                art["snippet"],
                art["full_content"],
                now_iso
            ))

    # Initialize settings if empty
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        default_settings = {
            "frustration_weight": "0.40",
            "urgency_weight": "0.40",
            "customer_value_weight": "0.20",
            "critical_threshold": "70",
            "standard_threshold": "40",
            "sla_critical_minutes": "15",
            "sla_standard_hours": "2",
            "sla_routine_hours": "24",
            "urgency_keywords_extra": "[\"p1\", \"sev1\", \"blocker\", \"catastrophic\", \"data breach\"]"
        }
        for k, v in default_settings.items():
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))
            
    conn.commit()

# --- FAQS CRUD ---

def get_all_faqs(active_only: bool = False) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if active_only:
        cursor.execute("SELECT * FROM faqs WHERE is_active = 1 ORDER BY created_at DESC")
    else:
        cursor.execute("SELECT * FROM faqs ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        try:
            item["keywords"] = json.loads(item["keywords"])
        except Exception:
            item["keywords"] = [k.strip() for k in item["keywords"].split(",") if k.strip()]
        result.append(item)
    return result

def get_faq_by_id(faq_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM faqs WHERE id = ?", (faq_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    item = dict(r)
    try:
        item["keywords"] = json.loads(item["keywords"])
    except Exception:
        item["keywords"] = [k.strip() for k in item["keywords"].split(",") if k.strip()]
    return item

def insert_faq(data: Dict[str, Any], performed_by: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    faq_id = f"kb-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    kw_json = json.dumps(data.get("keywords", []))
    
    cursor.execute("""
    INSERT INTO faqs (id, title, category, keywords, snippet, full_content, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        faq_id,
        data["title"].strip(),
        data.get("category", "General").strip(),
        kw_json,
        data["snippet"].strip(),
        data["full_content"].strip(),
        1 if data.get("is_active", True) else 0,
        now_iso
    ))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "FAQ_CREATED", f"Created FAQ '{data['title']}'", performed_by, now_iso))
    
    conn.commit()
    conn.close()
    return get_faq_by_id(faq_id)

def update_faq(faq_id: str, data: Dict[str, Any], performed_by: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    existing = get_faq_by_id(faq_id)
    if not existing:
        conn.close()
        return None
        
    title = data.get("title", existing["title"]).strip()
    category = data.get("category", existing["category"]).strip()
    keywords = json.dumps(data.get("keywords", existing["keywords"]))
    snippet = data.get("snippet", existing["snippet"]).strip()
    full_content = data.get("full_content", existing["full_content"]).strip()
    is_active = 1 if data.get("is_active", bool(existing["is_active"])) else 0
    
    cursor.execute("""
    UPDATE faqs 
    SET title = ?, category = ?, keywords = ?, snippet = ?, full_content = ?, is_active = ?
    WHERE id = ?
    """, (title, category, keywords, snippet, full_content, is_active, faq_id))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "FAQ_UPDATED", f"Updated FAQ '{title}' (active: {is_active})", performed_by, now_iso))
    
    conn.commit()
    conn.close()
    return get_faq_by_id(faq_id)

def delete_faq(faq_id: str, performed_by: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    cursor.execute("SELECT title FROM faqs WHERE id = ?", (faq_id,))
    r = cursor.fetchone()
    if not r:
        conn.close()
        return False
    title = r["title"]
    cursor.execute("DELETE FROM faqs WHERE id = ?", (faq_id,))
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "FAQ_DELETED", f"Deleted FAQ '{title}'", performed_by, now_iso))
    conn.commit()
    conn.close()
    return True

# --- SETTINGS GET/UPDATE ---

def get_all_settings() -> Dict[str, str]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

def set_setting(key: str, value: str, performed_by: str = "Admin"):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "SETTING_UPDATED", f"Setting '{key}' changed to '{value}'", performed_by, now_iso))
    conn.commit()
    conn.close()

# --- USERS & AGENT ADMINISTRATION ---

def get_all_users() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, agent_level, customer_type, is_active, must_change_password, created_at FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_agent_user(name: str, email: str, password_hash: str, agent_level: str, performed_by: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    agent_id = f"usr-agent-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    cursor.execute("""
    INSERT INTO users (id, name, email, password_hash, role, agent_level, customer_type, is_active, must_change_password, failed_login_attempts, created_at)
    VALUES (?, ?, ?, ?, 'agent', ?, NULL, 1, 1, 0, ?)
    """, (agent_id, name.strip(), email.strip().lower(), password_hash, agent_level, now_iso))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "AGENT_CREATED", f"Created {agent_level} Agent {name} ({email}) with temporary password", performed_by, now_iso))
    
    conn.commit()
    conn.close()
    return get_user_by_id(agent_id)

def update_user_profile(user_id: str, updates: Dict[str, Any], performed_by: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    existing = get_user_by_id(user_id)
    if not existing:
        conn.close()
        return None
        
    name = updates.get("name", existing["name"]).strip()
    is_active = 1 if updates.get("is_active", bool(existing["is_active"])) else 0
    agent_level = updates.get("agent_level", existing.get("agent_level"))
    new_customer_type = updates.get("customer_type", existing.get("customer_type"))
    old_customer_type = existing.get("customer_type")
    
    cursor.execute("""
    UPDATE users 
    SET name = ?, is_active = ?, agent_level = ?, customer_type = ?
    WHERE id = ?
    """, (name, is_active, agent_level, new_customer_type, user_id))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "USER_UPDATED", f"Updated user {existing['email']} (Active: {is_active}, Level: {agent_level}, CustType: {new_customer_type})", performed_by, now_iso))
    
    conn.commit()
    conn.close()
    
    # If customer type changed, recalculate scores for open tickets belonging to this customer
    if existing["role"] == "customer" and new_customer_type and new_customer_type != old_customer_type:
        recalculate_tickets_for_customer(user_id, new_customer_type)
        
    return get_user_by_id(user_id)

def recalculate_tickets_for_customer(customer_id: str, new_customer_type: str):
    from .nlp_engine import build_explainability_and_route
    from .kb_engine import find_kb_match
    from .config import CURRENT_WEIGHTS
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, subject, description, status FROM tickets WHERE customer_id = ? AND status != 'Resolved'", (customer_id,))
    rows = cursor.fetchall()
    for r in rows:
        ticket_id = r["id"]
        subj = r["subject"]
        desc = r["description"]
        kb_match = find_kb_match(f"{subj}\n{desc}")
        expl = build_explainability_and_route(subj, desc, new_customer_type, kb_match, CURRENT_WEIGHTS)
        
        cursor.execute("""
        UPDATE tickets
        SET customer_type = ?, priority_score = ?, assigned_tier = ?, routing_reason = ?, explainability_json = ?
        WHERE id = ?
        """, (
            new_customer_type,
            expl.total_priority_score,
            expl.assigned_tier,
            expl.summary,
            json.dumps(expl.dict()),
            ticket_id
        ))
    conn.commit()
    conn.close()

def admin_reset_user_password(user_id: str, new_hash: str, performed_by: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
    UPDATE users 
    SET password_hash = ?, must_change_password = 1, failed_login_attempts = 0, locked_until = NULL 
    WHERE id = ?
    """, (new_hash, user_id))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "ADMIN_PASSWORD_RESET", f"Admin {performed_by} reset password for user {user_id}", performed_by, now_iso))
    
    conn.commit()
    conn.close()
    return True

# --- RESET DEMO DATA ---

def reset_demo_database(performed_by: str = "Admin"):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # 1. Delete all ticket replies
    cursor.execute("DELETE FROM ticket_replies")
    
    # 2. Delete all tickets
    cursor.execute("DELETE FROM tickets")
    
    # 3. Delete non-admin users
    cursor.execute("DELETE FROM users WHERE role != 'admin'")
    
    # 4. Delete FAQs
    cursor.execute("DELETE FROM faqs")
    
    # Re-seed
    seed_users_and_tickets(conn)
    seed_faqs_and_settings(conn)
    seed_canned_replies(conn)
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (None, "DATABASE_RESET", "Demo database reset to initial pristine state", performed_by, now_iso))
    
    conn.commit()
    conn.close()

# --- CANNED REPLIES & SEED ---

def seed_canned_replies(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM canned_replies")
    if cursor.fetchone()[0] == 0:
        now_iso = datetime.utcnow().isoformat() + "Z"
        default_templates = [
            ("cr-01", "greet", "Standard Friendly Greeting", "Greeting", "Hello {{customer_name}},\n\nThank you for reaching out to TriageX Priority Support. My name is {{agent_name}} and I am currently reviewing your inquiry (Ticket {{ticket_number}}).\n\nCould you please confirm if this issue is currently affecting all users on your account?", now_iso),
            ("cr-02", "outage", "Production Outage Investigation", "Incident", "Hello {{customer_name}},\n\nWe understand that your production service is severely impacted and treat this with the highest P1 priority. Our Senior Site Reliability Engineering team has been notified and is currently analyzing server telemetry and database latency metrics.\n\nWe will provide a status update every 15 minutes until resolution.", now_iso),
            ("cr-03", "refund", "Billing & Refund Confirmation", "Billing", "Hello {{customer_name}},\n\nWe have reviewed the billing discrepancy on your account and processed a full reversal of the duplicate charge. You should see the credit reflected on your original payment card within 3-5 business days.\n\nPlease accept our sincere apologies for the inconvenience.", now_iso),
            ("cr-04", "resolve", "Resolution Confirmation & Closure", "Closing", "Hello {{customer_name}},\n\nWe have implemented a fix and confirmed that your service is now running normally. We are marking this ticket as Resolved.\n\nPlease take a quick moment to rate your support experience below. Thank you for choosing TriageX!", now_iso),
            ("cr-05", "logs", "Request Error Logs & Screenshots", "Diagnostics", "Hello {{customer_name}},\n\nTo help us diagnose this further, could you please provide:\n1. The approximate timestamp when the issue occurred\n2. Any console error messages (F12 > Console tab)\n3. A full-screen screenshot showing the error modal", now_iso)
        ]
        for cid, sc, title, cat, content, dt in default_templates:
            cursor.execute("""
            INSERT OR IGNORE INTO canned_replies (id, shortcut, title, category, content, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (cid, sc, title, cat, content, dt))
        conn.commit()

def get_all_canned_replies() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM canned_replies ORDER BY category ASC, title ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_canned_reply(shortcut: str, title: str, category: str, content: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cid = f"cr-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
    INSERT INTO canned_replies (id, shortcut, title, category, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (cid, shortcut.strip().lower(), title.strip(), category.strip(), content.strip(), now_iso))
    conn.commit()
    conn.close()
    return {"id": cid, "shortcut": shortcut, "title": title, "category": category, "content": content, "created_at": now_iso}

def delete_canned_reply(canned_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM canned_replies WHERE id = ?", (canned_id,))
    conn.commit()
    conn.close()
    return True

# --- IN-APP NOTIFICATIONS ---

def create_notification(user_id: str, title: str, message: str, ticket_id: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    nid = f"notif-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
    INSERT INTO notifications (id, user_id, title, message, ticket_id, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
    """, (nid, user_id, title, message, ticket_id, now_iso))
    conn.commit()
    conn.close()
    return {"id": nid, "user_id": user_id, "title": title, "message": message, "ticket_id": ticket_id, "is_read": 0, "created_at": now_iso}

def get_user_notifications(user_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def mark_notifications_read(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

# --- CSAT RATINGS & FEEDBACK ---

def submit_ticket_csat(ticket_id: str, rating: int, feedback: Optional[str], customer_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.utcnow().isoformat() + "Z"
    
    # Check ticket ownership
    cursor.execute("SELECT customer_id, ticket_number, assigned_agent_id FROM tickets WHERE id = ?", (ticket_id,))
    row = cursor.fetchone()
    if not row or row["customer_id"] != customer_id:
        conn.close()
        return None
        
    cursor.execute("""
    UPDATE tickets 
    SET csat_rating = ?, csat_feedback = ?
    WHERE id = ?
    """, (rating, feedback, ticket_id))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (ticket_id, "CSAT_RATING_SUBMITTED", f"Customer submitted CSAT {rating}/5 stars. Feedback: {feedback or 'None'}", customer_id, now_iso))
    
    conn.commit()
    conn.close()

    # Notify assigned agent if any (after conn closed to avoid sqlite lock)
    if row["assigned_agent_id"]:
        create_notification(
            user_id=row["assigned_agent_id"],
            title=f"CSAT Rating Received ({rating} ⭐)",
            message=f"Customer rated Ticket {row['ticket_number']}: {rating}/5 stars.",
            ticket_id=ticket_id
        )
        
    return get_ticket_by_id(ticket_id)




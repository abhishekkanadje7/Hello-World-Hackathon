import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "triagex.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        plan_tier TEXT DEFAULT 'free',
        avatar TEXT
    )
    """)
    
    # 2. Tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticket_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        plan_tier TEXT NOT NULL,
        channel TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL,
        priority_score INTEGER NOT NULL,
        assigned_tier TEXT NOT NULL,
        assigned_agent TEXT,
        routing_reason TEXT NOT NULL,
        explainability_json TEXT NOT NULL,
        kb_auto_reply_json TEXT,
        resolution_note TEXT,
        sla_minutes_remaining INTEGER DEFAULT 60
    )
    """)
    
    # 3. Audit Logs table
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
    
    # 4. Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)
    
    conn.commit()
    seed_initial_data(conn)
    conn.close()

def seed_initial_data(conn):
    cursor = conn.cursor()
    
    # Check if users already seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        default_users = [
            ("usr-admin", "admin@triagex.ai", "Rahul Deshmukh (Admin)", "admin123", "admin", "enterprise", "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"),
            ("usr-senior", "pooja.senior@triagex.ai", "Pooja Sharma (Senior Agent)", "senior123", "senior_agent", "enterprise", "https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja"),
            ("usr-standard", "vikas.agent@triagex.ai", "Vikas Patil (Support Agent)", "agent123", "standard_agent", "pro", "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikas"),
            ("usr-cust1", "abhishek@apexcorp.com", "Abhishek Kanadje (Apex Corp)", "client123", "customer", "enterprise", "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhishek"),
            ("usr-cust2", "neha@startuply.io", "Neha Kulkarni (Startuply)", "client123", "customer", "pro", "https://api.dicebear.com/7.x/avataaars/svg?seed=Neha"),
        ]
        cursor.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", default_users)
        
    # Check if tickets already seeded
    cursor.execute("SELECT COUNT(*) FROM tickets")
    if cursor.fetchone()[0] == 0:
        from .nlp_engine import build_explainability_and_route
        from .kb_engine import find_kb_match
        
        sample_tickets = [
            {
                "id": "t-1001",
                "ticket_number": "TX-901",
                "customer_name": "Abhishek Kanadje (Apex Corp)",
                "customer_email": "abhishek@apexcorp.com",
                "plan_tier": "enterprise",
                "channel": "email",
                "category": "Outage",
                "subject": "CRITICAL OUTAGE: Production Payment API Down! Losing thousands per minute!",
                "description": "Our live checkout is completely broken. Customers are getting 500 error when submitting payments. This is unacceptable! Fix this immediately or we will terminate our contract today!!!",
                "status": "Escalated",
                "assigned_agent": "Pooja Sharma (Senior Agent)",
                "created_at": "2026-10-17T18:30:00Z"
            },
            {
                "id": "t-1002",
                "ticket_number": "TX-902",
                "customer_name": "Rohan Mehta (Fintech Global)",
                "customer_email": "rohan@fintechglobal.com",
                "plan_tier": "enterprise",
                "channel": "web",
                "category": "Billing",
                "subject": "Double charged for Enterprise annual billing cycle ($24,000)",
                "description": "Our accounts department noticed two deductions of $12,000 today. We were charged twice. Please reverse the duplicate deduction immediately ASAP.",
                "status": "In Progress",
                "assigned_agent": "Pooja Sharma (Senior Agent)",
                "created_at": "2026-10-17T18:35:00Z"
            },
            {
                "id": "t-1003",
                "ticket_number": "TX-903",
                "customer_name": "Neha Kulkarni (Startuply)",
                "customer_email": "neha@startuply.io",
                "plan_tier": "pro",
                "channel": "chat",
                "category": "Technical",
                "subject": "Webhooks failing on user.created event triggers",
                "description": "Hi team, our webhook endpoint receives empty payload for the user.created event since this morning. Could you help inspect the event dispatcher?",
                "status": "Open",
                "assigned_agent": "Vikas Patil (Support Agent)",
                "created_at": "2026-10-17T18:40:00Z"
            },
            {
                "id": "t-1004",
                "ticket_number": "TX-904",
                "customer_name": "Siddharth Joshi",
                "customer_email": "siddharth@gmail.com",
                "plan_tier": "free",
                "channel": "web",
                "category": "Account",
                "subject": "How do I reset my password? Forgot credentials",
                "description": "Hello, I cannot remember my login password and need to reset it. Where do I click to reset my password?",
                "status": "Auto-Resolved",
                "assigned_agent": "AI Knowledge Base Bot",
                "created_at": "2026-10-17T18:42:00Z"
            },
            {
                "id": "t-1005",
                "ticket_number": "TX-905",
                "customer_name": "Ananya Roy",
                "customer_email": "ananya@royconsulting.com",
                "plan_tier": "pro",
                "channel": "email",
                "category": "Billing",
                "subject": "Need GST tax invoice receipt for last month's payment",
                "description": "Hi, could you please share the invoice receipt with GST number included for our auditing? Thank you!",
                "status": "Auto-Resolved",
                "assigned_agent": "AI Knowledge Base Bot",
                "created_at": "2026-10-17T18:45:00Z"
            }
        ]
        
        for st in sample_tickets:
            kb_match = find_kb_match(f"{st['subject']}\n{st['description']}")
            expl = build_explainability_and_route(
                st["subject"],
                st["description"],
                st["plan_tier"],
                kb_match
            )
            
            cursor.execute("""
            INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                st["id"],
                st["ticket_number"],
                st["customer_name"],
                st["customer_email"],
                st["plan_tier"],
                st["channel"],
                st["category"],
                st["subject"],
                st["description"],
                st["created_at"],
                st["status"],
                expl.total_priority_score,
                expl.assigned_tier,
                st.get("assigned_agent"),
                expl.summary,
                json.dumps(expl.dict()),
                json.dumps(kb_match) if kb_match else None,
                "Auto-resolved with KB article reference" if st["status"] == "Auto-Resolved" else None,
                30 if expl.total_priority_score >= 70 else 120
            ))
            
    conn.commit()

# Helper queries
def get_all_tickets() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
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
    INSERT INTO tickets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticket_data["id"],
        ticket_data["ticket_number"],
        ticket_data["customer_name"],
        ticket_data["customer_email"],
        ticket_data["plan_tier"],
        ticket_data["channel"],
        ticket_data["category"],
        ticket_data["subject"],
        ticket_data["description"],
        ticket_data["created_at"],
        ticket_data["status"],
        ticket_data["priority_score"],
        ticket_data["assigned_tier"],
        ticket_data.get("assigned_agent"),
        ticket_data["routing_reason"],
        json.dumps(ticket_data["explainability"]),
        json.dumps(ticket_data.get("kb_auto_reply")) if ticket_data.get("kb_auto_reply") else None,
        ticket_data.get("resolution_note"),
        ticket_data.get("sla_minutes_remaining", 60)
    ))
    
    # Audit log
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        ticket_data["id"],
        "TICKET_CREATED",
        f"Ticket {ticket_data['ticket_number']} routed to {ticket_data['assigned_tier']} with Priority {ticket_data['priority_score']}",
        "TriageX AI Engine",
        ticket_data["created_at"]
    ))
    
    conn.commit()
    conn.close()
    return ticket_data

def update_ticket_status(ticket_id: str, status: str, assigned_agent: Optional[str] = None, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE tickets
    SET status = ?, assigned_agent = COALESCE(?, assigned_agent), resolution_note = COALESCE(?, resolution_note)
    WHERE id = ?
    """, (status, assigned_agent, note, ticket_id))
    
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        ticket_id,
        "STATUS_UPDATED",
        f"Status changed to {status}. Assigned: {assigned_agent}. Note: {note}",
        assigned_agent or "Agent",
        datetime.utcnow().isoformat() + "Z"
    ))
    
    conn.commit()
    conn.close()
    return get_ticket_by_id(ticket_id)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    r = cursor.fetchone()
    conn.close()
    return dict(r) if r else None

def get_audit_logs() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def recalculate_all_tickets_scores(weights):
    from .nlp_engine import build_explainability_and_route
    from .kb_engine import find_kb_match
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, subject, description, plan_tier, status FROM tickets")
    rows = cursor.fetchall()
    
    updated_count = 0
    for r in rows:
        ticket_id = r["id"]
        subj = r["subject"]
        desc = r["description"]
        tier = r["plan_tier"]
        status = r["status"]
        
        kb_match = find_kb_match(f"{subj}\n{desc}")
        expl = build_explainability_and_route(subj, desc, tier, kb_match, weights)
        
        # Keep status if already resolved
        new_assigned_tier = expl.assigned_tier
        if status in ["Resolved", "Auto-Resolved"]:
            new_status = status
        else:
            new_status = "Escalated" if expl.total_priority_score >= weights.critical_threshold else "Open"
            
        cursor.execute("""
        UPDATE tickets
        SET priority_score = ?, assigned_tier = ?, routing_reason = ?, explainability_json = ?, status = ?
        WHERE id = ?
        """, (
            expl.total_priority_score,
            new_assigned_tier,
            expl.summary,
            json.dumps(expl.dict()),
            new_status,
            ticket_id
        ))
        updated_count += 1
        
    cursor.execute("""
    INSERT INTO audit_logs (ticket_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (
        "SYSTEM",
        "WEIGHTS_RECALCULATED",
        f"Recalculated {updated_count} tickets with new weights (Frustration: {weights.frustration_weight}, Urgency: {weights.urgency_weight}, Value: {weights.customer_value_weight})",
        "Admin",
        datetime.utcnow().isoformat() + "Z"
    ))
    
    conn.commit()
    conn.close()
    return updated_count

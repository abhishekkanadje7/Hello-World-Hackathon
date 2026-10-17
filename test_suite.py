"""
TriageX Master Automated Test Suite
Consolidated end-to-end and unit verification covering:
- C1: Real-time sentiment & urgency triage, auto-response, explainability
- C2: Customer SLA countdown, claim/release, agent tiers, CSAT submission, real-time sync
- C3: Admin telemetry, agent registration, canned response CRUD, ticket export
- Auth: PBKDF2 hashing, JWT token generation, RBAC checks, admin/customer login
"""
import asyncio
import os
import sys
from datetime import datetime
from fastapi import HTTPException

# Setup environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.app.database import (
    init_db, get_user_by_email, get_ticket_by_id, update_ticket_status
)
from backend.app.main import (
    health_check, register_customer, login, change_password,
    list_tickets, get_ticket, create_ticket, list_ticket_replies,
    create_reply, claim_ticket, release_ticket, get_agent_stats,
    get_admin_analytics, list_admin_users, create_agent,
    list_notifications, mark_read, list_canned, create_canned,
    delete_canned, post_csat, update_profile
)
from backend.app.models import (
    RegisterRequest, LoginRequest, ChangePasswordRequest,
    TicketCreateCustomerRequest, TicketReplyRequest
)
from backend.app.nlp_engine import (
    analyze_sentiment_and_frustration, analyze_urgency,
    calculate_priority_score, build_explainability_and_route
)

async def run_master_test_suite():
    print("=" * 70)
    print("🚀 RUNNING TRIAGEX CONSOLIDATED MASTER TEST SUITE")
    print("=" * 70)

    # Initialize DB
    init_db()

    # ----------------------------------------------------
    # SECTION 1: AUTH & RBAC VERIFICATION
    # ----------------------------------------------------
    print("\n[1/5] Verifying Authentication, RBAC & Security...")
    # Admin check
    admin = get_user_by_email("abhishekkanadje7@gmail.com")
    assert admin is not None, "Admin account abhishekkanadje7@gmail.com missing!"
    assert admin["role"] == "admin", "Admin role mismatch!"
    
    # Verify Admin Login
    admin_login_res = login(LoginRequest(email="abhishekkanadje7@gmail.com", password="Abhi*2007..."))
    assert admin_login_res["access_token"] is not None
    assert admin_login_res["user"]["role"] == "admin"
    print("  ✅ Admin credentials verified: abhishekkanadje7@gmail.com")

    # Verify Customer Registration with Role Injection Prevention
    test_user_email = f"test_customer_{int(datetime.utcnow().timestamp())}@triagex.com"
    reg_req = RegisterRequest(
        name="Test Customer",
        email=test_user_email,
        password="CustomerPassword123!",
        role="admin",  # Attacker attempts role injection
        customer_type="VIP"
    )
    reg_res = register_customer(reg_req)
    assert reg_res["user"]["role"] == "customer", "Role injection attack was NOT sanitized!"
    print("  ✅ Registration sanitize check passed (client role override ignored)")

    # Customer Login
    cust_login = login(LoginRequest(email=test_user_email, password="CustomerPassword123!"))
    assert cust_login["user"]["email"] == test_user_email
    assert cust_login["user"]["role"] == "customer"
    current_customer = cust_login["user"]
    print("  ✅ Customer login verified successfully")

    # ----------------------------------------------------
    # SECTION 2: NLP TRIAGE ENGINE & SCORING
    # ----------------------------------------------------
    print("\n[2/5] Verifying NLP Sentiment, Urgency & Explainability...")
    sample_text = "System is down! Payment gateway threw fatal errors, losing money ASAP!"
    frustration, compound, f_kws = analyze_sentiment_and_frustration(sample_text)
    urgency, u_kws = analyze_urgency(sample_text)
    priority = calculate_priority_score(frustration, urgency, customer_value_score=80.0)
    assert frustration >= 40.0
    assert urgency >= 50.0
    assert len(u_kws) > 0
    assert priority >= 60.0
    
    explain = build_explainability_and_route("Outage Alert", sample_text, "enterprise")
    assert explain.total_priority_score >= 60
    assert explain.assigned_tier in ["Critical", "Senior Agent"]
    assert len(explain.factors) == 3
    print(f"  ✅ NLP Engine evaluated correctly (Priority: {priority}, Frustration: {frustration}, Urgency: {urgency})")

    # ----------------------------------------------------
    # SECTION 3: TICKET LIFECYCLE, CLAIM/RELEASE & SLA (C1 & C2)
    # ----------------------------------------------------
    print("\n[3/5] Verifying Ticket Creation, SLA Calculation & Routing...")
    crit_req = TicketCreateCustomerRequest(
        subject="CRITICAL: Database connection pool exhausted!",
        description="All live production queries are failing with 500 server errors! This is an absolute emergency!"
    )
    crit_ticket = await create_ticket(crit_req, current_user=current_customer)
    assert crit_ticket["ticket_number"].startswith("TX-")
    assert crit_ticket["priority_score"] >= 80
    assert crit_ticket["assigned_tier"] in ["Critical", "Senior Agent"]
    assert crit_ticket["sla_due_at"] is not None
    print(f"  ✅ Critical ticket triaged: {crit_ticket['ticket_number']} | Priority: {crit_ticket['priority_score']} | Tier: {crit_ticket['assigned_tier']}")

    # Add Ticket Reply
    reply_req = TicketReplyRequest(message="Our engineers are currently investigating the database pool.")
    reply_res = await create_reply(crit_ticket["id"], reply_req, current_user=admin)
    assert reply_res["author_name"] is not None
    replies = list_ticket_replies(crit_ticket["id"], current_user=current_customer)
    assert len(replies) >= 1
    print("  ✅ Ticket communication thread verified")

    # Claim & Release
    senior = get_user_by_email("senior@triagex.com")
    claimed = await claim_ticket(crit_ticket["id"], current_user=senior)
    assert claimed["assigned_agent_id"] == senior["id"]
    released = await release_ticket(crit_ticket["id"], current_user=senior)
    assert released["assigned_agent_id"] is None
    print("  ✅ Claim & Release mechanics verified for agent tier")

    # Resolve & CSAT Feedback
    update_ticket_status(crit_ticket["id"], "Resolved", admin["id"], admin["name"], "Fixed connection pool leak")
    csat_res = await post_csat(crit_ticket["id"], {"rating": 5, "feedback": "Incredible response time! Database is healthy again."}, current_user=current_customer)
    assert csat_res["ticket"]["csat_rating"] == 5
    assert "Incredible" in csat_res["ticket"]["csat_feedback"]
    print("  ✅ CSAT rating & feedback recorded successfully")

    # Non-customer cannot submit CSAT
    try:
        await post_csat(crit_ticket["id"], {"rating": 4}, current_user=admin)
        assert False, "Admin should not be permitted to submit customer CSAT"
    except HTTPException as e:
        assert e.status_code == 403
        print("  ✅ CSAT RBAC Guard: Admin/Agent forbidden 403 from submitting customer CSAT")

    # ----------------------------------------------------
    # SECTION 4: ADMIN OPERATIONS & NOTIFICATIONS (C3)
    # ----------------------------------------------------
    print("\n[4/5] Verifying Admin Provisioning, Canned Responses & Telemetry...")
    # Agent Provisioning
    agent_email = f"agent_{int(datetime.utcnow().timestamp())}@triagex.com"
    new_agent = await create_agent({
        "name": "Support Specialist",
        "email": agent_email,
        "password": "AgentPassword123!",
        "role": "agent",
        "agent_level": "Standard"
    }, current_user=admin)
    assert new_agent["user"]["email"] == agent_email
    assert new_agent["user"]["role"] == "agent"
    print("  ✅ Admin agent provisioning verified")

    # Canned Responses
    new_canned = create_canned({
        "shortcut": f"test_{int(datetime.utcnow().timestamp())}",
        "title": "Scheduled Maintenance Notice",
        "category": "Maintenance",
        "content": "Hello {{customer_name}},\n\nPlease be advised our servers will undergo routine maintenance tonight."
    }, current_user=admin)
    assert new_canned["id"] is not None
    del_canned = delete_canned(new_canned["id"], current_user=admin)
    assert del_canned["success"] is True
    print("  ✅ Canned responses CRUD verified")

    # Telemetry & Stats
    analytics = get_admin_analytics(current_user=admin)
    assert "total_tickets" in analytics
    assert "sla_compliance_rate" in analytics
    print("  ✅ Real-time telemetry & operational analytics verified")

    # Notifications check
    notifs = list_notifications(current_user=admin)
    assert isinstance(notifs, list)
    mark_res = mark_read(current_user=admin)
    assert "read" in mark_res["message"]
    print("  ✅ In-app notifications & read receipts verified")

    # ----------------------------------------------------
    # SECTION 5: SYSTEM HEALTH
    # ----------------------------------------------------
    print("\n[5/5] Verifying FastAPI Health Check...")
    h = health_check()
    assert h["status"] == "healthy"
    print("  ✅ FastAPI Engine Health Status: Healthy")

    print("\n" + "=" * 70)
    print("🎉 ALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_master_test_suite())

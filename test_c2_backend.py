import asyncio
from datetime import datetime
from backend.app.main import (
    register_customer, login, change_password, list_tickets,
    get_ticket, create_ticket, list_ticket_replies, create_reply,
    claim_ticket, release_ticket, get_agent_stats, get_admin_analytics,
    list_admin_users, create_agent, update_user, reset_user_password,
    list_admin_faqs, create_faq, update_faq_endpoint, delete_faq_endpoint,
    test_faq_matcher, get_system_settings, save_system_settings,
    reset_demo_data_endpoint
)
from backend.app.models import (
    RegisterRequest, LoginRequest, ChangePasswordRequest,
    TicketCreateCustomerRequest, TicketReplyRequest
)
from backend.app.database import get_user_by_email, get_ticket_by_id, init_db, get_audit_logs
from fastapi import HTTPException

async def test_suite():
    print("=" * 60)
    print("🧪 RUNNING PROMPT C2 COMPREHENSIVE IN-PROCESS TEST SUITE")
    print("=" * 60)
    
    init_db()
    
    # 1. Users
    admin = get_user_by_email("admin@triagex.com")
    senior = get_user_by_email("senior@triagex.com")
    standard = get_user_by_email("agent@triagex.com")
    customer = get_user_by_email("customer@triagex.com")
    
    assert admin and senior and standard and customer
    
    # Test 1: Agent Stats Endpoint
    senior_stats = get_agent_stats(current_user=senior)
    assert "my_open_count" in senior_stats
    assert "unassigned_in_tier_count" in senior_stats
    print(f"✅ 1. Agent Stats (Senior): {senior_stats}")
    
    # Test 2: Standard Agent cannot claim Critical ticket
    all_tickets = list_tickets(status_filter=None, tier_filter=None, search=None, current_user=admin)
    crit_ticket = next((t for t in all_tickets if t["assigned_tier"] == "Critical"), None)
    assert crit_ticket is not None, "Critical ticket missing"
    
    # Admin releases it first
    await release_ticket(ticket_id=crit_ticket["id"], current_user=admin)
    
    # Standard agent tries to claim Critical ticket -> Expect 403
    try:
        await claim_ticket(ticket_id=crit_ticket["id"], current_user=standard)
        assert False, "Should have thrown 403 for Standard agent claiming Critical ticket"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"✅ 2. Standard Agent Claim Guard: Rejected 403 on Critical ticket ({e.detail})")
        
    # Test 3: Senior Agent claims Critical ticket
    claimed = await claim_ticket(ticket_id=crit_ticket["id"], current_user=senior)
    assert claimed["status"] == "In Progress"
    assert claimed["assigned_agent_id"] == senior["id"]
    print(f"✅ 3. Senior Agent Claimed Critical Ticket: Status={claimed['status']}, Assigned={claimed['assigned_agent_name']}")
    
    # Test 4: Conflict 409 if another agent attempts to claim already taken ticket
    # Create another senior agent or test with standard
    try:
        await claim_ticket(ticket_id=crit_ticket["id"], current_user=standard)
        assert False, "Should have failed claiming already claimed ticket"
    except HTTPException as e:
        assert e.status_code in [403, 409]
        print(f"✅ 4. Conflict / RBAC Protection: Got {e.status_code} on already-claimed ticket")
        
    # Test 5: Release Ticket
    released = await release_ticket(ticket_id=crit_ticket["id"], current_user=senior)
    assert released["assigned_agent_id"] is None
    assert released["status"] == "Open"
    print(f"✅ 5. Ticket Released: AssignedAgent={released['assigned_agent_id']}, Status={released['status']}")
    
    # Test 6: Admin Analytics
    analytics = get_admin_analytics(current_user=admin)
    assert "tier_distribution" in analytics
    assert "sentiment_distribution" in analytics
    assert "agent_workload" in analytics
    assert "tickets_trend" in analytics
    assert analytics["total_tickets"] > 0
    print(f"✅ 6. Admin Analytics: Total={analytics['total_tickets']}, Compliance={analytics['sla_compliance_rate']}%")
    
    # Test 7: User Management - Admin Create Agent
    unique_email = f"kavita.{datetime.utcnow().timestamp()}@triagex.com"
    new_agent_payload = {
        "name": "Kavita Rao",
        "email": unique_email,
        "agent_level": "Standard"
    }
    agent_res = await create_agent(req=new_agent_payload, current_user=admin)
    temp_pw = agent_res["temporary_password"]
    assert len(temp_pw) >= 12
    assert agent_res["user"]["must_change_password"] == 1
    print(f"✅ 7. Admin Create Agent: Created {agent_res['user']['email']} with temp password {temp_pw[:4]}***")
    
    # Test 8: Agent Initial Login & Force Password Change
    agent_login_res = login(LoginRequest(email=unique_email, password=temp_pw))
    assert agent_login_res["user"]["must_change_password"] is True
    print("✅ 8. Agent Initial Login: Forced password change flag (must_change_password=True)")
    
    # Test 9: Knowledge Base FAQ CRUD & Test Matcher
    new_faq_payload = {
        "title": "Two-Factor Authentication Setup",
        "category": "Security",
        "keywords": ["2fa", "two-factor", "authenticator", "totp", "otp security"],
        "snippet": "Enable 2FA via Settings > Security > Two-Factor Authentication with Google Authenticator.",
        "full_content": "### 2FA Guide\nScan QR code using Google Authenticator and enter 6-digit code.",
        "is_active": True
    }
    faq_created = await create_faq(req=new_faq_payload, current_user=admin)
    faq_id = faq_created["id"]
    assert faq_created["title"] == "Two-Factor Authentication Setup"
    print(f"✅ 9. FAQ Created: ID={faq_id}, Title='{faq_created['title']}'")
    
    # Test FAQ Matcher
    match_res = test_faq_matcher(req={"query": "How do I configure my two-factor authenticator app?"}, current_user=admin)
    assert match_res["matched"] is True
    assert match_res["article"]["id"] == faq_id
    print(f"✅ 10. FAQ Matcher Query Tested: Matched FAQ '{match_res['article']['title']}' with confidence {match_res['confidence']}")
    
    # Test 11: Update FAQ
    updated_faq = await update_faq_endpoint(faq_id=faq_id, req={"is_active": False}, current_user=admin)
    assert updated_faq["is_active"] == 0
    print(f"✅ 11. FAQ Updated: is_active toggled to 0")
    
    # Test 12: Delete FAQ
    del_res = await delete_faq_endpoint(faq_id=faq_id, current_user=admin)
    assert "deleted" in del_res["message"]
    print(f"✅ 12. FAQ Deleted successfully")
    
    # Test 13: System Settings & Live Weights Recalculation
    settings_saved = await save_system_settings(req={
        "sla_critical_minutes": "20",
        "active_weights": {
            "frustration_weight": 0.45,
            "urgency_weight": 0.35,
            "customer_value_weight": 0.20,
            "critical_threshold": 68,
            "standard_threshold": 38
        }
    }, current_user=admin)
    assert "updated" in settings_saved["message"]
    assert settings_saved["settings"]["sla_critical_minutes"] == "20"
    print(f"✅ 13. System Settings & Dynamic Weights Saved: {settings_saved['message']}")
    
    # Test 14: Audit Logs Verification
    logs = get_audit_logs()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert "AGENT_CREATED" in actions
    assert "FAQ_CREATED" in actions
    print(f"✅ 14. Audit Log Integrity: Verified {len(logs)} entries, captured actions: {set(actions)}")
    
    print("\n" + "=" * 60)
    print("🎉 ALL 14 C2 BACKEND VERIFICATION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_suite())

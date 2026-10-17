import asyncio
from datetime import datetime
from backend.app.main import (
    register_customer, login, change_password, list_tickets,
    get_ticket, create_ticket, list_ticket_replies, create_reply
)
from backend.app.models import (
    RegisterRequest, LoginRequest, ChangePasswordRequest,
    TicketCreateCustomerRequest, TicketReplyRequest
)
from backend.app.database import get_user_by_email, get_ticket_by_id
from fastapi import HTTPException

async def test_suite():
    print("=" * 60)
    print("🧪 RUNNING PROMPT C1 COMPREHENSIVE BACKEND TEST SUITE")
    print("=" * 60)
    
    from backend.app.database import init_db
    init_db()
    
    # 1. Admin Bootstrap
    admin = get_user_by_email("admin@triagex.com")
    assert admin is not None, "Admin account was not created at startup!"
    assert admin["role"] == "admin"
    print("✅ 1. Admin Bootstrap: admin@triagex.com exists with role 'admin'")
    
    # 2. Public Registration - Role & Customer Type Enforcement
    # Client sends malicious role="admin" and customer_type="VIP"
    test_hacker_email = f"hacker.{datetime.utcnow().timestamp()}@test.com"
    reg_req = RegisterRequest(
        name="Test Hacker",
        email=test_hacker_email,
        password="Password123",
        role="admin",
        customer_type="VIP"
    )
    reg_res = register_customer(reg_req)
    created_user = reg_res["user"]
    assert created_user["role"] == "customer", "Security failure: Server accepted client role!"
    assert created_user["customer_type"] == "Regular", "Security failure: Server accepted client customer_type!"
    print(f"✅ 2. Registration Security: Role forced to '{created_user['role']}', Customer Type forced to '{created_user['customer_type']}'")
    
    # 3. Successful Login
    login_req = LoginRequest(email=test_hacker_email, password="Password123")
    login_res = login(login_req)
    assert login_res["access_token"] is not None
    assert login_res["user"]["email"] == test_hacker_email
    print("✅ 3. Login: JWT token generated successfully")
    
    # 4. Wrong Password & Generic Error
    try:
        login(LoginRequest(email=test_hacker_email, password="WrongPassword123"))
        assert False, "Login should have failed!"
    except HTTPException as e:
        assert e.status_code == 401
        assert "Invalid email or password" in e.detail
        print("✅ 4. Wrong Password: Returned 401 with generic error")
        
    # 5. Lockout After 5 Failures
    for i in range(4):
        try:
            login(LoginRequest(email=test_hacker_email, password="WrongPassword123"))
        except HTTPException:
            pass
    # 5th failure should trigger lockout
    try:
        login(LoginRequest(email=test_hacker_email, password="WrongPassword123"))
        assert False, "Account should be locked!"
    except HTTPException as e:
        assert e.status_code == 403
        assert "temporarily locked" in e.detail.lower()
        print(f"✅ 5. Account Lockout: Triggered after 5 failures -> '{e.detail}'")
        
    # 6. Change Password
    # Log in as seeded demo customer
    cust_login = login(LoginRequest(email="customer@triagex.com", password="Customer@123"))
    cust_user = cust_login["user"]
    
    chg_res = change_password(
        ChangePasswordRequest(current_password="Customer@123", new_password="NewCustomer@999"),
        current_user=cust_user
    )
    print("✅ 6. Change Password: Password updated successfully")
    # Verify login with new password
    new_login = login(LoginRequest(email="customer@triagex.com", password="NewCustomer@999"))
    assert new_login["access_token"] is not None
    # Reset back to Customer@123
    change_password(
        ChangePasswordRequest(current_password="NewCustomer@999", new_password="Customer@123"),
        current_user=cust_user
    )
    
    # 7. Customer Isolation & Permissions
    # Customer Abhishek (VIP)
    cust_abhishek = login(LoginRequest(email="customer@triagex.com", password="Customer@123"))["user"]
    # Customer Neha (Premium)
    cust_neha = login(LoginRequest(email="neha@startuply.io", password="Customer@123"))["user"]
    
    abhishek_tickets = list_tickets(current_user=cust_abhishek)
    neha_tickets = list_tickets(current_user=cust_neha)
    
    assert len(abhishek_tickets) > 0
    assert len(neha_tickets) > 0
    for t in abhishek_tickets:
        assert t["customer_id"] == cust_abhishek["id"], "Customer saw another customer's ticket!"
    for t in neha_tickets:
        assert t["customer_id"] == cust_neha["id"], "Customer saw another customer's ticket!"
    print("✅ 7. Customer Isolation: Customers only see their own tickets")
    
    # Customer cannot access another customer's ticket via GET /api/tickets/{id}
    other_ticket_id = abhishek_tickets[0]["id"]
    try:
        get_ticket(other_ticket_id, current_user=cust_neha)
        assert False, "Customer accessed another customer's ticket!"
    except HTTPException as e:
        assert e.status_code == 403
        print(f"✅ 8. Cross-Customer Protection: Returned 403 -> '{e.detail}'")
        
    # 8. Agent Tier Isolation
    senior_agent = login(LoginRequest(email="senior@triagex.com", password="Agent@123"))["user"]
    standard_agent = login(LoginRequest(email="agent@triagex.com", password="Agent@123"))["user"]
    admin_user = login(LoginRequest(email="admin@triagex.com", password="Admin@123"))["user"]
    
    senior_tickets = list_tickets(current_user=senior_agent)
    standard_tickets = list_tickets(current_user=standard_agent)
    admin_tickets = list_tickets(current_user=admin_user)
    
    for t in senior_tickets:
        assert t["assigned_tier"] == "Critical" or t.get("assigned_agent_id") == senior_agent["id"]
    for t in standard_tickets:
        assert t["assigned_tier"] in ["Standard", "Routine"] or t.get("assigned_agent_id") == standard_agent["id"]
    assert len(admin_tickets) >= len(senior_tickets)
    print("✅ 9. Agent Tier Filtering: Senior sees Critical, Standard sees Standard/Routine, Admin sees All")
    
    # 9. Reply Visibility & Internal Notes
    # Senior agent adds an internal note and a public reply to Abhishek's ticket
    t_id = abhishek_tickets[0]["id"]
    internal_rep = await create_reply(
        t_id,
        TicketReplyRequest(message="Confidential: Investigating cloud region connectivity.", is_internal=True),
        current_user=senior_agent
    )
    public_rep = await create_reply(
        t_id,
        TicketReplyRequest(message="Hello Abhishek, we are restoring the API now.", is_internal=False),
        current_user=senior_agent
    )
    
    # Customer views replies: MUST NOT see internal note!
    cust_view_replies = list_ticket_replies(t_id, current_user=cust_abhishek)
    internal_found_for_cust = any(r["is_internal"] for r in cust_view_replies)
    assert not internal_found_for_cust, "Security failure: Customer can see internal note!"
    
    # Agent views replies: MUST see internal note!
    agent_view_replies = list_ticket_replies(t_id, current_user=senior_agent)
    internal_found_for_agent = any(r["is_internal"] for r in agent_view_replies)
    assert internal_found_for_agent, "Agent could not see internal note!"
    print("✅ 10. Reply Visibility: Internal notes hidden from customers, visible to agents")
    
    # Customer attempts to send an internal note -> forced to is_internal=False
    cust_note_attempt = await create_reply(
        t_id,
        TicketReplyRequest(message="Customer reply", is_internal=True),
        current_user=cust_abhishek
    )
    assert cust_note_attempt["is_internal"] == False, "Customer managed to post an internal note!"
    print("✅ 11. Customer Reply Guard: Forced is_internal=False for customer posts")
    
    # 10. Ticket Submission by VIP Customer -> Critical & SLA 15m
    new_crit = await create_ticket(
        TicketCreateCustomerRequest(
            subject="VIP Checkout Disaster! Database completely locked!",
            description="Our primary database is frozen. Emergency outage right now, losing thousands per minute! Fix ASAP or cancel contract!"
        ),
        current_user=cust_abhishek
    )
    assert new_crit["assigned_tier"] == "Critical"
    assert new_crit["priority_score"] >= 80
    assert new_crit["customer_type"] == "VIP"
    print(f"✅ 12. VIP Outage Ticket Created: Tier={new_crit['assigned_tier']}, Priority={new_crit['priority_score']}, SLA Due={new_crit['sla_due_at']}")
    
    # 11. FAQ Ticket Submission -> Routine & Auto-Resolved by KB
    new_faq = await create_ticket(
        TicketCreateCustomerRequest(
            subject="How do I reset my password?",
            description="I forgot my login password. Where do I reset password?"
        ),
        current_user=cust_abhishek
    )
    assert new_faq["assigned_tier"] == "Routine"
    assert new_faq["status"] == "Resolved"
    assert new_faq["kb_auto_reply"] is not None
    # Verify system reply was automatically inserted
    faq_replies = list_ticket_replies(new_faq["id"], current_user=cust_abhishek)
    assert len(faq_replies) >= 1
    assert faq_replies[0]["author_role"] == "system"
    print(f"✅ 13. FAQ Routine Ticket: Auto-Resolved with KB system reply in {new_faq['assigned_tier']} tier")
    
    print("\n" + "=" * 60)
    print("🎉 ALL 13 C1 BACKEND VERIFICATION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_suite())

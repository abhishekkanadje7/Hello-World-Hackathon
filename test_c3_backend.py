import asyncio
from datetime import datetime
from backend.app.main import (
    register_customer, login, list_tickets, get_ticket,
    create_ticket, list_notifications, mark_read,
    list_canned, create_canned, delete_canned, post_csat,
    update_profile
)
from backend.app.models import (
    RegisterRequest, LoginRequest, TicketCreateCustomerRequest
)
from backend.app.database import get_user_by_email, get_ticket_by_id, init_db
from fastapi import HTTPException

async def test_suite():
    print("=" * 60)
    print("🧪 RUNNING PROMPT C3 COMPREHENSIVE IN-PROCESS TEST SUITE")
    print("=" * 60)
    
    init_db()
    
    admin = get_user_by_email("admin@triagex.com")
    senior = get_user_by_email("senior@triagex.com")
    customer = get_user_by_email("customer@triagex.com")
    
    assert admin and senior and customer
    
    # Test 1: Ticket Pagination
    paginated_res = list_tickets(
        status_filter=None,
        tier_filter=None,
        search=None,
        page=1,
        page_size=3,
        current_user=admin
    )
    assert "items" in paginated_res, "Pagination response missing 'items'"
    assert len(paginated_res["items"]) <= 3
    assert paginated_res["total"] > 0
    assert paginated_res["total_pages"] >= 1
    print(f"✅ 1. Ticket Pagination: Page 1 returned {len(paginated_res['items'])} items (Total: {paginated_res['total']}, Total Pages: {paginated_res['total_pages']})")
    
    # Test 2: In-App Notifications Dispatch
    # Create critical ticket as VIP customer
    new_ticket = await create_ticket(
        TicketCreateCustomerRequest(
            subject="Critical Database Cluster Latency Spike",
            description="Our database queries are timing out at 30,000ms! All customer checkout operations blocked!",
            category="Technical",
            channel="web"
        ),
        current_user=customer
    )
    assert new_ticket["assigned_tier"] == "Critical"
    
    # Verify senior agent received notification
    senior_notifs = list_notifications(current_user=senior)
    crit_notif = next((n for n in senior_notifs if "Critical Ticket" in n["title"]), None)
    assert crit_notif is not None, "Senior agent did not receive critical ticket notification"
    print(f"✅ 2. In-App Notification: Senior Agent notified of '{crit_notif['title']}'")
    
    # Test 3: Mark Notifications as Read
    mark_read_res = mark_read(current_user=senior)
    assert "read" in mark_read_res["message"]
    after_read_notifs = list_notifications(current_user=senior)
    assert all(n["is_read"] == 1 for n in after_read_notifs)
    print("✅ 3. Notifications Read Status: Successfully marked all as read (is_read=1)")
    
    # Test 4: CSAT Rating Submission
    # Resolve ticket first
    from backend.app.database import update_ticket_status
    update_ticket_status(new_ticket["id"], "Resolved", senior["id"], senior["name"], "Optimized index on database")
    
    csat_res = await post_csat(
        ticket_id=new_ticket["id"],
        req={"rating": 5, "feedback": "Amazing response time! Issue resolved within 10 minutes."},
        current_user=customer
    )
    assert csat_res["ticket"]["csat_rating"] == 5
    assert "Amazing response" in csat_res["ticket"]["csat_feedback"]
    print(f"✅ 4. Customer CSAT Rating: Submitted 5/5 stars rating with feedback '{csat_res['ticket']['csat_feedback']}'")
    
    # Non-customer cannot submit CSAT
    try:
        await post_csat(ticket_id=new_ticket["id"], req={"rating": 4}, current_user=senior)
        assert False, "Agent should not be permitted to submit CSAT"
    except HTTPException as e:
        assert e.status_code == 403
        print("✅ 5. CSAT RBAC Guard: Agent forbidden 403 from submitting customer CSAT")
        
    # Test 6: Canned Replies CRUD
    all_canned = list_canned(current_user=senior)
    assert len(all_canned) >= 4
    greet_template = next((c for c in all_canned if c["shortcut"] == "greet"), None)
    assert greet_template is not None
    print(f"✅ 6. Canned Replies: Loaded {len(all_canned)} templates (e.g. /{greet_template['shortcut']} - '{greet_template['title']}')")
    
    # Create new canned reply as Admin
    new_canned = create_canned(
        req={
            "shortcut": f"test_{int(datetime.utcnow().timestamp())}",
            "title": "Scheduled Maintenance Notice",
            "category": "Maintenance",
            "content": "Hello {{customer_name}},\n\nPlease be advised our servers will undergo routine maintenance tonight."
        },
        current_user=admin
    )
    assert new_canned["id"] is not None
    print(f"✅ 7. Canned Reply Created: Shortcut /{new_canned['shortcut']}")
    
    # Delete canned reply
    del_canned = delete_canned(new_canned["id"], current_user=admin)
    assert del_canned["success"] is True
    print("✅ 8. Canned Reply Deleted: Admin deleted template")
    
    # Test 9: User Profile Update
    updated_profile = update_profile(
        req={"name": "Abhishek Kanadje (Lead)"},
        current_user=customer
    )
    assert updated_profile["name"] == "Abhishek Kanadje (Lead)"
    print(f"✅ 9. User Profile Update: Name updated to '{updated_profile['name']}'")
    
    # Revert name
    update_profile(req={"name": "Abhishek Kanadje"}, current_user=customer)
    
    print("\n" + "=" * 60)
    print("🎉 ALL 9 C3 BACKEND VERIFICATION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_suite())

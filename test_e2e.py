import asyncio
from backend.app.main import (
    health_check, get_demo_users, list_tickets, create_ticket,
    update_ticket, get_dashboard_stats, update_weights
)
from backend.app.models import (
    TicketCreateRequest, TicketStatusUpdate, WeightsUpdateRequest
)

async def run_tests():
    print("🧪 Running End-to-End Direct FastAPI Engine Tests...\n")
    
    # 1. Health
    h = health_check()
    print("✅ 1. Health Check:", h["status"])
    assert h["status"] == "healthy"
    
    # 2. Demo Users
    users = get_demo_users()
    print(f"✅ 2. Demo Users Loaded: {len(users)} personas available")
    assert len(users) >= 4
    for u in users:
        print(f"   - {u['name']} ({u['role']}, {u['plan_tier']} tier)")
    
    # 3. Tickets list
    tickets = list_tickets()
    print(f"\n✅ 3. Existing Tickets: {len(tickets)} tickets in SQLite")
    assert len(tickets) >= 5
    print(f"   Top ticket: {tickets[0]['ticket_number']} (Priority: {tickets[0]['priority_score']}, Assigned: {tickets[0]['assigned_tier']})")
    
    # 4. Create Critical Ticket
    critical_req = TicketCreateRequest(
        customer_name="Test Enterprise Exec",
        customer_email="exec@enterprise.com",
        plan_tier="enterprise",
        channel="email",
        category="Outage",
        subject="EMERGENCY: Payment gateway offline, losing $50,000 every hour!",
        description="Production checkout is failing for all European customers. This is an absolute disaster! Fix this immediately or we terminate contract today!!!"
    )
    crit_ticket = await create_ticket(critical_req)
    print(f"\n✅ 4. Critical Ticket Created:")
    print(f"   - Number: {crit_ticket['ticket_number']}")
    print(f"   - Priority Score: {crit_ticket['priority_score']}/100")
    print(f"   - Assigned Tier: {crit_ticket['assigned_tier']} ({crit_ticket['assigned_agent']})")
    print(f"   - Status: {crit_ticket['status']}")
    print(f"   - Rationale: {crit_ticket['routing_reason']}")
    assert crit_ticket["priority_score"] >= 85
    assert crit_ticket["assigned_tier"] == "Senior Agent"
    
    # 5. Create FAQ Routine Ticket
    routine_req = TicketCreateRequest(
        customer_name="New User",
        customer_email="user@gmail.com",
        plan_tier="free",
        channel="web",
        category="Account",
        subject="Forgot password assistance",
        description="How do I reset my password? I forgot my login credentials."
    )
    faq_ticket = await create_ticket(routine_req)
    print(f"\n✅ 5. FAQ Routine Ticket Created:")
    print(f"   - Number: {faq_ticket['ticket_number']}")
    print(f"   - Priority Score: {faq_ticket['priority_score']}/100")
    print(f"   - Assigned Tier: {faq_ticket['assigned_tier']}")
    print(f"   - Status: {faq_ticket['status']}")
    print(f"   - KB Match: {faq_ticket['kb_auto_reply']['title']}")
    assert faq_ticket["assigned_tier"] == "KB Auto-reply"
    assert faq_ticket["status"] == "Auto-Resolved"
    
    # 6. Update Status
    upd = await update_ticket(
        crit_ticket["id"],
        TicketStatusUpdate(status="In Progress", assigned_agent="Pooja Sharma (Senior Agent)")
    )
    print(f"\n✅ 6. Ticket Status Updated: {upd['ticket_number']} is now {upd['status']}")
    assert upd["status"] == "In Progress"
    
    # 7. Update Weights & Recalculate
    weight_req = WeightsUpdateRequest(
        frustration_weight=0.50,
        urgency_weight=0.30,
        customer_value_weight=0.20,
        critical_threshold=70,
        standard_threshold=40
    )
    res_w = await update_weights(weight_req)
    print(f"\n✅ 7. Weights Dynamically Tuned and Recalculated: {res_w['message']}")
    
    # 8. Stats
    stats = get_dashboard_stats()
    print(f"\n✅ 8. System Analytics & KPIs:")
    print(f"   - Total Tickets: {stats['total_tickets']}")
    print(f"   - Critical Priority Count: {stats['critical_priority_count']}")
    print(f"   - KB Deflection Rate: {stats['kb_deflection_rate_percentage']}%")
    print(f"   - VIP Churn Risks Mitigated: {stats['churn_risk_mitigated_vip']}")
    print(f"   - Avg Response Time: {stats['avg_first_response_minutes']} mins")
    
    print("\n" + "="*60)
    print("🎉 ALL 8 FULL-STACK BACKEND & NLP TESTS PASSED 100%!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(run_tests())

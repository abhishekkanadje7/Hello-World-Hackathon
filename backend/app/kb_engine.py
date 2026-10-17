from typing import Optional, Dict, Any, List
import re

DEFAULT_KB_ARTICLES = [
    {
        "id": "kb-001",
        "title": "How to Reset Your Account Password",
        "category": "Account Access",
        "keywords": ["password", "reset password", "forgot password", "change password", "login issue", "cannot log in"],
        "snippet": "Go to the login screen, click 'Forgot Password', enter your registered email address, and follow the verification link sent within 5 minutes.",
        "full_content": "### Password Reset Guide\n1. Visit the login portal at `/login`.\n2. Click the **'Forgot Password'** link below the input field.\n3. Enter your account email address.\n4. Check your inbox for the 6-digit verification code.\n5. Set a new password with at least 8 characters including 1 number and 1 special character."
    },
    {
        "id": "kb-002",
        "title": "Refund and Billing Cancellation Policy",
        "category": "Billing",
        "keywords": ["refund", "money back", "billing policy", "cancel subscription", "chargeback policy", "refund request"],
        "snippet": "We offer a 14-day no-questions-asked refund policy for all monthly subscriptions. Annual plans can be refunded prorated within 30 days.",
        "full_content": "### Refund Policy Overview\n- **14-day Money-back Guarantee:** All new monthly subscriptions qualify for full refund.\n- **Annual Subscriptions:** Prorated refund within 30 days of billing cycle.\n- **How to claim:** Visit Account Settings -> Billing -> Request Refund."
    },
    {
        "id": "kb-003",
        "title": "Downloading Past Invoices and Tax Receipts",
        "category": "Billing",
        "keywords": ["invoice", "receipt", "download invoice", "tax receipt", "gst invoice", "billing receipt"],
        "snippet": "Invoices can be downloaded as PDF anytime from Settings > Billing > Payment History.",
        "full_content": "### Invoices & Receipts\n1. Navigate to **Settings** in the top-right menu.\n2. Select **Billing & Invoices**.\n3. Scroll down to **Payment History**.\n4. Click the **Download PDF** icon next to any billing period."
    },
    {
        "id": "kb-004",
        "title": "API Rate Limits and Usage Thresholds",
        "category": "Developer API",
        "keywords": ["api rate limit", "429 error", "too many requests", "throttle", "api limits", "rate limit"],
        "snippet": "Free tier has 100 req/min. Pro has 1,000 req/min. Enterprise has custom uncapped limits with dedicated SLA.",
        "full_content": "### Rate Limits by Plan\n- **Free Tier:** 100 requests per minute.\n- **Pro Tier:** 1,000 requests per minute with burst allowance.\n- **Enterprise:** Custom SLA up to 10,000+ requests/sec with dedicated endpoints."
    },
    {
        "id": "kb-005",
        "title": "Configuring Webhooks and Event Notifications",
        "category": "Integrations",
        "keywords": ["webhook", "event webhook", "webhook endpoint", "configure webhook", "callback url"],
        "snippet": "Navigate to Developer Settings > Webhooks to register your HTTPS endpoints and subscribe to events.",
        "full_content": "### Webhook Integration\n1. Go to **Developer Settings -> Webhooks**.\n2. Click **Add Endpoint** and enter your valid HTTPS URL.\n3. Select event triggers (e.g. `ticket.created`, `ticket.resolved`).\n4. Copy the webhook secret for cryptographic HMAC-SHA256 signature verification."
    }
]

def get_active_kb_articles() -> List[Dict[str, Any]]:
    try:
        from .database import get_all_faqs
        faqs = get_all_faqs(active_only=True)
        if faqs and len(faqs) > 0:
            return faqs
    except Exception:
        pass
    return DEFAULT_KB_ARTICLES

def find_kb_match(text: str) -> Optional[Dict[str, Any]]:
    """
    Checks if the user's text matches any FAQ with high confidence.
    """
    text_lower = text.lower()
    best_match = None
    max_score = 0
    articles = get_active_kb_articles()
    
    for article in articles:
        score = 0
        keywords = article.get("keywords", [])
        if isinstance(keywords, str):
            try:
                import json
                keywords = json.loads(keywords)
            except Exception:
                keywords = [k.strip() for k in keywords.split(",") if k.strip()]
                
        for kw in keywords:
            kw_clean = str(kw).strip().lower()
            if not kw_clean:
                continue
            if re.search(r'\b' + re.escape(kw_clean) + r'\b', text_lower):
                score += 2
            elif kw_clean in text_lower:
                score += 1
                
        if score > max_score and score >= 2:
            max_score = score
            best_match = article
            
    if best_match:
        confidence = min(0.98, round(0.5 + (max_score * 0.1), 2))
        return {
            "id": best_match["id"],
            "title": best_match["title"],
            "snippet": best_match["snippet"],
            "full_content": best_match["full_content"],
            "confidence": confidence
        }
        
    return None


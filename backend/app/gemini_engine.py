# =============================================================================
# TriageX - Google Gemini Direct AI Autonomous Triage Engine
# कमेंट: थेट गुगल जेमिनी (Google Gemini LLM) द्वारे प्रत्येक तिकिटाचे 
# संपूर्ण मानवी संदर्भासह विश्लेषण, निकड, भावना, Priority Score (0-100), 
# आणि सपोर्ट एजंटसाठी रेडीमेड उत्तराचा मसुदा (AI Solution Draft) तयार करणे.
# =============================================================================

import os
import json
import logging
import requests
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger("triagex.gemini")

# Environment variable check
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

def get_gemini_api_key() -> str:
    """Retrieves Gemini API Key from environment or database settings."""
    global GEMINI_API_KEY
    if GEMINI_API_KEY:
        return GEMINI_API_KEY
    try:
        from .database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = 'gemini_api_key'")
        row = cursor.fetchone()
        conn.close()
        if row and row[0]:
            return row[0].strip()
    except Exception as e:
        logger.debug(f"Could not load gemini_api_key from settings: {e}")
    return ""

def set_gemini_api_key(api_key: str):
    """Saves Gemini API Key to database settings."""
    global GEMINI_API_KEY
    GEMINI_API_KEY = api_key.strip()
    try:
        from .database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO settings (key, value) VALUES ('gemini_api_key', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (api_key.strip(),))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to save gemini_api_key: {e}")

def call_gemini_triage(
    subject: str,
    description: str,
    customer_type: str,
    category: str = "Technical Support"
) -> Optional[Dict[str, Any]]:
    """
    Directly asks Google Gemini AI to analyze the incoming ticket.
    Returns:
        dict with priority_score, urgency_score, frustration_score,
        assigned_tier, routing_reason, suggested_solution, and model_name.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return None

    prompt = f"""You are the autonomous AI Support Triage Brain for TriageX.
Analyze this incoming customer support ticket:

CUSTOMER ACCOUNT TIER: {customer_type}
DEPARTMENT / CATEGORY: {category}
SUBJECT: {subject}
DESCRIPTION:
{description}

Instructions:
1. Urgency score (0.0 to 100.0): How urgent is this technically or financially? Are they down or losing money?
2. Frustration score (0.0 to 100.0): Measure customer sentiment, impatience, or distress.
3. Total Priority Score (integer 0 to 100): Weighted synthesis of urgency (40%), frustration (40%), and customer tier (20%).
4. Assigned Tier: "Critical" if Priority Score >= 70, "Standard" if Priority Score >= 35, else "Routine".
5. Key issue summary: 1 clear sentence summarizing the root issue.
6. Routing reason: 1-2 sentences explaining why AI selected this score and tier.
7. Suggested Agent Solution: 2-3 sentences drafting an empathetic, helpful technical response that the human support agent can send to the customer.

Return ONLY valid JSON matching this exact structure:
{{
  "priority_score": 85,
  "urgency_score": 90.0,
  "frustration_score": 80.0,
  "assigned_tier": "Critical",
  "key_issue": "Production checkout gateway 500 errors causing financial transactions to fail.",
  "routing_reason": "Direct AI evaluation detected severe production downtime with active financial loss.",
  "suggested_solution": "Hello! Our engineering team has identified the gateway timeout and is deploying a hotfix right now."
}}
"""

    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]

    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }
            res = requests.post(url, headers=headers, json=payload, timeout=7)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                parsed["ai_engine"] = f"Google Gemini ({model_name})"
                return parsed
        except Exception as e:
            logger.warning(f"Gemini model {model_name} invocation failed: {e}")
            continue

    return None

# =============================================================================
# TriageX - Cognitive Semantic Understanding AI Engine
# कमेंट: खऱ्या अर्थाने संदर्भ (Context), भावना (Sentiment), तांत्रिक गांभीर्य (Technical Severity), 
# आणि बिझनेस रिस्क समजून घेणारे प्रगत AI इंजिन.
# इंग्रजी व मराठी/हिंग्लिश दोन्ही भाषांमधील समस्या अचूक समजून घेऊन
# आपोआप प्रायॉरिटी स्कोअर, राऊटिंग कारण आणि एजंटसाठी तयार उत्तर (AI Solution) बनवते.
# =============================================================================

import re
from typing import Dict, Any, List, Tuple, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .config import CURRENT_WEIGHTS, PLAN_VALUE_MAP
from .models import ExplainabilityBreakdown, ExplainabilityItem

analyzer = SentimentIntensityAnalyzer()

# =============================================================================
# १. सखोल सिमेंटिक पॅटर्न्स (Semantic Domain & Intent Patterns)
# =============================================================================

CRITICAL_OUTAGE_PATTERNS = [
    r"\b(server|service|system|api|database|app|website|gateway|production)\b.*\b(down|crashed|offline|dead|stopped|failed|unresponsive|unavailable)\b",
    r"\b(500|502|503|504)\b",
    r"\b(production\s+outage|total\s+outage|major\s+outage|catastrophic|system\s+crash)\b",
    r"\b(data\s+loss|database\s+corrupted|corrupted\s+data|data\s+leak|security\s+breach|hacked|ransomware)\b",
    r"\b(band\s+padla|chalu\s+hot\s+nahi|crash\s+zala|band\s+aahe|kam\s+karat\s+nahi|thapla)\b" # मराठी/हिंग्लिश
]

FINANCIAL_IMPACT_PATTERNS = [
    r"\b(payment|checkout|transaction|charge|billing|invoice|credit\s+card|subscription|refund)\b.*\b(failed|stuck|error|broken|rejected|double|twice)\b",
    r"\b(losing\s+(money|revenue|customers|clients|thousands|millions|sales))\b",
    r"\b(charged\s+twice|double\s+charged|unauthorized\s+charge|money\s+deducted)\b",
    r"\b(cannot\s+checkout|unable\s+to\s+pay|payment\s+gateway\s+down)\b",
    r"\b(paise\s+kaple|payment\s+zal\s+nahi|paise\s+adakle|checkout\s+hot\s+nahi)\b" # मराठी
]

SECURITY_ACCESS_PATTERNS = [
    r"\b(account\s+locked|locked\s+out|access\s+denied|unauthorized|2fa\s+broken|mfa\s+failed|compromised|hacked)\b",
    r"\b(password\s+reset\s+not\s+working|cannot\s+login|login\s+failed|credentials)\b",
    r"\b(login\s+hot\s+nahi|account\s+lock\s+zala)\b" # मराठी
]

BUSINESS_CHURN_PATTERNS = [
    r"\b(cancel\s+(my\s+)?(subscription|contract|service|plan|account))\b",
    r"\b(terminate\s+contract|switch(ing)?\s+to\s+competitor|leaving\s+your\s+platform)\b",
    r"\b(lawsuit|legal\s+action|sue\s+you|call\s+my\s+lawyer|fraud|scam|unacceptable)\b",
    r"\b(disaster|worst\s+experience|terrible\s+service|incompetent|pathetic)\b"
]

ROUTINE_INQUIRY_PATTERNS = [
    r"\b(how\s+do\s+i|how\s+to|where\s+can\s+i|can\s+you\s+explain|documentation|guide)\b",
    r"\b(just\s+wondering|general\s+inquiry|curious|quick\s+question|feedback|suggestion)\b",
    r"\b(feature\s+request|nice\s+to\s+have|inquiry|thank\s+you|thanks)\b",
    r"\b(kase\s+karave|mahiti\s+pahije|sangashil\s+ka)\b" # मराठी
]

# =============================================================================
# २. कॉग्निटिव्ह समज आणि स्कोअरिंग इंजिन (Cognitive Semantic Analyzer)
# =============================================================================

def perform_cognitive_analysis(text: str) -> Dict[str, Any]:
    """
    संपूर्ण मजकूर वाचून त्याचा तांत्रिक, आर्थिक आणि मानसिक संदर्भ समजून घेते.
    """
    text_clean = text.strip()
    text_lower = text_clean.lower()

    # VADER मूलभूत भावना
    vader_res = analyzer.polarity_scores(text_clean)
    compound = vader_res["compound"]

    # डोमेन वर्गीकरण आणि गांभीर्य तपासणी
    detected_domains = []
    is_critical_outage = any(re.search(p, text_lower) for p in CRITICAL_OUTAGE_PATTERNS)
    is_financial = any(re.search(p, text_lower) for p in FINANCIAL_IMPACT_PATTERNS)
    is_security = any(re.search(p, text_lower) for p in SECURITY_ACCESS_PATTERNS)
    is_churn_risk = any(re.search(p, text_lower) for p in BUSINESS_CHURN_PATTERNS)
    is_routine = any(re.search(p, text_lower) for p in ROUTINE_INQUIRY_PATTERNS)

    if is_critical_outage: detected_domains.append("System Infrastructure Outage")
    if is_financial: detected_domains.append("Financial & Revenue Failure")
    if is_security: detected_domains.append("Account Security & Access")
    if is_churn_risk: detected_domains.append("High Churn / Contract Risk")
    if is_routine: detected_domains.append("Routine Informational Inquiry")

    # १. Urgency Score (0 - 100)
    urgency = 20.0  # Base
    if is_critical_outage:
        urgency += 70.0
    elif is_financial:
        urgency += 55.0
    elif is_security:
        urgency += 45.0
    
    if "urgent" in text_lower or "emergency" in text_lower or "immediately" in text_lower or "asap" in text_lower:
        urgency += 15.0
    if is_routine and not (is_critical_outage or is_financial):
        urgency = max(10.0, urgency - 15.0)

    # २. Frustration Score (0 - 100)
    # Compound: -1 (very negative) => 100, +1 (positive) => 0
    base_frustration = ((1.0 - compound) / 2.0) * 100.0
    frustration_boost = 0.0

    if is_churn_risk:
        frustration_boost += 35.0
    if is_financial:
        frustration_boost += 15.0
    
    # उद्गारवाचक चिन्हे व मोठ्या अक्षरांचा राग (Exclamation & ALL CAPS)
    excl_count = text_clean.count("!")
    if excl_count >= 3: frustration_boost += 15.0
    elif excl_count >= 1: frustration_boost += 5.0

    caps_words = re.findall(r"\b[A-Z]{3,}\b", text_clean)
    if len(caps_words) >= 2: frustration_boost += 15.0

    frustration = min(100.0, max(5.0, base_frustration + frustration_boost))
    urgency = min(100.0, max(5.0, urgency))

    # ३. समस्येचा मुख्य सारांश (Root Problem Summary)
    if is_critical_outage and is_financial:
        key_issue = "Critical production outage directly impacting customer payment transactions."
        suggested_solution = "Acknowledge the transaction freeze immediately. Verify payment gateway logs for 500 status codes, and update the customer with our 15-minute engineering ETA."
    elif is_critical_outage:
        key_issue = "Production infrastructure or service disruption causing critical system downtime."
        suggested_solution = "Prioritize immediate SRE incident triage. Check API gateway load and database connection pools, then provide the customer with ongoing status updates."
    elif is_financial:
        key_issue = "Billing/payment processing anomaly with direct financial customer friction."
        suggested_solution = "Audit the customer's billing ledger and payment gateway charge IDs. Reconcile any duplicate charges and issue an immediate receipt/credit confirmation."
    elif is_security:
        key_issue = "User account access blockage or security authentication failure."
        suggested_solution = "Verify user identity via secondary authentication, unlock the affected profile, and dispatch a secure one-time password reset link."
    elif is_churn_risk:
        key_issue = "Severe customer dissatisfaction with imminent risk of account cancellation."
        suggested_solution = "Respond with high executive empathy. Acknowledge past pain points, escalate to a Senior Support Lead, and offer priority resolution assistance."
    elif is_routine:
        key_issue = "General information request or routine product usage guidance."
        suggested_solution = "Provide clear, step-by-step documentation links and friendly guidance to address the customer's inquiry."
    else:
        key_issue = "Standard customer support inquiry requiring operational evaluation."
        suggested_solution = "Review the provided customer context, verify system logs, and post a detailed clarifying update."

    return {
        "urgency_score": round(urgency, 1),
        "frustration_score": round(frustration, 1),
        "compound": round(compound, 3),
        "domains": detected_domains,
        "key_issue": key_issue,
        "suggested_solution": suggested_solution
    }

# =============================================================================
# ३. फायनल Priority आणि राऊटिंग निर्णय (Master Route & Explainability)
# =============================================================================

def find_similar_resolved_ticket(subject: str, description: str, resolved_tickets: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    पूर्वी सोडवलेल्या (Resolved) तिकीटांमधील समान प्रश्न शोधणे (Case-Based Reasoning).
    जर नवा प्रश्न आधीच्या सोडवलेल्या प्रश्नासारखा असेल तर त्याचे आधीचे यशस्वी उत्तर थेट सुचवते.
    """
    if not resolved_tickets:
        return None
        
    def extract_tokens(text: str) -> set:
        words = re.findall(r"\b[a-zA-Z0-9_]{3,}\b", (text or "").lower())
        stopwords = {
            "the", "and", "for", "with", "this", "that", "from", "have", "been", 
            "when", "what", "your", "help", "please", "issue", "problem", "ticket",
            "support", "cannot", "could", "would", "about", "there", "their"
        }
        return set(w for w in words if w not in stopwords)
        
    curr_tokens = extract_tokens(f"{subject} {description}")
    if not curr_tokens:
        return None
        
    best_match = None
    best_score = 0.0
    
    for prev in resolved_tickets:
        prev_subj = prev.get("subject", "")
        prev_desc = prev.get("description", "")
        prev_res = prev.get("resolution_note", "")
        if not prev_res or len(prev_res.strip()) < 5:
            continue
            
        prev_tokens = extract_tokens(f"{prev_subj} {prev_desc}")
        if not prev_tokens:
            continue
            
        intersection = curr_tokens.intersection(prev_tokens)
        union = curr_tokens.union(prev_tokens)
        jaccard = len(intersection) / len(union) if union else 0.0
        
        # Subject matching gets enhanced weight
        subj_tokens = extract_tokens(prev_subj)
        subj_inter = extract_tokens(subject).intersection(subj_tokens)
        subj_overlap = len(subj_inter) / max(1, len(subj_tokens)) if subj_tokens else 0.0
        
        combined_similarity = (jaccard * 0.55) + (subj_overlap * 0.45)
        
        if combined_similarity > best_score:
            best_score = combined_similarity
            best_match = {
                "matched_ticket_id": prev.get("id"),
                "matched_ticket_number": prev.get("ticket_number"),
                "matched_subject": prev_subj,
                "resolution_note": prev_res,
                "similarity_score": round(best_score * 100, 1),
                "matched_keywords": list(intersection)[:6]
            }
            
    # Require at least 32% match or 2+ shared core tokens
    if best_match and (best_match["similarity_score"] >= 32.0 or len(best_match["matched_keywords"]) >= 2):
        return best_match
    return None

def build_explainability_and_route(
    subject: str,
    description: str,
    customer_type: str,
    kb_match: Optional[Dict[str, Any]] = None,
    weights = CURRENT_WEIGHTS,
    customer_priority: Optional[str] = "Normal",
    historical_match: Optional[Dict[str, Any]] = None
) -> ExplainabilityBreakdown:
    # पायरी १: जर Google Gemini API उपलब्ध असेल तर थेट LLM कडे पाठवणे
    try:
        from .gemini_engine import call_gemini_triage, get_gemini_api_key
        if get_gemini_api_key():
            gemini_result = call_gemini_triage(subject, description, customer_type)
            if gemini_result and "priority_score" in gemini_result:
                p_score = int(gemini_result.get("priority_score", 50))
                a_tier = gemini_result.get("assigned_tier") or ("Critical" if p_score >= weights.critical_threshold else "Standard" if p_score >= weights.standard_threshold else "Routine")
                r_reason = gemini_result.get("routing_reason") or "Direct AI autonomous classification."
                urg = float(gemini_result.get("urgency_score", 50.0))
                frust = float(gemini_result.get("frustration_score", 50.0))
                suggested = gemini_result.get("suggested_solution", "")
                key_issue = gemini_result.get("key_issue", "")

                factors = [
                    ExplainabilityItem(
                        factor="Google Gemini LLM Evaluation",
                        score=float(p_score),
                        weight=100.0,
                        contribution=float(p_score),
                        detail=f"Direct LLM Analysis: {key_issue}"
                    ),
                    ExplainabilityItem(
                        factor="Technical Urgency (Gemini)",
                        score=urg,
                        weight=40.0,
                        contribution=round(urg * 0.4, 1),
                        detail=f"Assessed urgency: {urg}/100"
                    ),
                    ExplainabilityItem(
                        factor="Customer Sentiment (Gemini)",
                        score=frust,
                        weight=40.0,
                        contribution=round(frust * 0.4, 1),
                        detail=f"Detected sentiment distress: {frust}/100"
                    )
                ]
                summary_text = f"⚡ Direct Gemini AI Decision: {r_reason}"
                if suggested:
                    summary_text += f" | AI Suggested Solution: {suggested}"
                if historical_match:
                    summary_text += f" | 🔍 Historical Resolution matched from {historical_match['matched_ticket_number']}"

                return ExplainabilityBreakdown(
                    total_priority_score=p_score,
                    assigned_tier=a_tier,
                    factors=factors,
                    summary=summary_text
                )
    except Exception:
        pass

    # पायरी २: प्रगत सिमेंटिक कॉग्निटिव्ह AI इंजिन (Built-in Cognitive Semantic AI Brain)
    full_text = f"{subject}\n{description}"
    cog = perform_cognitive_analysis(full_text)

    # Customer Stated Urgency Modifier (Feature 3: Priority given by customer)
    cust_prio_clean = (customer_priority or "Normal").strip().capitalize()
    prio_modifier = 0.0
    if cust_prio_clean == "Low":
        prio_modifier = -5.0
    elif cust_prio_clean == "High":
        prio_modifier = 12.0
    elif cust_prio_clean == "Urgent":
        prio_modifier = 22.0

    adjusted_urgency = min(100.0, max(5.0, cog["urgency_score"] + prio_modifier))

    tier_clean = (customer_type or "Regular").lower()
    value_score = float(PLAN_VALUE_MAP.get(tier_clean, 20))

    # Weight distribution
    total_w = weights.frustration_weight + weights.urgency_weight + weights.customer_value_weight
    if total_w <= 0: total_w = 1.0

    w_f = weights.frustration_weight / total_w
    w_u = weights.urgency_weight / total_w
    w_v = weights.customer_value_weight / total_w

    calculated_score = (adjusted_urgency * w_u) + (cog["frustration_score"] * w_f) + (value_score * w_v)
    priority_score = int(round(min(100.0, max(0.0, calculated_score))))

    # Routing Tier Assignment
    if kb_match and priority_score < weights.critical_threshold:
        assigned_tier = "Routine"
        routing_reason = f"Routine FAQ match ('{kb_match.get('title')}') with priority score {priority_score}/100. Auto-resolved by Knowledge Base."
    elif priority_score >= weights.critical_threshold:
        assigned_tier = "Critical"
        routing_reason = f"Cognitive AI detected Critical Tier ({priority_score}/100). Immediate Senior Escalation Required: {cog['key_issue']}"
    elif priority_score >= weights.standard_threshold:
        assigned_tier = "Standard"
        routing_reason = f"Cognitive AI assigned Standard Tier ({priority_score}/100): {cog['key_issue']}"
    else:
        assigned_tier = "Routine"
        routing_reason = f"Routine Priority ({priority_score}/100): Standard support resolution."

    f_contrib = round(cog["frustration_score"] * w_f, 1)
    u_contrib = round(adjusted_urgency * w_u, 1)
    v_contrib = round(value_score * w_v, 1)

    factors = [
        ExplainabilityItem(
            factor="Cognitive Semantic Understanding",
            score=adjusted_urgency,
            weight=round(w_u * 100, 1),
            contribution=u_contrib,
            detail=f"Key Diagnosis: {cog['key_issue']} (Urgency: {adjusted_urgency}/100, Customer Stated: {cust_prio_clean})"
        ),
        ExplainabilityItem(
            factor="Sentiment & Emotional Distress",
            score=cog["frustration_score"],
            weight=round(w_f * 100, 1),
            contribution=f_contrib,
            detail=f"Frustration index: {cog['frustration_score']}/100 [Polarity: {cog['compound']}]"
        ),
        ExplainabilityItem(
            factor="Customer Account Tier",
            score=value_score,
            weight=round(w_v * 100, 1),
            contribution=v_contrib,
            detail=f"{customer_type.capitalize()} Customer Tier ({int(value_score)} baseline points)"
        )
    ]

    # जर ग्राहकाने विशिष्ट निकड नमूद केली असेल तर अतिरिक्त स्पष्टीकरण
    if cust_prio_clean != "Normal":
        factors.append(
            ExplainabilityItem(
                factor="Customer Stated Impact",
                score=float(max(10, min(100, int(adjusted_urgency)))),
                weight=15.0,
                contribution=round(prio_modifier * 0.4, 1),
                detail=f"Customer selected perceived priority level: '{cust_prio_clean}' (impact: {prio_modifier:+.0f}pts)"
            )
        )

    suggested_res = cog['suggested_solution']
    if historical_match:
        suggested_res = f"Proven Past Resolution (TX-{historical_match['matched_ticket_number']}): {historical_match['resolution_note']}"

    summary_text = (
        f"🧠 Cognitive AI Diagnosis: {routing_reason} "
        f"[Score: {priority_score}/100 | Urgency: {adjusted_urgency} | Frustration: {cog['frustration_score']}]. "
        f"💡 AI Suggested Solution: {suggested_res}"
    )

    return ExplainabilityBreakdown(
        frustration_score=float(cog["frustration_score"]),
        urgency_score=float(adjusted_urgency),
        customer_value_score=float(value_score),
        total_priority_score=priority_score,
        assigned_tier=assigned_tier,
        factors=factors,
        detected_keywords=cog.get("domains", []),
        sentiment_compound=float(cog["compound"]),
        summary=summary_text
    )

def analyze_sentiment_and_frustration(text: str) -> Tuple[float, float, List[str]]:
    cog = perform_cognitive_analysis(text)
    return cog["frustration_score"], cog["compound"], cog["domains"]

def analyze_urgency(text: str) -> Tuple[float, List[str]]:
    cog = perform_cognitive_analysis(text)
    return cog["urgency_score"], cog["domains"]

def calculate_priority_score(frustration_score: float, urgency_score: float, customer_value_score: float, weights = CURRENT_WEIGHTS) -> int:
    total_w = weights.frustration_weight + weights.urgency_weight + weights.customer_value_weight
    if total_w <= 0: total_w = 1.0
    score = (frustration_score * (weights.frustration_weight / total_w)) + \
            (urgency_score * (weights.urgency_weight / total_w)) + \
            (customer_value_score * (weights.customer_value_weight / total_w))
    return int(round(min(100.0, max(0.0, score))))

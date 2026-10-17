import re
from typing import Dict, Any, List, Tuple, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .config import CURRENT_WEIGHTS, PLAN_VALUE_MAP
from .models import ExplainabilityBreakdown, ExplainabilityItem

analyzer = SentimentIntensityAnalyzer()

# High frustration / hostility booster words
FRUSTRATION_KEYWORDS = {
    "terrible": 15, "awful": 15, "horrible": 15, "worst": 20, "unacceptable": 25,
    "furious": 25, "angry": 15, "disgusted": 20, "disaster": 25, "ruined": 20,
    "waste": 15, "scam": 30, "fraud": 30, "sue": 30, "lawsuit": 35,
    "cancel my subscription": 25, "cancel contract": 30, "incompetent": 20,
    "ridiculous": 15, "pathetic": 20, "broken promise": 20, "hate": 15
}

# Urgency keywords and point weights
URGENCY_KEYWORDS = {
    # Outage / Catastrophic
    "down": 30, "outage": 35, "server down": 45, "production down": 50,
    "crashed": 35, "crash": 30, "offline": 30, "data loss": 45, "corrupted": 35,
    "breach": 40, "hacked": 45, "security vulnerability": 40,
    
    # Financial / Business Impact
    "payment failed": 35, "charged twice": 30, "double charged": 35,
    "losing money": 40, "losing customers": 40, "cannot checkout": 35,
    "revenue": 25, "payroll": 35, "blocked": 25,
    
    # Temporal Urgency
    "urgent": 25, "emergency": 35, "asap": 25, "immediately": 30,
    "right now": 25, "critical": 30, "deadline": 25, "time-sensitive": 25
}

# Routine / Low urgency keywords
ROUTINE_KEYWORDS = {
    "how do i": -20, "how to": -15, "where can i": -15, "just wondering": -20,
    "general inquiry": -20, "curious": -15, "documentation": -15, "feedback": -10,
    "suggestion": -10, "feature request": -10, "thank you": -15
}

def analyze_sentiment_and_frustration(text: str) -> Tuple[float, float, List[str]]:
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    
    # Linear interpolation: compound -1 => 100, compound 1 => 0
    base_frustration = ((1.0 - compound) / 2.0) * 100.0
    
    text_lower = text.lower()
    detected_keywords = []
    keyword_boost = 0
    
    for kw, boost in FRUSTRATION_KEYWORDS.items():
        if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
            detected_keywords.append(kw)
            keyword_boost += boost
            
    # Check for excessive exclamation marks
    exclamation_count = text.count('!')
    if exclamation_count >= 3:
        keyword_boost += 12
        detected_keywords.append(f"{exclamation_count}x exclamation marks")
    elif exclamation_count >= 1:
        keyword_boost += 4
        
    # Check for ALL CAPS shouting (words with len >= 3)
    words = re.findall(r'\b[A-Z]{3,}\b', text)
    if len(words) >= 2:
        keyword_boost += 15
        detected_keywords.append(f"ALL-CAPS shouting ({', '.join(words[:3])})")
        
    total_frustration = min(100.0, max(0.0, base_frustration + (keyword_boost * 0.5)))
    return round(total_frustration, 1), round(compound, 3), detected_keywords

def analyze_urgency(text: str) -> Tuple[float, List[str]]:
    text_lower = text.lower()
    detected_urgency_kws = []
    urgency_points = 15.0  # baseline
    
    for kw, pts in URGENCY_KEYWORDS.items():
        if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
            detected_urgency_kws.append(kw)
            urgency_points += pts
            
    for kw, reduction in ROUTINE_KEYWORDS.items():
        if kw in text_lower:
            urgency_points += reduction
            
    if "!" in text:
        urgency_points += 5
    if any(re.findall(r'\b(NOW|URGENT|CRITICAL|DOWN|EMERGENCY)\b', text)):
        urgency_points += 15
        
    final_urgency = min(100.0, max(0.0, urgency_points))
    return round(final_urgency, 1), detected_urgency_kws

def calculate_priority_score(
    frustration_score: float,
    urgency_score: float,
    customer_value_score: float,
    weights = CURRENT_WEIGHTS
) -> int:
    total_w = weights.frustration_weight + weights.urgency_weight + weights.customer_value_weight
    if total_w <= 0:
        total_w = 1.0
        
    w_f = weights.frustration_weight / total_w
    w_u = weights.urgency_weight / total_w
    w_v = weights.customer_value_weight / total_w
    
    score = (frustration_score * w_f) + (urgency_score * w_u) + (customer_value_score * w_v)
    return int(round(min(100.0, max(0.0, score))))

def build_explainability_and_route(
    subject: str,
    description: str,
    customer_type: str,
    kb_match: Optional[Dict[str, Any]] = None,
    weights = CURRENT_WEIGHTS
) -> ExplainabilityBreakdown:
    full_text = f"{subject}\n{description}"
    
    frustration, compound, frust_kws = analyze_sentiment_and_frustration(full_text)
    urgency, urgency_kws = analyze_urgency(full_text)
    
    tier_clean = customer_type.lower()
    value_score = float(PLAN_VALUE_MAP.get(tier_clean, 20))
    
    priority_score = calculate_priority_score(frustration, urgency, value_score, weights)
    
    # Routing Tier Determination: Critical | Standard | Routine
    if kb_match and priority_score < weights.critical_threshold:
        assigned_tier = "Routine"
        routing_reason = f"Routine FAQ match ('{kb_match.get('title')}') with priority score ({priority_score}). Auto-resolved by Knowledge Base."
    elif priority_score >= weights.critical_threshold:
        assigned_tier = "Critical"
        routing_reason = f"High priority score ({priority_score}/100) exceeded critical threshold ({weights.critical_threshold}). Immediate Senior Agent Escalation."
    else:
        assigned_tier = "Standard"
        routing_reason = f"Score ({priority_score}/100) routed to Standard Agent queue."

    total_w = weights.frustration_weight + weights.urgency_weight + weights.customer_value_weight
    w_f = weights.frustration_weight / total_w
    w_u = weights.urgency_weight / total_w
    w_v = weights.customer_value_weight / total_w
    
    f_contrib = round(frustration * w_f, 1)
    u_contrib = round(urgency * w_u, 1)
    v_contrib = round(value_score * w_v, 1)
    
    all_kws = list(set(frust_kws + urgency_kws))
    
    factors = [
        ExplainabilityItem(
            factor="Frustration & Sentiment",
            score=frustration,
            weight=round(w_f * 100, 1),
            contribution=f_contrib,
            detail=f"Compound polarity: {compound}. Frustration index: {frustration}/100"
        ),
        ExplainabilityItem(
            factor="Issue Urgency & Intent",
            score=urgency,
            weight=round(w_u * 100, 1),
            contribution=u_contrib,
            detail=f"Urgency assessment: {urgency}/100. Detected keywords: {', '.join(urgency_kws) if urgency_kws else 'None'}"
        ),
        ExplainabilityItem(
            factor="Customer Account Tier",
            score=value_score,
            weight=round(w_v * 100, 1),
            contribution=v_contrib,
            detail=f"{customer_type.capitalize()} customer tier ({int(value_score)} baseline points)"
        )
    ]
    
    summary = (
        f"Assigned to {assigned_tier} tier with score {priority_score}/100. "
        f"[Frustration: {f_contrib}pts, Urgency: {u_contrib}pts, Value: {v_contrib}pts]. "
        f"{routing_reason}"
    )
    
    return ExplainabilityBreakdown(
        frustration_score=frustration,
        urgency_score=urgency,
        customer_value_score=value_score,
        total_priority_score=priority_score,
        assigned_tier=assigned_tier,
        factors=factors,
        detected_keywords=all_kws,
        sentiment_compound=compound,
        summary=summary
    )

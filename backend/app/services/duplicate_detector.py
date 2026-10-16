import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.models import Grievance

EARTH_RADIUS_METERS = 6371000.0

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_METERS * c

def compute_keyword_overlap(text1: str, text2: str) -> float:
    """Compute Jaccard keyword similarity to avoid heavy external dependencies."""
    stop_words = {"the", "a", "an", "is", "in", "at", "of", "on", "and", "to", "for", "with", "this", "my", "there", "has", "have", "been"}
    tokens1 = set([w.strip(".,!?:;") for w in (text1 or "").lower().split() if len(w) > 2]) - stop_words
    tokens2 = set([w.strip(".,!?:;") for w in (text2 or "").lower().split() if len(w) > 2]) - stop_words
    
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def check_for_duplicate_grievance(
    db: Session,
    latitude: float,
    longitude: float,
    category: str,
    description: str,
    max_distance_meters: float = 300.0,
    days_lookback: int = 14
) -> dict:
    """
    Check if a similar grievance has already been reported nearby recently.
    Returns details of the duplicate if found.
    """
    if latitude is None or longitude is None:
        return {"is_duplicate": False}

    cutoff_date = datetime.utcnow() - timedelta(days=days_lookback)
    
    # Query active grievances within lookback window
    candidates = (
        db.query(Grievance)
        .filter(
            Grievance.created_at >= cutoff_date,
            Grievance.status.in_(["Pending", "In Progress", "Escalated", "Pending Citizen Confirmation"])
        )
        .all()
    )

    closest_match = None
    min_dist = float("inf")

    for g in candidates:
        if not g.latitude or not g.longitude:
            continue
        try:
            g_lat = float(g.latitude)
            g_lon = float(g.longitude)
        except (ValueError, TypeError):
            continue

        distance = haversine_distance_meters(latitude, longitude, g_lat, g_lon)
        if distance <= max_distance_meters:
            same_category = (g.category or "").strip().lower() == (category or "").strip().lower()
            text_sim = compute_keyword_overlap(description or "", g.description or "")
            
            if same_category or text_sim >= 0.35:
                if distance < min_dist:
                    min_dist = distance
                    closest_match = {
                        "is_duplicate": True,
                        "duplicate_id": g.id,
                        "category": g.category,
                        "status": g.status,
                        "priority": g.priority,
                        "distance_meters": int(round(distance)),
                        "created_at": g.created_at.isoformat() if g.created_at else None,
                        "description_snippet": (g.description or "")[:120] + "..." if len(g.description or "") > 120 else g.description
                    }

    if closest_match:
        return closest_match

    return {"is_duplicate": False}

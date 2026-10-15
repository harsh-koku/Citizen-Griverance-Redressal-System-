from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func
from app.services.nlp_processor import classify_with_fallback
from app.services.gemini_service import generate_solution
from app.services.city_health_agent import generate_city_health_briefing

router = APIRouter(prefix="/ai", tags=["AI"])

class GrievanceRequest(BaseModel):
    text: str

@router.post("/classify")
def classify_grievance_route(req: GrievanceRequest):
    return classify_with_fallback(req.text)

@router.post("/solution")
def generate_solution_route(req: GrievanceRequest):
    return {"solution": generate_solution(req.text)}

from fastapi import Depends
from sqlalchemy.orm import Session
from app.db import connection, models
from app.services.escalation_manager import evaluate_and_escalate
from datetime import datetime

@router.post("/run-escalations")
def run_escalations(db: Session = Depends(connection.get_db)):
    """
    AI Manager Agent Review: Automatically scans all pending grievances.
    If delayed, the AI Agent decides whether to escalate.
    """
    import time
    
    pending_grievances = db.query(models.Grievance).filter(
        models.Grievance.status.in_(["Pending", "In Progress"])
    ).all()
    
    escalations_done = []
    skipped_by_rules = 0
    
    # SYSTEM DESIGN OPTIMIZATION: Heuristic Pre-screening
    # We define keywords that imply immediate danger
    urgent_keywords = ["danger", "blood", "accident", "wire", "fire", "leak", "urgent", "police", "hospital", "dead", "crash"]
    
    for g in pending_grievances:
        days_pending = (datetime.utcnow() - g.created_at).days
        
        # --- Rule 0: Skip if already Resolved/Closed (Defense in Depth) ---
        if g.status in ["Resolved", "Closed", "Spam/Rejected"]:
            continue
            
        # --- Rule 1: Skip if already escalated ---
        if g.priority in ["Critical", "High"] or g.status == "Escalated":
            skipped_by_rules += 1
            continue
            
        # --- Rule 2: Skip if not old enough AND has no urgent keywords ---
        has_urgent_keyword = any(kw in g.description.lower() for kw in urgent_keywords)
        if days_pending < 2 and not has_urgent_keyword:
            skipped_by_rules += 1
            continue
        
        try:
            # Only call AI (using Tokens) if it passes the heuristic gateway!
            ai_decision = evaluate_and_escalate(g.description, g.category, days_pending)
            
            if ai_decision.get("escalate"):
                g.priority = ai_decision.get("new_priority", "Critical")
                g.status = "Escalated"
                g.worker_note = f"[AI MANAGER OVERRIDE] {ai_decision.get('manager_note')}"
                escalations_done.append({"id": g.id, "new_priority": g.priority, "note": g.worker_note})
                
            time.sleep(1) # Prevent aggressive rate-limiting
            
        except Exception as e:
            if "429" in str(e) or "rate_limit" in str(e).lower():
                print("Hit Groq Rate Limit. Pausing escalations.")
                break # Gracefully exit loop, return what we processed so far
            else:
                print("Error evaluating grievance:", e)
            
    db.commit()
    return {
        "message": f"Optimization Active: Checked {len(pending_grievances)} cases. Rules Engine skipped {skipped_by_rules} to save AI tokens. AI Escalated {len(escalations_done)}.", 
        "details": escalations_done
    }

from sqlalchemy import func
from app.services.city_health_agent import generate_city_health_briefing

@router.get("/admin/daily-briefing")
def get_daily_briefing(db: Session = Depends(connection.get_db)):
    """
    AI City Health Briefing: Aggregates stats and generates a macro-level 
    tactical briefing for the Admin.
    """
    # 1. Aggregate stats
    total = db.query(models.Grievance).count()
    pending = db.query(models.Grievance).filter(models.Grievance.status.in_(["Pending", "In Progress"])).count()
    
    # Get complaints by category
    categories = db.query(models.Grievance.category, func.count(models.Grievance.id)).group_by(models.Grievance.category).all()
    category_stats = {cat: count for cat, count in categories if cat}
    
    # Get most problematic zone
    zones = db.query(models.Grievance.zone, func.count(models.Grievance.id)).group_by(models.Grievance.zone).order_by(func.count(models.Grievance.id).desc()).first()
    worst_zone = zones[0] if zones and zones[0] else "Unknown"
    
    stats = {
        "total_grievances": total,
        "unresolved_grievances": pending,
        "breakdown_by_category": category_stats,
        "most_problematic_zone": worst_zone
    }
    
    # 2. Generate AI Briefing
    briefing = generate_city_health_briefing(stats)
    
    return {
        "raw_stats": stats,
        "ai_briefing": briefing
    }


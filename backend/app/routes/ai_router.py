from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
import time

from app.db import connection, models
from app.auth.dependencies import require_admin
from app.services.nlp_processor import classify_with_fallback
from app.services.gemini_service import generate_solution
from app.services.city_health_agent import generate_city_health_briefing
from app.services.escalation_manager import evaluate_and_escalate

router = APIRouter(prefix="/ai", tags=["AI"])

class GrievanceRequest(BaseModel):
    text: str

@router.post("/classify")
def classify_grievance_route(req: GrievanceRequest):
    return classify_with_fallback(req.text)

from fastapi import UploadFile, File
from app.config import settings
from groq import Groq

groq_audio_client = Groq(api_key=settings.GROQ_API_KEY)
ALLOWED_AUDIO_EXTENSIONS = {"mp3", "wav", "m4a", "webm", "ogg", "flac"}

@router.post("/transcribe-audio")
def transcribe_audio_route(file: UploadFile = File(...)):
    """
    Multilingual Speech-to-Text: Transcribes citizen voice recordings (Hindi, Marathi, English, etc.)
    using Whisper.
    """
    raw_ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "webm"
    if raw_ext not in ALLOWED_AUDIO_EXTENSIONS:
        raw_ext = "webm"

    try:
        content = file.file.read()
        transcription = groq_audio_client.audio.transcriptions.create(
            file=(f"recording.{raw_ext}", content),
            model=settings.AUDIO_MODEL,
            response_format="verbose_json"
        )
        text = getattr(transcription, "text", str(transcription))
        lang = getattr(transcription, "language", "unknown")
        return {
            "transcription": text,
            "language": lang
        }
    except Exception as e:
        print(f"Whisper Transcription Error: {e}")
        return {"error": str(e), "transcription": ""}

@router.post("/solution")
def generate_solution_route(req: GrievanceRequest):
    return {"solution": generate_solution(req.text)}

@router.post("/run-escalations")
def run_escalations(
    batch_size: int = 25,
    db: Session = Depends(connection.get_db),
    admin=Depends(require_admin)
):
    """
    AI Manager Agent Review: Automatically scans pending grievances in bounded batches.
    Heuristically pre-filters candidates to preserve LLM quota and optimizes throughput.
    """
    pending_grievances = (
        db.query(models.Grievance)
        .filter(models.Grievance.status.in_(["Pending", "In Progress"]))
        .order_by(models.Grievance.created_at.asc())
        .limit(max(1, min(batch_size, 50)))
        .all()
    )
    
    escalations_done = []
    skipped_by_rules = 0
    
    urgent_keywords = ["danger", "blood", "accident", "wire", "fire", "leak", "urgent", "police", "hospital", "dead", "crash"]
    
    for g in pending_grievances:
        days_pending = (datetime.utcnow() - g.created_at).days if g.created_at else 0
        
        # Rule 0: Skip if already Resolved/Closed/Spam
        if g.status in ["Resolved", "Closed", "Spam/Rejected"]:
            continue
            
        # Rule 1: Skip if already escalated
        if g.priority in ["Critical", "High"] or g.status == "Escalated":
            skipped_by_rules += 1
            continue
            
        # Rule 2: Skip if not old enough AND has no urgent keywords
        has_urgent_keyword = any(kw in (g.description or "").lower() for kw in urgent_keywords)
        if days_pending < 2 and not has_urgent_keyword:
            skipped_by_rules += 1
            continue
        
        try:
            ai_decision = evaluate_and_escalate(g.description, g.category, days_pending)
            
            if ai_decision.get("escalate"):
                g.priority = ai_decision.get("new_priority", "Critical")
                g.status = "Escalated"
                g.worker_note = f"[AI MANAGER OVERRIDE] {ai_decision.get('manager_note')}"
                escalations_done.append({"id": g.id, "new_priority": g.priority, "note": g.worker_note})
                db.commit()
                
            time.sleep(0.3)  # Smooth rate limiting
            
        except Exception as e:
            if "429" in str(e) or "rate_limit" in str(e).lower():
                print("Hit Groq Rate Limit. Pausing batch escalations.")
                break
            else:
                print(f"Error evaluating grievance #{g.id}: {e}")
            
    db.commit()
    return {
        "message": f"Optimization Active: Evaluated batch of {len(pending_grievances)} cases. Rules Engine skipped {skipped_by_rules} to save AI tokens. AI Escalated {len(escalations_done)}.", 
        "details": escalations_done
    }

@router.get("/admin/daily-briefing")
def get_daily_briefing(
    db: Session = Depends(connection.get_db),
    admin=Depends(require_admin)
):
    """
    AI City Health Briefing: Aggregates stats and generates a macro-level 
    tactical briefing for the Admin.
    """
    total = db.query(models.Grievance).count()
    pending = db.query(models.Grievance).filter(models.Grievance.status.in_(["Pending", "In Progress"])).count()
    
    categories = db.query(models.Grievance.category, func.count(models.Grievance.id)).group_by(models.Grievance.category).all()
    category_stats = {cat: count for cat, count in categories if cat}
    
    zones = db.query(models.Grievance.zone, func.count(models.Grievance.id)).group_by(models.Grievance.zone).order_by(func.count(models.Grievance.id).desc()).first()
    worst_zone = zones[0] if zones and zones[0] else "Unknown"
    
    stats = {
        "total_grievances": total,
        "unresolved_grievances": pending,
        "breakdown_by_category": category_stats,
        "most_problematic_zone": worst_zone
    }
    
    briefing = generate_city_health_briefing(stats)
    
    return {
        "raw_stats": stats,
        "ai_briefing": briefing
    }

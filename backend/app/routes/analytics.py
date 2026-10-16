from fastapi import APIRouter, HTTPException, Depends
from app.auth.dependencies import require_admin
from app.services.analytics_service import generate_forecast
from app.services.retrain_service import retrain_forecast_models
from app.services.hotspot_service import detect_hotspots
from app.services.hotspot_trend_service import get_hotspot_trends

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/forecast/{category}")
def get_forecast(category: str):
    """Return forecast + smart summary for a grievance category"""
    result = generate_forecast(category)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/retrain")
def retrain_model(admin=Depends(require_admin)):
    """Force retraining using real grievance data (Admin only)"""
    success = retrain_forecast_models()
    if not success:
        return {"message": "Not enough data yet. Using trained data model."}
    return {"message": "Model retrained successfully using real data."}


@router.get("/hotspots/trends")
def get_hotspot_trend(limit: int = 5):
    """Hybrid insight: real hotspots + predicted trend"""
    return get_hotspot_trends(limit)

@router.get("/hotspots")
def get_hotspots(limit: int = 10, use_clustering: bool = True):
    """Return macro and micro hotspots."""
    return detect_hotspots(limit, use_clustering)
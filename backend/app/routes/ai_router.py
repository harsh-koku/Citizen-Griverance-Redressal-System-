from fastapi import APIRouter
from pydantic import BaseModel
from app.services.nlp_processor import classify_with_fallback
from app.services.gemini_service import generate_solution

router = APIRouter(prefix="/ai", tags=["AI"])

class GrievanceRequest(BaseModel):
    text: str

@router.post("/classify")
def classify_grievance_route(req: GrievanceRequest):
    return classify_with_fallback(req.text)

@router.post("/solution")
def generate_solution_route(req: GrievanceRequest):
    return {"solution": generate_solution(req.text)}

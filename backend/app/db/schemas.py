from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GrievanceCreate(BaseModel):
    description: str
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    ward: Optional[str] = None
    image_url: Optional[str] = None

class UserBasic(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True


class GrievanceResponse(BaseModel):
    id: int
    description: str
    category: Optional[str] = None
    priority: Optional[str] = None
    region: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    ward: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    solution: Optional[str] = None
    status: Optional[str] = "Pending"
    trust_score: Optional[int] = 100
    is_spam: Optional[bool] = False
    created_at: Optional[datetime]
    assigned_worker_id: Optional[int] = None
    worker_note: Optional[str] = None
    resolution_proof_url: Optional[str] = None
    user: Optional[UserBasic] = None

    class Config:
        from_attributes = True

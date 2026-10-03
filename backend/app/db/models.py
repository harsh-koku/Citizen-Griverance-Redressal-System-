from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .connection import Base


#User Role
class UserRole(enum.Enum):
    user = "user"
    admin = "admin"
    worker = "worker"
    
#User Table
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    worker_category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(name={self.name}, role={self.role})"
    

class Grievance(Base):
    __tablename__ = "grievances"
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    category = Column(String(100))
    priority = Column(String(50))
    region = Column(String(150))
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    zone = Column(String(100), nullable=True)
    ward = Column(String(100), nullable=True)
    latitude = Column(String(50))
    longitude = Column(String(50))
    image_url = Column(String(255), nullable=True)
    solution = Column(Text)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # User who filed the grievance
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", foreign_keys=[user_id], backref="grievances")
    
    # Worker assigned to resolve it
    assigned_worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_worker = relationship("User", foreign_keys=[assigned_worker_id])
    
    # Worker updates
    worker_note = Column(Text, nullable=True)
    resolution_proof_url = Column(String(255), nullable=True)
    
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.db.models import User, UserRole
from app.auth.schemas import UserRegister, UserLogin, TokenResponse
from app.auth.utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/ping")
def ping_test():
    print("/auth router is working fine")
    return {"message": "Auth route working fine!"}


#Register New Citizen
@router.post("/register", response_model=TokenResponse)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new citizen user"""
    print("Register request received:", data.dict())

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    #Hash password
    hashed_pw = hash_password(data.password)

    #Create new user with role = user
    new_user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=hashed_pw,
        role=UserRole.user,
    )

    #Save to DB with error handling
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User created successfully: {new_user.email}")
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    # Generate JWT token
    token = create_access_token({
        "sub": new_user.email,
        "role": new_user.role.value
    })

    return {"access_token": token, "token_type": "bearer"}


#Login User or Admin
@router.post("/login", response_model=TokenResponse)
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    """Login for both users and admin"""
    print("Login attempt for:", data.email)

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    print(f"Login successful for {user.email} (role: {user.role.value})")

    # Generate JWT token
    token = create_access_token({
        "sub": user.email,
        "role": user.role.value
    })

    return {"access_token": token, "token_type": "bearer"}

#Get all workers (for admin)
@router.get("/workers")
def get_workers(db: Session = Depends(get_db)):
    workers = db.query(User).filter(User.role == UserRole.worker).all()
    return [{"id": w.id, "name": w.name, "email": w.email, "category": w.worker_category} for w in workers]


# Profile endpoints (User, Admin, Worker)
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserProfileUpdate

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently logged in user profile (User, Admin, or Worker)"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone or "",
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "worker_category": current_user.worker_category or "",
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }

@router.put("/me")
def update_my_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update profile details (name, phone)"""
    if data.name is not None and data.name.strip():
        current_user.name = data.name.strip()
    if data.phone is not None:
        current_user.phone = data.phone.strip()
    
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone or "",
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "worker_category": current_user.worker_category or "",
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


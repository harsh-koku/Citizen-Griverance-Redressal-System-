from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.db.models import User
from app.auth.utils import SECRET_KEY, ALGORITHM

# Define how we extract token from request headers
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

#Verify and decode JWT token
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception

    return user


#Check if current user is an admin
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

#Check if current user is admin OR worker
def require_admin_or_worker(current_user: User = Depends(get_current_user)):
    if current_user.role.value not in ["admin", "worker"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Elevated access required"
        )
    return current_user

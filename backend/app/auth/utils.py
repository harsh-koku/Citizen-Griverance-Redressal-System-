from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.db.models import User


import hmac
import hashlib
from app.config import settings

# JWT Settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

#Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#Hashing Function
def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

#JWT Function
def create_access_token(data:dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def generate_feedback_token(grievance_id: int, action: str) -> str:
    """Generate a tamper-proof HMAC token for email confirmation actions."""
    message = f"grievance:{grievance_id}:action:{action.lower()}"
    return hmac.new(SECRET_KEY.encode(), message.encode(), hashlib.sha256).hexdigest()

def verify_feedback_token(grievance_id: int, action: str, token: str) -> bool:
    """Verify an HMAC token for email confirmation actions."""
    if not token:
        return False
    expected = generate_feedback_token(grievance_id, action)
    return hmac.compare_digest(expected, token)
import os
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # App
    APP_NAME: str = "AI-Powered Grievance Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./igrs.db")

    # Auth & Cryptography
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secretigrsbackendkey_default_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))

    # AI & Services
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-20b")
    VISION_MODEL: str = os.getenv("VISION_MODEL", "qwen/qwen3.8-27b")
    AUDIO_MODEL: str = os.getenv("AUDIO_MODEL", "whisper-large-v3-turbo")

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if o.strip()
    ]

    # Email
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_EXTENSIONS: set[str] = {"jpg", "jpeg", "png", "webp"}

settings = Settings()

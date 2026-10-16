import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import grievance, analytics
from app.auth.routes import router as auth_router
from app.services.forecast_manager import load_forecast_models, retrain_forecast_models_async
from app.routes import ai_router


from fastapi.staticfiles import StaticFiles
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend for IGRS — powered by NLP, Gemini AI, and analytics",
    version=settings.APP_VERSION,
)

# Ensure upload directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Routers
app.include_router(auth_router)
app.include_router(grievance.router)
app.include_router(analytics.router)
app.include_router(ai_router.router)

@app.on_event("startup")
def startup_event():
    print("Starting IGRS backend...")
    load_forecast_models()
    retrain_forecast_models_async()
    


@app.get("/")
def root():
    return{"message": "IGRS Backend is running!"}
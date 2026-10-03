from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import grievance, analytics
from app.auth.routes import router as auth_router
from app.services.forecast_manager import load_forecast_models, retrain_forecast_models_async
from app.routes import ai_router


from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="AI-Powered Grievance Management System",
    description="Backend for IGRS — powered by NLP, Gemini AI, and analytics",
    version="1.0.0",
)

# Mount the uploads folder so frontend can access images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

#Frontend calling APIs
origin = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
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
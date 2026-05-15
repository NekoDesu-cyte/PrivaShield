from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api.routes import image

app = FastAPI(title="Blurify AI API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
UPLOAD_DIR = "../uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(image.router, prefix="/api/image", tags=["image"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Blurify AI API",
        "version": "1.0.0",
        "capabilities": ["OCR", "NER", "Auto-Blur"]
    }

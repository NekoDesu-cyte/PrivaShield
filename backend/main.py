from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
<<<<<<< HEAD
import uvicorn 
=======
from app.api.routes import image
>>>>>>> origin/feat/integrate-ocr

app = FastAPI(title="Blurify AI API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# create folder 'uploads' jika belum ada
os.makedirs("uploads", exist_ok=True)

# Jadikan folder 'uploads' bisa diakses dari browser
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
=======
# Static files for uploads
UPLOAD_DIR = "../uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(image.router, prefix="/api/image", tags=["image"])
>>>>>>> origin/feat/integrate-ocr

@app.get("/health")
async def health_check():
    return {
<<<<<<< HEAD
        "status": "success",
        "image_url": f"http://127.0.0.1:8000/uploads/{file.filename}"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
=======
        "status": "healthy",
        "service": "Blurify AI API",
        "version": "1.0.0",
        "capabilities": ["OCR", "NER", "Auto-Blur"]
    }
>>>>>>> origin/feat/integrate-ocr

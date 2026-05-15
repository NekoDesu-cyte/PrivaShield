from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import os
import uvicorn 

app = FastAPI()

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create folder 'uploads' jika belum ada
os.makedirs("uploads", exist_ok=True)

# Jadikan folder 'uploads' bisa diakses dari browser
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    # 1. Tentukan lokasi simpan
    file_location = f"uploads/{file.filename}"
    
    # 2. Simpan gambar fisik ke dalam folder
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 3. Kembalikan URL gambarnya ke React
    return {
        "status": "success",
        "image_url": f"http://127.0.0.1:8000/uploads/{file.filename}"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
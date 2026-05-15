from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import easyocr
import os
import uuid
import shutil
import cv2
from app.core.ner import NERProcessor
from app.core.blur import apply_blur
from app.schemas.image import ProcessResponse, Entity
from app.schemas.finalize import FinalizeRequest

router = APIRouter()

reader = easyocr.Reader(['id', 'en'], gpu=False)
ner = NERProcessor()

UPLOAD_DIR = "../uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/process", response_model=ProcessResponse)
async def process_image(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    original_filename = f"{file_id}_orig.{ext}"
    orig_path = os.path.join(UPLOAD_DIR, original_filename)
    
    with open(orig_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        img = cv2.imread(orig_path)
        height, width = img.shape[:2]
        results = reader.readtext(orig_path)
        all_ocr_text = [text for (_, text, _) in results]
        detected_entities = []
        
        for (bbox, text, prob) in results:
            label = ner.detect_pii(text)
            if label:
                x_min = int(min([p[0] for p in bbox]))
                y_min = int(min([p[1] for p in bbox]))
                x_max = int(max([p[0] for p in bbox]))
                y_max = int(max([p[1] for p in bbox]))
                w, h = x_max - x_min, y_max - y_min
                detected_entities.append(Entity(
                    text=text, label=label, bbox=[x_min, y_min, w, h], confidence=float(prob)
                ))
        
        return ProcessResponse(
            status="success",
            image_id=file_id,
            width=width,
            height=height,
            all_ocr_text=all_ocr_text,
            detected_entities=detected_entities,
            result_url=""
        )
    except Exception as e:
        if os.path.exists(orig_path): os.remove(orig_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/finalize")
async def finalize_image(request: FinalizeRequest):
    files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(request.image_id) and "_orig" in f]
    if not files:
        raise HTTPException(status_code=404, detail="Image not found")
        
    orig_path = os.path.join(UPLOAD_DIR, files[0])
    proc_path = orig_path.replace("_orig", "_proc")
    
    # Convert BlurArea objects to list of tuples for blur function
    blur_areas = [(area.x, area.y, area.w, area.h) for area in request.blur_areas]
    apply_blur(orig_path, proc_path, blur_areas)
    
    return {"result_url": f"/uploads/{os.path.basename(proc_path)}"}

@router.get("/download/{filename}")
async def download_processed(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # We leave the deletion responsibility to the client or a separate scheduled job
    return FileResponse(path, media_type='image/png', filename=filename)

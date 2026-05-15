from pydantic import BaseModel
from typing import List, Tuple

class Entity(BaseModel):
    text: str
    label: str
    bbox: List[int] # [x, y, w, h]
    confidence: float

class ProcessResponse(BaseModel):
    status: str
    image_id: str
    width: int
    height: int
    all_ocr_text: List[str]
    detected_entities: List[Entity]
    result_url: str

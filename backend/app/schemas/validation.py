from pydantic import BaseModel
from typing import List

class ManualBlur(BaseModel):
    x: int
    y: int
    w: int
    h: int

class ValidationRequest(BaseModel):
    approved_entities: List[str]  # List of detected_entity IDs
    manual_areas: List[ManualBlur]

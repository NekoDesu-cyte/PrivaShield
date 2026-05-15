from pydantic import BaseModel
from typing import List

class BlurArea(BaseModel):
    x: int
    y: int
    w: int
    h: int

class FinalizeRequest(BaseModel):
    image_id: str
    blur_areas: List[BlurArea]

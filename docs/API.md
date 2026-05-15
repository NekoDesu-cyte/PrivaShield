# Blurify AI - API Documentation

This document serves as the single source of truth for the Blurify AI API.

## Core Rule: Documentation Sync
**Every code change must be synchronized with these docs, the `Guide Usage.md`, and the `pipeline_test.ipynb` notebook.**

---

## 1. Authentication
*Not yet implemented.*

## 2. Image Processing
### `POST /api/image/process`
- **Description**: Uploads an image, extracts text, and identifies PII segments. **Does not apply blur**.
- **Request**: `multipart/form-data` with field `file` (Required).
- **Response**: `ProcessResponse` (status, image_id, all_ocr_text, detected_entities).
- **Coordinate Format**: `[x, y, w, h]` (Standardized).

### `POST /api/image/finalize`
- **Description**: Applies blur to user-specified regions and schedules file cleanup.
- **Request**: `FinalizeRequest` (image_id, blur_areas).
- **Response**: `{"result_url": "/uploads/{filename}"}`.

## 3. Schemas
- **Entity**: `{ text: str, label: str, bbox: [int, int, int, int], confidence: float }`
- **ProcessResponse**: `{ status: str, image_id: str, width: int, height: int, all_ocr_text: [str], detected_entities: [Entity], result_url: str }`
- **FinalizeRequest**: `{ image_id: str, blur_areas: [{ x: int, y: int, w: int, h: int }, ...] }`

# Blurify AI - Technical Detail

## 1. System Architecture
The system follows a Client-Server architecture with a decoupled AI processing pipeline.

### 1.1 AI Pipeline Workflow
1. **Input**: Raw image (JPG/PNG).
2. **OCR Phase**: `EasyOCR` extracts text and bounding boxes.
3. **NER Phase**: 
    - **Hybrid Detection**:
        - **Regex**: Advanced pattern matching for Phone, NIK, Account, Username, URL, Referral Code, and Address (e.g., 'Jl.', 'Perum').
        - **Heuristic**: Capitalized word sequence detection for names.
        - **IndoBERT (`indolem/indobert-base-uncased`)**: Deep learning model for advanced entity classification.
    - **Result**: A list of `detected_entities` with labels and standardized coordinates `[x, y, w, h]`.
4. **Finalization (Client-Controlled)**:
    - User selects final blur regions on the frontend.
    - `POST /api/image/finalize` receives these regions and applies Gaussian Blur.
5. **Output**: Sanitized image URL.

## 2. API Endpoints

### 2.1 Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register a new user. |
| POST | `/api/auth/login` | Login and receive a JWT token. |

### 2.2 Image Processing
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/image/process` | Upload an image. **Field name must be `file`** (multipart/form-data). |
| POST | `/api/image/finalize` | Applies blur to user-specified regions and schedules file cleanup. |
| GET | `/api/image/{id}` | Get metadata and status of a processed image. |
| GET | `/api/image/download/{filename}` | Download the finalized, blurred image. |

### 2.3 User History
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/history` | List recently processed images for the authenticated user. |

## 3. Database Schema

### `users`
- `id`: UUID (PK)
- `email`: String (Unique)
- `password_hash`: String
- `created_at`: DateTime

### `images`
- `id`: UUID (PK)
- `user_id`: UUID (FK)
- `original_name`: String
- `storage_path`: String
- `status`: Enum (processing, awaiting_validation, done, failed)
- `created_at`: DateTime

### `detected_entities`
- `id`: UUID (PK)
- `image_id`: UUID (FK)
- `text`: String
- `label`: String (NAME, EMAIL, PHONE, etc.)
- `x, y, w, h`: Integers (Bounding Box)
- `confidence`: Float
- `is_approved`: Boolean (Default: True)

## 4. Implementation Priorities
1. **Fase 1**: Core FastAPI setup, Database models, and Image upload.
2. **Fase 2**: Integration of `EasyOCR` and basic `OpenCV` blurring.
3. **Fase 3**: IndoBERT NER and Regex patterns for PII detection.
4. **Fase 4**: Frontend interactive review UI (React).
5. **Fase 5**: Auth (JWT) and User history.

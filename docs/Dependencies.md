# Blurify AI - Dependency List

## 1. Backend Dependencies (Python)

### Core Framework
- `fastapi`: REST API framework.
- `uvicorn[standard]`: ASGI server.
- `pydantic`: Data validation and settings management.

### AI & Image Processing
- `easyocr`: Text extraction (OCR).
- `spacy`: Named Entity Recognition (NER).
- `id_core_news_lg`: spaCy Indonesian language model.
- `opencv-python-headless`: Image manipulation (blurring).
- `transformers`: Deep Learning model framework (IndoBERT).
- `torch`: Deep Learning backend.
- `sentencepiece`: Tokenizer engine for IndoBERT.
- `Pillow`: Basic image handling.

### Database & Auth
- `sqlalchemy`: SQL Toolkit and ORM.
- `asyncpg`: Async database driver for PostgreSQL.
- `alembic`: Database migrations.
- `python-jose[cryptography]`: JWT token handling.
- `passlib[bcrypt]`: Password hashing.

### Utilities & Testing
- `python-dotenv`: Environment variable management.
- `pytest`: Testing framework.
- `httpx`: Async HTTP client for testing.

---

## 2. Frontend Dependencies (Node.js/React)

### Core Framework
- `react`: UI library.
- `react-dom`: Entry point for DOM rendering.
- `react-router-dom`: Routing.

### Styling & UI
- `tailwindcss`: Utility-first CSS framework.
- `lucide-react`: Icon set.
- `postcss` & `autoprefixer`: CSS processing.

### Development Tools
- `vite`: Build tool and dev server.
- `typescript`: Static typing.
- `eslint`: Linting.
- `@vitejs/plugin-react`: React support for Vite.

---

## 3. Infrastructure & External Tools
- **PostgreSQL**: Primary database.
- **Docker**: For containerization (optional but recommended).
- **Tesseract OCR**: (Optional fallback for EasyOCR).

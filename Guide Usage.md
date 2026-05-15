# Guide Usage - Blurify AI

## 1. Quick Start
We provide convenient scripts to handle the environment setup and server execution automatically.

### Run Backend Server (macOS/Linux)
Starts the FastAPI backend at `http://localhost:8000`.
```bash
./run-backend.sh
```

### Run Backend Server (Windows)
```cmd
run-backend.bat
```

## 2. Advanced: Manual Setup
### Backend
1. Go to backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Set PYTHONPATH and run server:
   - macOS/Linux: `export PYTHONPATH=$PYTHONPATH:$(pwd) && uvicorn app.main:app --reload`
   - Windows: `set PYTHONPATH=%PYTHONPATH%;%CD% && uvicorn app.main:app --reload`

## 3. Testing with Jupyter Notebook
Open `tests/pipeline_test.ipynb` to see:
- **Hybrid PII Detection**: Visualizing how IndoBERT AI and Regex patterns work together.
- **Word-Level Precision**: See how only specific words (e.g., "Aldo") are blurred while preserving conversational context.
- **OCR Recovery**: Witness the engine catching typos like "JI." (instead of "Jl.") or "RT O4" (instead of "04").
- **High-contrast purple** bounding boxes (`(128, 0, 128)`) for frontend reference.
- **Bulk Visualization**: Side-by-side results for all test images in `tests/test_outputs/`.

## 4. Test Samples
Sample images for testing are located in `backend/test/`:
- `Test-Image-OCR.jpeg`
- `Test-Image-PII-1.PNG`
- `Test-Image-PII-2.PNG`
- `Test-Image-PII-3.PNG` (Complex Addresses)
- `Test-Image-PII-4.png` (Casual Conversation)

## 5. Frontend Integration Notes
The backend returns `bbox: [x, y, w, h]` in original pixel units. The frontend should:
1. Render a high-contrast purple overlay on the detected areas.
2. Allow users to toggle (approve/reject) each area.
3. Allow users to add manual blur boxes.
4. Scale coordinates correctly if the image is resized in the browser.
5. Send approved boxes back to `/api/image/finalize` for server-side processing.

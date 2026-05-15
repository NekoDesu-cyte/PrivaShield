# Guide Usage - PrivaShield

## 1. Quick Start with `asc workflow`
We use `asc` for automated workflows.

### Test NER Logic (IndoBERT)
This runs a script to verify that the IndoBERT model is correctly detecting Names and other PII.
```bash
asc workflow run test-ner
```

### Run Backend Server
Starts the FastAPI backend at `http://localhost:8000`.
```bash
asc workflow run run-backend
```

## 2. Manual Setup
### Backend
1. Go to backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Run server: `uvicorn app.main:app --reload`

## 3. Testing with Jupyter Notebook
Open `tests/pipeline_test.ipynb` to see:
- IndoBERT NER detection results on sample images.
- Image blurring visualization.
- **High-contrast purple** bounding boxes (`(128, 0, 128)`) for frontend reference.
- JSON response structure for the frontend.

## 4. Test Samples
Sample images for testing are located in `backend/test/`:
- `Test-Image-OCR.jpeg`
- `Test-Image-PII-1.PNG`
- `Test-Image-PII-2.PNG`

## 5. Frontend Integration Notes
The backend returns `bbox: [x, y, w, h]` in original pixel units. The frontend should:
1. Render a high-contrast purple overlay on the detected areas.
2. Allow users to toggle (approve/reject) each area.
3. Allow users to add manual blur boxes.
4. Scale coordinates correctly if the image is resized in the browser.

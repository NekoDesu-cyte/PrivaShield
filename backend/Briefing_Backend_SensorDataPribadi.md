# BRIEFING DOKUMEN
## Backend & AI Model
### Sistem Otomatisasi Sensor Data Pribadi pada Gambar Digital

| | |
|---|---|
| **Mata Kuliah** | Kapita Selekta |
| **Program Studi** | S1 Rekayasa Perangkat Lunak |
| **Kelompok** | 4 |
| **Anggota** | Viona, Destu, Haikal, Maulana |
| **Tahun Akademik** | 2025/2026 |
| **Versi Dokumen** | 1.0 — Draft Awal |

> Dokumen ini ditujukan untuk tim backend guna memulai implementasi sistem.

---

## 1. Gambaran Umum Sistem

Sistem ini adalah aplikasi web yang secara otomatis mendeteksi dan menyamarkan (blur) data pribadi pada gambar digital menggunakan teknologi AI. Pengguna mengunggah gambar, sistem memproses dan mengembalikan gambar yang sudah disensor, dengan opsi bagi pengguna untuk melakukan validasi dan penyesuaian secara interaktif.

### 1.1 Alur Kerja Utama

1. Pengguna mengunggah gambar melalui antarmuka web.
2. Backend menerima gambar dan meneruskannya ke pipeline AI.
3. OCR (EasyOCR / Tesseract) mengekstraksi semua teks beserta koordinat bounding box.
4. Model NER mengklasifikasikan teks yang merupakan data pribadi (nama, email, nomor telepon, username).
5. Sistem menerapkan blur pada koordinat yang mengandung data sensitif.
6. Gambar hasil dikembalikan ke frontend untuk ditinjau dan diunduh pengguna.

### 1.2 Komponen Utama

| Komponen | Teknologi | Tanggung Jawab |
|---|---|---|
| REST API | FastAPI (Python) | Endpoint penerimaan gambar & pengembalian hasil |
| OCR Engine | EasyOCR / Tesseract | Ekstraksi teks & bounding box dari gambar |
| NER Model | spaCy / IndoNER / fine-tuned BERT | Klasifikasi entitas data pribadi |
| Image Processor | OpenCV / Pillow | Penerapan blur pada koordinat sensitif |
| Storage | Local / MinIO / S3 | Penyimpanan gambar sementara per sesi |
| Database | PostgreSQL | Riwayat pemrosesan & manajemen akun |
| Auth | JWT (OAuth2) | Autentikasi dan otorisasi pengguna |

---

## 2. Arsitektur Backend

### 2.1 Struktur Direktori Proyek

```
backend/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── api/
│   │   └── routes/
│   │       ├── image.py     # Endpoint upload & hasil
│   │       ├── auth.py      # Register, login, token
│   │       └── history.py   # Riwayat pemrosesan
│   ├── core/
│   │   ├── ocr.py           # Wrapper OCR engine
│   │   ├── ner.py           # Wrapper NER model
│   │   ├── blur.py          # Logika penerapan blur
│   │   └── pipeline.py      # Orchestrator pipeline
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   └── utils/
├── tests/
├── requirements.txt
└── Dockerfile
```

### 2.2 Endpoint API

| Method | Endpoint | Deskripsi | Auth? |
|---|---|---|---|
| POST | `/auth/register` | Daftar akun baru | — |
| POST | `/auth/login` | Login & dapatkan JWT token | — |
| POST | `/api/image/process` | Upload gambar → deteksi PII otomatis | ✓ |
| POST | `/api/image/finalize` | Terapkan blur pada area pilihan & simpan hasil | ✓ |
| GET | `/api/image/download/{filename}` | Unduh gambar hasil akhir | ✓ |

### 2.3 Cara Konsumsi API & Skema Data

**1. `POST /api/image/process`**
Endpoint ini digunakan untuk mengunggah gambar dan mendapatkan metadata PII yang terdeteksi.
- **Content-Type:** `multipart/form-data`
- **Body:** 
  - `file`: (Binary image file, max 5MB)

**Sample Response:**
```json
{
  "status": "success",
  "image_id": "51cab37f-1432-495c-b291-1ddb36d22309",
  "width": 1280,
  "height": 720,
  "all_ocr_text": ["Nama:", "Budi", "Santoso"],
  "detected_entities": [
    {
      "text": "Budi Santoso",
      "label": "NAME",
      "bbox": [100, 200, 150, 40],
      "confidence": 0.98
    }
  ],
  "result_url": ""
}
```

**2. `POST /api/image/finalize`**
Endpoint ini digunakan setelah pengguna memvalidasi area mana saja yang ingin di-blur.
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "image_id": "51cab37f-1432-495c-b291-1ddb36d22309",
  "blur_areas": [
    { "x": 100, "y": 200, "w": 150, "h": 40 }
  ]
}
```

**Sample Response:**
```json
{
  "result_url": "/api/image/download/51cab37f-1432-495c-b291-1ddb36d22309_proc.png"
}
```

**3. `GET /api/image/download/{filename}`**
Mengunduh file hasil pemrosesan.
- **Param:** `filename` (didapat dari `result_url`)
- **Response:** File Binary (Image)

---

## 3. Pipeline AI & Model

### 3.1 Tahap 1 — OCR: Ekstraksi Teks

OCR bertugas membaca teks dari gambar dan mengembalikan teks beserta koordinat posisinya (bounding box) untuk setiap token yang ditemukan.

| Pilihan Library | Kelebihan | Kekurangan | Rekomendasi |
|---|---|---|---|
| EasyOCR | Mendukung 80+ bahasa termasuk Indonesia, mudah diinstal, akurasi tinggi | Lebih lambat, ukuran model besar | ✅ Utama |
| Tesseract + pytesseract | Ringan, open source, stabil | Akurasi lebih rendah untuk font tidak standar | Cadangan |
| PaddleOCR | Sangat akurat, mendukung rotasi | Setup lebih kompleks | Opsional |

Output OCR yang dibutuhkan:
- Teks per token / per baris
- Koordinat bounding box `(x, y, width, height)` dalam satuan piksel
- Skor confidence per token (threshold minimum: `0.5`)

### 3.2 Tahap 2 — NER: Identifikasi Data Sensitif

NER mengklasifikasikan teks hasil OCR menjadi entitas berlabel. Target label yang harus dideteksi:

| Label | Contoh Data | Strategi Deteksi |
|---|---|---|
| `PHONE` | 081234567890, +62-21-123 | Regex + NER |
| `EMAIL` | user@example.com | Regex (utama) |
| `NAME` | Budi Santoso, Dr. Ani | IndoBERT NER |
| `USERNAME` | @username, user_123 | Regex + konteks |
| `NIK` | 3271234567890001 | Regex (16 digit) |
| `ADDRESS` | Jl. Merdeka No. 10, Jakarta | IndoBERT NER |
| `URL` | https://... | Regex |
| `REFERRAL`| code: MARCO2025 | Regex |

**Pilihan Model NER:**

- **IndoBERT NER (Implementasi Saat Ini):** Menggunakan `cahya/bert-base-indonesian-ner`. Akurasi tinggi untuk deteksi Nama (PER) dan Lokasi (LOC) dalam konteks Bahasa Indonesia.
- **Regex Hybrid (Wajib):** Email, nomor telepon, NIK, URL, dan Referral code menggunakan regex karena lebih reliabel daripada model bahasa untuk pola teks terstruktur.

---

### 3.3 Tahap 3 — Penerapan Blur

Setelah koordinat sensitif diketahui, blur diterapkan menggunakan OpenCV.

**Penting:** Koordinat bounding box menggunakan format standar `[x, y, w, h]` (top-left x, top-left y, width, height).

```python
import cv2

def apply_blur(image_path, bboxes, blur_strength=51):
    img = cv2.imread(image_path)
    for (x, y, w, h) in bboxes:
        roi = img[y:y+h, x:x+w]
        blurred = cv2.GaussianBlur(roi, (blur_strength, blur_strength), 0)
        img[y:y+h, x:x+w] = blurred
    return img
```

Parameter yang dikonfigurasi:
- `blur_strength`: Default `51` (High contrast blur).
- Padding tambahan ±5px di sekeliling bounding box (opsional).
- Validasi koordinat agar tidak melebihi dimensi gambar.

---

### 3.4 Panduan Implementasi Frontend (Bbox & Interaktivitas)

Untuk fitur validasi dan penyesuaian interaktif, frontend harus merender bounding box di atas gambar asli.

**1. Koordinat Bbox:**
Data `bbox: [x, y, w, h]` dikembalikan dalam satuan **piksel asli gambar**.
- `x, y`: Koordinat titik kiri atas (top-left).
- `w, h`: Lebar (width) dan tinggi (height) area.

**2. Visualisasi:**
Disarankan menggunakan warna **High Contrast Purple** (`#800080` atau RGB `128, 0, 128`) untuk overlay kotak agar mudah terlihat oleh pengguna.

**3. Sinkronisasi Skala (Scaling):**
Karena gambar di browser biasanya di-resize (misal: `max-width: 100%`), frontend harus menghitung rasio skala agar posisi kotak tepat:
```javascript
// Contoh logika scaling di React/JS
const scaleX = displayedWidth / originalWidth;
const scaleY = displayedHeight / originalHeight;

const renderedBox = {
  left: bbox[0] * scaleX,
  top: bbox[1] * scaleY,
  width: bbox[2] * scaleX,
  height: bbox[3] * scaleY
};
```

**4. Interaktivitas:**
- **Toggle:** Frontend menyimpan list `entity_id` yang di-uncheck oleh pengguna untuk dikirim ke endpoint `/image/{id}/validate`.
- **Manual Blur:** Jika pengguna menggambar kotak baru, ambil koordinatnya, konversi kembali ke skala original (bagi dengan `scaleX/Y`), dan kirim sebagai `manual_areas`.

---

## 4. Skema Database

### 4.1 Tabel Utama

| Tabel | Kolom Utama | Keterangan |
|---|---|---|
| `users` | id, email, password_hash, role, created_at | Akun pengguna dan admin |
| `images` | id, user_id, filename, storage_path, status, created_at | Metadata gambar yang diunggah |
| `detected_entities` | id, image_id, text, label, bbox_x/y/w/h, confidence, is_approved | Hasil deteksi per entitas |
| `manual_blurs` | id, image_id, bbox_x/y/w/h, created_at | Area blur yang ditambahkan manual |
| `processing_logs` | id, image_id, stage, duration_ms, error_msg, created_at | Log pipeline untuk debugging |

### 4.2 Status Pemrosesan Gambar

| Status | Keterangan |
|---|---|
| `uploaded` | Gambar berhasil diunggah, belum diproses |
| `processing` | Pipeline OCR + NER sedang berjalan |
| `awaiting_validation` | Hasil deteksi siap, menunggu konfirmasi pengguna |
| `finalizing` | Blur sedang diterapkan sesuai validasi |
| `done` | Gambar hasil siap diunduh |
| `failed` | Pipeline gagal — lihat `processing_logs` |

---

## 5. Tech Stack & Dependencies

| Kategori | Paket / Tool | Versi Min. | Fungsi |
|---|---|---|---|
| Framework | `fastapi` | 0.110+ | REST API server |
| Server | `uvicorn[standard]` | 0.29+ | ASGI server |
| OCR | `easyocr` | 1.7+ | Ekstraksi teks dari gambar |
| NER | `spacy` + `id_core_news_lg` | 3.7+ | Named entity recognition |
| NER Alt. | `transformers` + `torch` | 4.40+ | BERT-based NER (opsional) |
| Image | `opencv-python-headless` | 4.9+ | Pemrosesan & penerapan blur |
| Image | `Pillow` | 10.3+ | Validasi format & konversi gambar |
| Database | `sqlalchemy` + `asyncpg` | 2.0+ | ORM async PostgreSQL |
| Migration | `alembic` | 1.13+ | Manajemen migrasi skema DB |
| Auth | `python-jose` + `passlib` | latest | JWT & hashing password |
| Validasi | `pydantic` | 2.0+ | Schema validasi request/response |
| Testing | `pytest` + `httpx` | latest | Unit & integration testing |

### 5.1 Instalasi Cepat

```bash
# 1. Buat virtual environment
python -m venv venv && source venv/bin/activate

# 2. Install dependencies
pip install fastapi uvicorn easyocr spacy opencv-python-headless \
            Pillow sqlalchemy asyncpg alembic python-jose passlib pydantic

# 3. Download model spaCy Indonesia
python -m spacy download id_core_news_lg

# 4. Jalankan server (development)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 6. Prioritas & Urutan Pengerjaan

Kerjakan secara berurutan. Setiap fase menghasilkan sesuatu yang bisa langsung diuji.

| Fase | Target | Deliverable | Estimasi |
|---|---|---|---|
| Fase 1 | Setup & Fondasi | Project structure, FastAPI boilerplate, DB connection, auth JWT berjalan | 2–3 hari |
| Fase 2 | Pipeline OCR | Endpoint `/image/process` menerima gambar, OCR berjalan, return bounding box | 2–3 hari |
| Fase 3 | Pipeline NER + Blur | NER mengklasifikasi entitas, blur diterapkan, gambar hasil bisa diunduh | 3–4 hari |
| Fase 4 | Validasi Interaktif | Endpoint validate & manual-blur berfungsi, status gambar diperbarui | 2–3 hari |
| Fase 5 | Riwayat & Polish | Endpoint history, logging pipeline, error handling, unit tests dasar | 2 hari |

### 6.1 Yang Harus Selesai di Fase 1 (Prioritas Tinggi)

- `main.py` dengan FastAPI dan health check endpoint `GET /`
- Koneksi database PostgreSQL via SQLAlchemy (async)
- Model tabel: `users`, `images`, `detected_entities`
- Endpoint auth: `POST /auth/register` dan `POST /auth/login` dengan JWT
- Middleware CORS untuk koneksi ke frontend
- File `.env` untuk konfigurasi (`DB_URL`, `SECRET_KEY`, dsb.)

### 6.2 Keputusan Teknis yang Perlu Disepakati Tim

- Model NER: spaCy (lebih cepat) atau IndoBERT (lebih akurat)?
- Storage gambar: local filesystem dulu atau langsung ke MinIO/S3?
- Apakah pipeline dijalankan synchronous atau dengan task queue (Celery/ARQ)?
- Format koordinat bounding box: `[x, y, w, h]` atau `[x1, y1, x2, y2]`?

---

## 7. Catatan Penting & Hal yang Perlu Dihindari

| ❌ Jangan | ✅ Lakukan Ini |
|---|---|
| Simpan gambar secara permanen di server | Hapus file gambar otomatis setelah sesi berakhir (TTL) |
| Kembalikan path file asli di response API | Gunakan ID sesi/UUID, bukan nama file asli |
| Jalankan OCR + NER secara blocking di thread utama | Gunakan background task (FastAPI `BackgroundTasks` atau Celery) |
| Asumsikan semua gambar dalam posisi tegak | Handle rotasi gambar sebelum OCR (EXIF orientation) |
| Hardcode threshold confidence | Buat konfigurasi yang bisa diatur via env variable |
| Skip validasi ukuran file di backend | Validasi maks. 5 MB dan tipe file di backend, bukan hanya frontend |

---

> Pertanyaan teknis? Diskusikan di grup sebelum implementasi.

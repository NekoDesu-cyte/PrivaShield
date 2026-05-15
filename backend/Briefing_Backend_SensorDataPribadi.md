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
| POST | `/image/process` | Upload gambar → proses otomatis | ✓ |
| GET | `/image/{id}/result` | Ambil gambar hasil (URL) | ✓ |
| POST | `/image/{id}/manual-blur` | Tambah area blur manual dari frontend | ✓ |
| POST | `/image/{id}/validate` | Simpan validasi pengguna (hapus/tambah area) | ✓ |
| GET | `/image/{id}/download` | Unduh gambar hasil akhir | ✓ |
| GET | `/history` | Daftar riwayat gambar yang diproses | ✓ |
| DELETE | `/history/{id}` | Hapus item riwayat | ✓ |

### 2.3 Skema Request & Response

**`POST /image/process`** — Request `multipart/form-data`:
- `file`: gambar PNG / JPG / JPEG, maks. 5 MB

Response:
```json
{
  "image_id": "uuid-xxx",
  "status": "processed",
  "detected_entities": [
    {
      "text": "081234567890",
      "label": "PHONE",
      "bbox": [x, y, w, h],
      "confidence": 0.97
    }
  ],
  "result_url": "/image/uuid-xxx/result"
}
```

**`POST /image/{id}/validate`** — Request `application/json`:
```json
{
  "approved": ["entity_id_1", "entity_id_2"],
  "rejected": ["entity_id_3"],
  "manual_areas": [{ "x": 100, "y": 50, "w": 200, "h": 40 }]
}
```

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
| `NAME` | Budi Santoso, Dr. Ani | Model NER (spaCy/BERT) |
| `USERNAME` | @username, user_123 | Regex + konteks |
| `NIK` | 3271234567890001 | Regex (16 digit) |
| `ADDRESS` | Jl. Merdeka No. 10, Jakarta | Model NER |

**Pilihan Model NER:**

- **Opsi A — spaCy + model Indonesia (IndoNLP):** Ringan, cepat, cocok untuk production awal. Perlu fine-tuning dengan data berlabel untuk akurasi optimal.
- **Opsi B — `indobenchmark/indobert-base-p2` (HuggingFace):** Akurasi tinggi untuk teks Bahasa Indonesia. Lebih berat, butuh GPU atau inference server terpisah.
- **Opsi C — Regex Hybrid (wajib dikombinasikan):** Email, nomor telepon, NIK → regex lebih reliabel daripada model. Gabungkan output model + regex untuk coverage maksimal.

### 3.3 Tahap 3 — Penerapan Blur

Setelah koordinat sensitif diketahui, blur diterapkan menggunakan OpenCV:

```python
import cv2

def apply_blur(image_path, bboxes, blur_strength=31):
    img = cv2.imread(image_path)
    for (x, y, w, h) in bboxes:
        roi = img[y:y+h, x:x+w]
        blurred = cv2.GaussianBlur(roi, (blur_strength, blur_strength), 0)
        img[y:y+h, x:x+w] = blurred
    return img
```

Parameter yang perlu dikonfigurasi:
- `blur_strength`: 21 (ringan) → 51 (sangat kuat), default `31`
- Padding tambahan ±5px di sekeliling bounding box untuk mencegah data terpotong
- Validasi koordinat agar tidak melebihi dimensi gambar

### 3.4 Panduan Implementasi Frontend (Bbox & Interaktivitas)

Untuk fitur validasi dan penyesuaian interaktif, frontend harus merender bounding box di atas gambar asli.

**1. Koordinat Bbox:**
Data `bbox: [x, y, w, h]` dikembalikan dalam satuan **piksel asli gambar**.
- `x, y`: Koordinat titik kiri atas (top-left).
- `w, h`: Lebar (width) dan tinggi (height) area.

**2. Sinkronisasi Skala (Scaling):**
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

**3. Interaktivitas:**
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

# Quick Start - TVU PDF Extractor

## Khởi động hệ thống

### 1. Backend Node.js (Port 3000)

```bash
cd backend-node
npm install
npm run dev
```

### 2. Backend Python (Port 8001) - MỚI

```bash
cd backend-python

# Windows
start_server.bat

# Linux/Mac
chmod +x start_server.sh
./start_server.sh
```

Hoặc thủ công:

```bash
cd backend-python
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

### 3. Frontend (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

## Kiểm tra

Sau khi khởi động, kiểm tra:

- ✅ Node.js API: http://localhost:3000/api/health
- ✅ Python API: http://localhost:8001/health
- ✅ Frontend: http://localhost:5173

## Sử dụng TVU PDF Extractor

1. Truy cập: http://localhost:5173
2. Đăng nhập
3. Menu: **CÔNG CỤ** → **Trích xuất PDF TVU**
4. Upload file PDF bảng điểm
5. Click "Trích xuất dữ liệu"

## Cài đặt thêm cho OCR (Tùy chọn)

### Windows:

1. **Tesseract OCR**
   - Download: https://github.com/UB-Mannheim/tesseract/wiki
   - Cài đặt và thêm vào PATH

2. **Poppler** (cho pdf2image)
   - Download: https://github.com/oschwartz10612/poppler-windows/releases
   - Giải nén và thêm bin/ vào PATH

### Linux:

```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-vie poppler-utils
```

### macOS:

```bash
brew install tesseract tesseract-lang poppler
```

## Cấu trúc Port

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Node.js API | 3000 | http://localhost:3000 |
| Python API | 8001 | http://localhost:8001 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## Troubleshooting

### Python API không kết nối được

**Lỗi:** `ERR_CONNECTION_REFUSED` khi trích xuất PDF

**Giải pháp:**
1. Kiểm tra Python API đang chạy: http://localhost:8001/health
2. Nếu chưa chạy, khởi động: `cd backend-python && python -m uvicorn app.main:app --reload --port 8001`
3. Kiểm tra file `.env` trong frontend có `VITE_PYTHON_API_URL=http://localhost:8001`

### Thiếu thư viện Python

**Lỗi:** `ModuleNotFoundError: No module named 'xxx'`

**Giải pháp:**
```bash
cd backend-python
pip install -r requirements.txt
```

### OCR không hoạt động

**Lỗi:** `TesseractNotFoundError`

**Giải pháp:**
- Cài đặt Tesseract OCR (xem phần "Cài đặt thêm cho OCR")
- Windows: Chỉ định đường dẫn trong code nếu cần

### Port đã được sử dụng

**Lỗi:** `Address already in use`

**Giải pháp:**

Windows:
```bash
# Tìm process đang dùng port
netstat -ano | findstr :8001
# Kill process
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
# Tìm và kill process
lsof -ti:8001 | xargs kill -9
```

## Development

### Cấu trúc thư mục

```
.
├── backend-node/          # Node.js API (port 3000)
├── backend-python/        # Python API (port 8001)
│   ├── app/
│   │   ├── routes/
│   │   │   └── tvu_extract.py    # TVU API endpoints
│   │   └── utils/
│   │       └── tvu_pdf_extractor.py  # Core extractor
│   ├── start_server.bat   # Windows startup script
│   └── start_server.sh    # Linux/Mac startup script
└── frontend/              # React frontend (port 5173)
    └── src/
        └── pages/
            └── TVUExtract.tsx     # TVU Extract page
```

### API Endpoints

**Python API (http://localhost:8001):**

- `POST /api/tvu/extract` - Trích xuất đơn file
- `POST /api/tvu/extract-batch` - Trích xuất nhiều file
- `GET /api/tvu/health` - Health check

**Node.js API (http://localhost:3000):**

- Các endpoint khác của hệ thống

## Tài liệu chi tiết

- Frontend: `frontend/TVU_EXTRACT_GUIDE.md`
- Backend: `backend-python/TVU_EXTRACTOR_README.md`

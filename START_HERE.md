# 🚀 START HERE - TVU PDF Extractor

## ✅ Python API đã khởi động thành công!

Server đang chạy tại: **http://localhost:8001**

### Kiểm tra nhanh:

```bash
# Health check
curl http://localhost:8001/health

# TVU capabilities
curl http://localhost:8001/api/tvu/health
```

Response:
```json
{
  "status": "healthy",
  "capabilities": {
    "pdfplumber": true,
    "camelot": true,
    "ocr": true
  }
}
```

## 📋 Sử dụng ngay

### 1. Truy cập Frontend

Mở trình duyệt: **http://localhost:5173**

### 2. Đăng nhập

Sử dụng tài khoản admin của bạn

### 3. Vào trang Trích xuất PDF

Menu bên trái: **CÔNG CỤ** → **Trích xuất PDF TVU**

### 4. Upload và Trích xuất

1. Kéo thả hoặc chọn file PDF bảng điểm
2. Chọn tùy chọn (OCR, định dạng output)
3. Click "Trích xuất dữ liệu"
4. Xem kết quả hoặc tải file Excel

## 🎯 Test nhanh với API

### Trích xuất file PDF (JSON):

```bash
curl -X POST "http://localhost:8001/api/tvu/extract?output_format=json" \
  -F "file=@bangdiem.pdf"
```

### Trích xuất file PDF (Excel):

```bash
curl -X POST "http://localhost:8001/api/tvu/extract?output_format=excel" \
  -F "file=@bangdiem.pdf" \
  --output result.xlsx
```

### Trích xuất nhiều file:

```bash
curl -X POST "http://localhost:8001/api/tvu/extract-batch" \
  -F "files=@bangdiem1.pdf" \
  -F "files=@bangdiem2.pdf"
```

## 📊 Dữ liệu được trích xuất

- ✅ MSSV (Mã số sinh viên)
- ✅ Họ và tên
- ✅ Ngày sinh
- ✅ Nơi sinh
- ✅ Điểm các lần thi
- ✅ Điểm môn học
- ✅ Xếp loại
- ✅ Kết quả (Đạt/Hỏng)

## 🔧 Quản lý Server

### Xem log server:

Terminal đang chạy Python server hoặc:

```bash
cd backend-python
# Logs sẽ hiển thị trong terminal
```

### Dừng server:

Nhấn `Ctrl+C` trong terminal đang chạy server

### Khởi động lại:

```bash
cd backend-python

# Windows
start_server.bat

# Linux/Mac
./start_server.sh

# Hoặc thủ công
python -m uvicorn app.main:app --reload --port 8001
```

## 📚 Tài liệu chi tiết

- **Frontend Guide**: `frontend/TVU_EXTRACT_GUIDE.md`
- **Backend API**: `backend-python/TVU_EXTRACTOR_README.md`
- **Quick Start**: `QUICK_START.md`

## ⚠️ Lưu ý

### Capabilities hiện tại:

- ✅ **pdfplumber**: Trích xuất PDF có cấu trúc
- ✅ **camelot**: Backup method cho PDF phức tạp
- ✅ **ocr**: OCR với Tesseract (cần cài đặt thêm)

### Để sử dụng OCR tốt hơn:

**Windows:**
1. Cài Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
2. Cài Poppler: https://github.com/oschwartz10612/poppler-windows/releases

**Linux:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-vie poppler-utils
```

## 🐛 Troubleshooting

### Frontend không kết nối được Python API

**Kiểm tra:**
1. Python server đang chạy: http://localhost:8001/health
2. File `.env` trong frontend có: `VITE_PYTHON_API_URL=http://localhost:8001`
3. Restart frontend nếu vừa thay đổi .env

### Lỗi "ModuleNotFoundError"

```bash
cd backend-python
pip install -r requirements.txt
```

### Port 8001 đã được sử dụng

```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8001 | xargs kill -9
```

## 🎉 Bắt đầu ngay!

1. ✅ Python API đã chạy (port 8001)
2. ✅ Truy cập frontend: http://localhost:5173
3. ✅ Vào menu: CÔNG CỤ → Trích xuất PDF TVU
4. ✅ Upload file PDF và trích xuất!

---

**Chúc bạn sử dụng hiệu quả! 🚀**

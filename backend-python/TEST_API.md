# Test TVU API

## Test với curl (không cần file PDF thật)

### 1. Health Check

```bash
curl http://localhost:8001/api/tvu/health
```

Expected response:
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

### 2. Test với file PDF mẫu

Nếu bạn có file PDF bảng điểm:

```bash
# JSON output
curl -X POST "http://localhost:8001/api/tvu/extract?output_format=json" \
  -F "file=@bangdiem.pdf"

# Excel output
curl -X POST "http://localhost:8001/api/tvu/extract?output_format=excel" \
  -F "file=@bangdiem.pdf" \
  --output result.xlsx
```

### 3. Test từ Frontend

1. Mở: http://localhost:5173
2. Đăng nhập
3. Menu: CÔNG CỤ → Trích xuất PDF TVU
4. Upload file PDF
5. Click "Trích xuất dữ liệu"

## Troubleshooting

### CORS Error

Nếu gặp lỗi CORS, kiểm tra:
- Python server đang chạy: http://localhost:8001/health
- CORS đã được cấu hình trong `backend-python/app/main.py`
- Frontend URL (http://localhost:5173) có trong `allowed_origins`

### 500 Internal Server Error

Kiểm tra log server:
```bash
# Xem terminal đang chạy Python server
# Hoặc check process output
```

### NaN/JSON Error

Đã fix: DataFrame được fillna("") trước khi convert sang JSON

## Expected Response Format

### Success (JSON):

```json
{
  "success": true,
  "data": [
    {
      "MSSV": "118022015",
      "STT": "1",
      "Họ và tên SV": "Nguyễn Văn A",
      "Ngày sinh": "15/07/2000",
      "Nơi sinh": "Trà Vinh",
      "Lần 1": "7.5",
      "Lần 2": "8.0",
      "Điểm môn học": "8.0",
      "Xếp loại": "Khá",
      "Kết quả": "Đạt"
    }
  ],
  "summary": {
    "total_students": 45,
    "total_tables": 2,
    "method": "pdfplumber",
    "page_count": 3,
    "table_types": {
      "bm2": 1,
      "tong_hop": 1
    }
  }
}
```

### Error:

```json
{
  "success": false,
  "error": "No tables extracted",
  "method": "pdfplumber"
}
```

## Frontend Integration

Frontend sẽ:
1. Upload file qua FormData
2. Gọi API: `POST /api/tvu/extract`
3. Nhận response JSON hoặc Excel file
4. Hiển thị kết quả hoặc tải file

## Notes

- File PDF được xử lý tạm thời và xóa ngay sau khi hoàn thành
- Không lưu trữ dữ liệu trên server
- Hỗ trợ batch upload (nhiều file)

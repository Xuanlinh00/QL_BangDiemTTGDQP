# TVU PDF Extractor - Trích xuất bảng điểm PDF Trường ĐH Trà Vinh

Module chuyên biệt để trích xuất bảng điểm từ PDF của Trường Đại học Trà Vinh.

## Tính năng

- ✅ Tự động phát hiện cấu trúc bảng điểm
- ✅ Hỗ trợ 3 phương pháp trích xuất:
  - **pdfplumber**: Nhanh, chính xác cho PDF có cấu trúc tốt
  - **camelot**: Backup cho PDF phức tạp
  - **OCR (Tesseract)**: Cho PDF scan hoặc ảnh
- ✅ Xử lý nhiều loại bảng:
  - Bảng tổng hợp (nhiều học phần)
  - Bảng môn học (lần 1, 2, 3)
  - Bảng điểm quá trình
- ✅ Tự động làm sạch và chuẩn hóa dữ liệu
- ✅ Xuất ra JSON hoặc Excel
- ✅ API REST endpoint

## Cài đặt

### 1. Cài đặt Python dependencies

```bash
cd backend-python
pip install -r requirements.txt
```

### 2. Cài đặt Tesseract OCR (tùy chọn, cho OCR)

**Windows:**
- Download từ: https://github.com/UB-Mannheim/tesseract/wiki
- Cài đặt và thêm vào PATH

**Linux:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-vie
```

**macOS:**
```bash
brew install tesseract tesseract-lang
```

### 3. Cài đặt Poppler (cho pdf2image)

**Windows:**
- Download từ: https://github.com/oschwartz10612/poppler-windows/releases
- Giải nén và thêm bin/ vào PATH

**Linux:**
```bash
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

## Sử dụng

### 1. Sử dụng trực tiếp (Python)

```python
from app.utils.tvu_pdf_extractor import TVUPDFExtractor

# Trích xuất ra JSON
result = TVUPDFExtractor.extract_to_dict("bangdiem.pdf")
if result["success"]:
    print(f"Tổng số SV: {result['summary']['total_students']}")
    for record in result["data"]:
        print(f"MSSV: {record['MSSV']}, Tên: {record['Họ và tên SV']}")

# Trích xuất ra Excel
result = TVUPDFExtractor.extract_to_excel("bangdiem.pdf", "output.xlsx")
if result["success"]:
    print(f"Đã lưu: {result['output_file']}")

# Bắt buộc dùng OCR
result = TVUPDFExtractor.extract_to_dict("bangdiem.pdf", force_ocr=True)
```

### 2. Sử dụng script test

```bash
# Trích xuất bình thường
python test_tvu_extractor.py bangdiem.pdf

# Bắt buộc dùng OCR
python test_tvu_extractor.py bangdiem.pdf --ocr
```

### 3. Sử dụng API

Khởi động server:

```bash
cd backend-python
uvicorn app.main:app --reload --port 8001
```

#### API Endpoints:

**1. Trích xuất đơn file (JSON)**

```bash
curl -X POST "http://localhost:8001/api/tvu/extract" \
  -F "file=@bangdiem.pdf" \
  -F "output_format=json"
```

**2. Trích xuất đơn file (Excel)**

```bash
curl -X POST "http://localhost:8001/api/tvu/extract?output_format=excel" \
  -F "file=@bangdiem.pdf" \
  --output result.xlsx
```

**3. Trích xuất nhiều file**

```bash
curl -X POST "http://localhost:8001/api/tvu/extract-batch" \
  -F "files=@bangdiem1.pdf" \
  -F "files=@bangdiem2.pdf" \
  -F "files=@bangdiem3.pdf"
```

**4. Kiểm tra health**

```bash
curl "http://localhost:8001/api/tvu/health"
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

## Cấu trúc dữ liệu đầu ra

### JSON Response

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

### Excel Output

File Excel có nhiều sheet:
- **Tóm tắt**: Thông tin tổng quan
- **T1_bm2**, **T2_tong_**: Từng bảng theo trang
- **Tổng hợp tất cả**: Tất cả sinh viên (đã loại trùng)

## Xử lý lỗi thường gặp

### 1. Không trích xuất được dữ liệu

```python
# Thử force OCR
result = TVUPDFExtractor.extract_to_dict("file.pdf", force_ocr=True)
```

### 2. Thiếu thư viện

```bash
# Cài đầy đủ dependencies
pip install pdfplumber camelot-py[cv] pytesseract pdf2image openpyxl pandas numpy
```

### 3. Tesseract không tìm thấy

```python
# Windows: Chỉ định đường dẫn
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## Tùy chỉnh

### Thêm loại bảng mới

Chỉnh sửa `detect_columns()` trong `tvu_pdf_extractor.py`:

```python
# Thêm pattern mới
if "keyword_mới" in header_txt:
    S["ttype"] = "loai_moi"
```

### Thêm cột mới

Chỉnh sửa `build_df()`:

```python
# Thêm logic trích xuất cột mới
rec["Cột mới"] = extract_new_column(raw, S)
```

## Performance

- **pdfplumber**: ~1-2 giây/trang
- **camelot**: ~2-3 giây/trang
- **OCR**: ~5-10 giây/trang (phụ thuộc DPI)

## Giới hạn

- Chỉ hỗ trợ định dạng bảng điểm của Trường ĐH Trà Vinh
- OCR yêu cầu PDF chất lượng tốt (≥300 DPI)
- MSSV phải bắt đầu bằng "1" và có 9-10 chữ số

## Troubleshooting

### Lỗi: "No tables extracted"

- Kiểm tra PDF có bảng không
- Thử `force_ocr=True`
- Kiểm tra chất lượng PDF

### Lỗi: "No valid data after processing"

- Bảng không đúng định dạng TVU
- Không tìm thấy MSSV hợp lệ
- Kiểm tra cấu trúc bảng

### OCR kém chất lượng

- Tăng DPI: `convert_from_path(pdf, dpi=400)`
- Cải thiện tiền xử lý ảnh
- Sử dụng PDF gốc thay vì scan

## License

MIT License

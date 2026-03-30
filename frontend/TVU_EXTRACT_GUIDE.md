# Hướng dẫn sử dụng Trích xuất PDF TVU

## Tổng quan

Tính năng "Trích xuất PDF TVU" cho phép tự động trích xuất dữ liệu sinh viên từ bảng điểm PDF của Trường Đại học Trà Vinh.

## Truy cập

1. Đăng nhập vào hệ thống
2. Vào menu bên trái, chọn **CÔNG CỤ** → **Trích xuất PDF TVU**

## Cách sử dụng

### Bước 1: Tải lên file PDF

Có 2 cách tải file:

**Cách 1: Kéo thả**
- Kéo file PDF từ máy tính vào vùng upload (có viền đứt nét)
- Có thể kéo nhiều file cùng lúc

**Cách 2: Chọn file**
- Click vào "Chọn file"
- Chọn 1 hoặc nhiều file PDF từ máy tính

### Bước 2: Cấu hình tùy chọn

**Bắt buộc dùng OCR**
- ☑️ Bật: Sử dụng OCR (chậm hơn nhưng chính xác hơn cho PDF scan/ảnh)
- ☐ Tắt: Sử dụng phương pháp nhanh (pdfplumber/camelot)

**Định dạng đầu ra**
- 🔘 JSON: Xem kết quả trực tiếp trên trang, có thể tải về JSON
- 🔘 Excel: Tự động tải file Excel về máy

### Bước 3: Trích xuất

- Click nút **"Trích xuất dữ liệu"**
- Đợi hệ thống xử lý (có thanh loading)
- Xem kết quả bên dưới

## Kết quả

### Thành công ✅

Hiển thị:
- Tổng số sinh viên
- Số bảng được trích xuất
- Phương pháp sử dụng (pdfplumber/camelot/OCR)
- Số trang đã xử lý
- Loại bảng (bm1a, bm2, tong_hop)

**Với JSON:**
- Click "Xem dữ liệu" để xem bảng preview
- Click "Tải JSON" để tải file JSON về máy

**Với Excel:**
- File tự động tải về với tên: `[tên_file]_extracted.xlsx`

### Thất bại ❌

Hiển thị thông báo lỗi và nguyên nhân

## Cấu trúc dữ liệu

### Các cột được trích xuất:

- **MSSV**: Mã số sinh viên (9-10 chữ số)
- **STT**: Số thứ tự
- **Họ và tên SV**: Họ tên đầy đủ
- **Ngày sinh**: Định dạng DD/MM/YYYY
- **Nơi sinh**: Địa chỉ nơi sinh
- **Điểm học phần**: Lần 1, Lần 2, Lần 3 (hoặc HP I L1, HP I L2,...)
- **Điểm môn học**: Điểm tổng kết môn
- **Xếp loại**: Xuất Sắc, Giỏi, Khá, Trung Bình, Yếu, Kém
- **Kết quả**: Đạt/Hỏng

### File Excel output:

File Excel có nhiều sheet:
- **Tóm tắt**: Thông tin tổng quan về các bảng
- **T1_bm2**, **T2_tong_**: Từng bảng theo trang và loại
- **Tổng hợp tất cả**: Tất cả sinh viên (đã loại trùng MSSV)

## Tips & Tricks

### Để có kết quả tốt nhất:

1. **PDF chất lượng cao**: Sử dụng PDF gốc, không scan nếu có thể
2. **PDF scan**: Nếu phải dùng PDF scan, bật "Bắt buộc dùng OCR"
3. **Nhiều file**: Có thể upload nhiều file cùng lúc để xử lý batch
4. **Kiểm tra kết quả**: Luôn kiểm tra dữ liệu sau khi trích xuất

### Xử lý lỗi:

**"No tables extracted"**
- PDF không có bảng hoặc định dạng không đúng
- Thử bật "Bắt buộc dùng OCR"

**"No valid data after processing"**
- Bảng không đúng định dạng TVU
- Không tìm thấy MSSV hợp lệ
- Kiểm tra lại file PDF

**Kết quả không chính xác**
- Thử bật "Bắt buộc dùng OCR"
- Kiểm tra chất lượng PDF (độ phân giải, độ rõ nét)

## Yêu cầu hệ thống

### Backend (Python API):

Phải chạy Python backend tại: `http://localhost:8001`

```bash
cd backend-python
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Thư viện cần thiết:

- pdfplumber (trích xuất PDF)
- camelot-py (backup method)
- pytesseract + pdf2image (OCR)
- openpyxl (xuất Excel)
- pandas, numpy (xử lý dữ liệu)

## Giới hạn

- Chỉ hỗ trợ định dạng bảng điểm của Trường ĐH Trà Vinh
- MSSV phải bắt đầu bằng "1" và có 9-10 chữ số
- OCR yêu cầu PDF chất lượng tốt (≥300 DPI)
- Kích thước file: Tùy thuộc vào cấu hình server

## Bảo mật

- File PDF được xử lý tạm thời và xóa ngay sau khi hoàn thành
- Dữ liệu không được lưu trữ trên server
- Chỉ người dùng đã đăng nhập mới truy cập được

## Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ quản trị viên hệ thống.

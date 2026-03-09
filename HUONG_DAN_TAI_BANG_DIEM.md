# 📊 HƯỚNG DẪN TẢI BẢNG ĐIỂM LÊN HỆ THỐNG

## ✨ TÍNH NĂNG MỚI

Khi tải bảng điểm lên, bạn giờ đây có thể nhập đầy đủ thông tin:
- ✅ Năm học (bắt buộc)
- ✅ Khóa (bắt buộc)
- ✅ Lớp (bắt buộc)
- ✅ Học kỳ (tùy chọn)

## 📝 HƯỚNG DẪN SỬ DỤNG

### Bước 1: Mở Modal Tải Lên

1. Vào trang **Documents** (Tài liệu)
2. Click nút **"Tải lên"** hoặc **"Upload"**

### Bước 2: Chọn Loại Tài Liệu

Chọn **"Danh sách điểm GDQP"** (DSGD)

### Bước 3: Điền Thông Tin Bảng Điểm

Khi chọn loại DSGD, một form màu xanh sẽ xuất hiện với các trường:

#### 📅 Năm học (Bắt buộc)
- Chọn từ dropdown
- Ví dụ: 2024-2025, 2023-2024

#### 📚 Học kỳ (Tùy chọn)
- Học kỳ 1
- Học kỳ 2
- Học kỳ 3 (Hè)

#### 🎓 Khóa (Bắt buộc)
- Nhập mã khóa
- Ví dụ: DA21, K47, DA22

#### 👥 Lớp (Bắt buộc)
- Nhập tên lớp đầy đủ
- Ví dụ: DA21TYC, K47CNTT, DA22HH

### Bước 4: Chọn File

- Kéo thả file PDF hoặc Excel vào vùng upload
- Hoặc click "Chọn file" để browse
- Hỗ trợ: PDF, Excel (.xlsx, .xls)

### Bước 5: Tải Lên

Click nút **"Tải lên"** để hoàn tất

## ✅ VALIDATION

Hệ thống sẽ kiểm tra:
- ❌ Nếu thiếu năm học → Hiển thị lỗi "Vui lòng chọn năm học"
- ❌ Nếu thiếu khóa → Hiển thị lỗi "Vui lòng nhập khóa"
- ❌ Nếu thiếu lớp → Hiển thị lỗi "Vui lòng nhập lớp"
- ❌ Nếu không chọn file → Hiển thị lỗi "Vui lòng chọn ít nhất 1 file"

## 📊 HIỂN THỊ METADATA

Sau khi tải lên, thông tin sẽ được hiển thị dưới tên file:

```
📄 DA21TYC_HK1.pdf
   📅 2024-2025  🎓 DA21  👥 DA21TYC  📚 HK1
```

### Ý nghĩa các icon:
- 📅 Năm học
- 🎓 Khóa
- 👥 Lớp
- 📚 Học kỳ

## 🔍 TÌM KIẾM VÀ LỌC

Metadata giúp bạn:
- Tìm kiếm theo khóa: Gõ "DA21" để tìm tất cả file của khóa DA21
- Tìm kiếm theo lớp: Gõ "DA21TYC" để tìm file của lớp cụ thể
- Tìm kiếm theo năm: Gõ "2024-2025" để tìm file của năm học

## 📁 TỔ CHỨC THƯ MỤC

File sẽ được tự động tổ chức theo cấu trúc:
```
Khóa/Lớp
├── DA21/DA21TYC
├── DA21/DA21HH
├── K47/K47CNTT
└── ...
```

## 💡 MẸO SỬ DỤNG

### 1. Đặt tên file có ý nghĩa
```
✅ Tốt: DA21TYC_HK1_2024.pdf
❌ Tránh: scan001.pdf
```

### 2. Nhập đầy đủ thông tin
- Giúp dễ tìm kiếm sau này
- Hỗ trợ báo cáo và thống kê
- Tránh nhầm lẫn giữa các khóa/lớp

### 3. Kiểm tra trước khi tải
- Đảm bảo file đúng định dạng (PDF/Excel)
- Kiểm tra thông tin khóa, lớp chính xác
- File không quá lớn (khuyến nghị < 10MB)

## 🎯 VÍ DỤ THỰC TẾ

### Ví dụ 1: Tải bảng điểm học kỳ 1
```
Loại: Danh sách điểm GDQP
Năm học: 2024-2025
Học kỳ: Học kỳ 1
Khóa: DA21
Lớp: DA21TYC
File: DA21TYC_HK1.pdf
```

### Ví dụ 2: Tải bảng điểm học kỳ hè
```
Loại: Danh sách điểm GDQP
Năm học: 2023-2024
Học kỳ: Học kỳ 3 (Hè)
Khóa: K47
Lớp: K47CNTT
File: K47CNTT_He2024.xlsx
```

### Ví dụ 3: Tải nhiều file cùng lúc
```
Loại: Danh sách điểm GDQP
Năm học: 2024-2025
Học kỳ: Học kỳ 2
Khóa: DA22
Lớp: DA22HH
Files: 
  - DA22HH_Lop1.pdf
  - DA22HH_Lop2.pdf
  - DA22HH_Lop3.pdf
```

## ❓ CÂU HỎI THƯỜNG GẶP

### Q: Có bắt buộc phải điền học kỳ không?
A: Không, học kỳ là trường tùy chọn. Nhưng nên điền để dễ quản lý.

### Q: Có thể sửa thông tin sau khi tải lên không?
A: Hiện tại chưa hỗ trợ. Bạn cần xóa và tải lại với thông tin đúng.

### Q: Tải file Excel có cần điền metadata không?
A: Có, tất cả file DSGD đều cần điền đầy đủ thông tin.

### Q: Có giới hạn số lượng file tải lên không?
A: Có rate limit 20 uploads/giờ để bảo vệ hệ thống.

### Q: Metadata có được lưu vào database không?
A: Có, metadata được lưu cùng với document record.

## 🔧 TROUBLESHOOTING

### Lỗi: "Vui lòng chọn năm học"
**Nguyên nhân:** Chưa chọn năm học trong dropdown  
**Giải pháp:** Chọn năm học từ danh sách

### Lỗi: "Vui lòng nhập khóa"
**Nguyên nhân:** Trường khóa để trống  
**Giải pháp:** Nhập mã khóa (VD: DA21, K47)

### Lỗi: "Vui lòng nhập lớp"
**Nguyên nhân:** Trường lớp để trống  
**Giải pháp:** Nhập tên lớp đầy đủ (VD: DA21TYC)

### Không thấy form metadata
**Nguyên nhân:** Chưa chọn loại "Danh sách điểm GDQP"  
**Giải pháp:** Click vào option "Danh sách điểm GDQP"

### Metadata không hiển thị sau khi tải
**Nguyên nhân:** Browser cache  
**Giải pháp:** Refresh trang (F5)

## 📞 HỖ TRỢ

Nếu gặp vấn đề, liên hệ:
- Email: support@tvu.edu.vn
- Hotline: 0123-456-789
- Hoặc tạo ticket trong hệ thống

---

**Cập nhật:** 6/3/2026  
**Version:** 2.0 - Thêm metadata fields

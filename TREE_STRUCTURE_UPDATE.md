# ✅ Cây Thư Mục Bảng Điểm - Cập Nhật Hoàn Thành

## Thay Đổi

### Cấu Trúc Cây Thư Mục Mới

Phần "Bảng điểm" giờ hiển thị cây thư mục theo cấu trúc:

```
📋 Tất cả tài liệu (N tài liệu)
├── 🎓 Cao Đẳng (M tài liệu)
│   ├── ✓ Tất cả năm (M tài liệu)
│   ├── 📅 Năm 2024 (X tài liệu)
│   ├── 📅 Năm 2023 (Y tài liệu)
│   └── 📅 Năm 2022 (Z tài liệu)
├── 🎓 Đại Học (M tài liệu)
│   ├── ✓ Tất cả năm (M tài liệu)
│   ├── 📅 Năm 2024 (X tài liệu)
│   ├── 📅 Năm 2023 (Y tài liệu)
│   └── 📅 Năm 2022 (Z tài liệu)
└── 🎓 Liên Thông (M tài liệu)
    ├── ✓ Tất cả năm (M tài liệu)
    ├── 📅 Năm 2024 (X tài liệu)
    ├── 📅 Năm 2023 (Y tài liệu)
    └── 📅 Năm 2022 (Z tài liệu)
```

### Tính Năng

1. **Cây thư mục phân cấp**
   - Cấp 1: Chương trình (Cao Đẳng, Đại Học, Liên Thông)
   - Cấp 2: Năm học (2024, 2023, 2022, ...)

2. **Hiển thị số lượng**
   - Mỗi mục hiển thị số tài liệu
   - Tính toán động dựa trên dữ liệu

3. **Tương tác**
   - Click chương trình để mở/đóng danh sách năm
   - Click năm để lọc tài liệu
   - Click "Tất cả tài liệu" để xem toàn bộ

4. **Giao diện**
   - Thiết kế cây thư mục với đường kẻ bên trái
   - Icon phù hợp cho mỗi loại mục
   - Highlight khi được chọn
   - Dark mode support

### Các File Đã Sửa

- `frontend/src/pages/Documents.tsx`
  - Thêm `programYearsMap` để tính toán năm cho mỗi chương trình
  - Sửa `countDocsForYear()` để nhận tham số chương trình
  - Thay thế UI tab/pill bằng cây thư mục phân cấp
  - Tối ưu hiệu suất với memoization

### Hiệu Suất

- ✅ Sử dụng `useMemo` để tính toán `programYearsMap` một lần
- ✅ Tính toán năm chỉ khi chương trình được chọn
- ✅ Không tính toán lại khi không cần thiết

### Kiểm Tra

Cây thư mục sẽ:
1. Hiển thị tất cả chương trình có dữ liệu
2. Khi click chương trình, hiển thị danh sách năm
3. Khi click năm, lọc tài liệu theo chương trình + năm
4. Hiển thị số lượng tài liệu chính xác cho mỗi mục

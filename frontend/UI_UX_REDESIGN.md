# Thiết kế lại UI/UX - Hệ thống Quản lý GDQP-AN

## 📋 Tổng quan

Giao diện đã được thiết kế lại để phù hợp với người quản lý trung tâm, với focus vào:
- **Chuyên nghiệp**: Bỏ hero slides, tập trung vào dữ liệu
- **Hiệu quả**: Truy cập nhanh các chức năng chính
- **Rõ ràng**: Phân loại menu rõ ràng
- **Dễ sử dụng**: Giao diện trực quan, không phức tạp

---

## 🎨 Hệ thống màu sắc

### Màu chính (Primary)
- **Primary-500**: `#1e5a96` - Xanh đậm (chính)
- **Primary-900**: `#0b1a26` - Xanh rất đậm (sidebar)

### Màu phụ (Accent)
- **Accent-500**: `#4a7ba7` - Xanh nhạt (highlight)
- **Accent-600**: `#3d6a8f` - Xanh nhạt đậm

### Màu trạng thái
- **Success-500**: `#22c55e` - Xanh lá (thành công)
- **Warning-500**: `#f59e0b` - Cam (cảnh báo)
- **Danger-500**: `#ef4444` - Đỏ (lỗi)

---

## 🏗️ Cấu trúc Layout

### Sidebar (Thanh bên trái)
- **Chiều rộng**: 256px (mở rộng) / 64px (thu gọn)
- **Màu nền**: Primary-900 (xanh đậm)
- **Phân loại menu**:
  - **QUẢN LÝ**: Bảng điều khiển, Tài liệu, Quyết định
  - **DỮ LIỆU**: Sinh viên & Điểm
  - **HỆ THỐNG**: Cài đặt, Giới thiệu

### Header (Thanh trên)
- **Chiều cao**: 56px
- **Màu nền**: Trắng (light) / Slate-800 (dark)
- **Nội dung**: Tiêu đề hệ thống, Theme toggle, Thông báo, User menu

### Main Content
- **Padding**: 24px (p-6)
- **Nền**: Gray-50 (light) / Slate-900 (dark)

---

## 📊 Dashboard (Bảng điều khiển)

### Thành phần chính

#### 1. Thống kê (Stats Cards)
- **4 card**: Tổng tài liệu, Tổng trang, OCR hoàn tất (%), Quyết định
- **Bố cục**: Grid 4 cột (responsive: 1 cột mobile, 2 cột tablet, 4 cột desktop)
- **Nội dung**: Icon + Số liệu + Nhãn
- **Animation**: Số đếm tự động khi scroll vào view

#### 2. Thao tác nhanh (Quick Actions)
- **4 nút**: Tài liệu, Quyết định, Dữ liệu, Cài đặt
- **Bố cục**: Grid 2 cột
- **Nội dung**: Icon + Tiêu đề + Mô tả
- **Tương tác**: Hover effect, click navigate

#### 3. Trạng thái (Status Overview)
- **Hiển thị**: Đang xử lý, Lỗi, Tiến độ OCR
- **Tiến độ**: Progress bar với phần trăm

#### 4. Cảnh báo (Alerts)
- **Hiển thị**: Danh sách cảnh báo (nếu có)
- **Màu**: Warning (cam)
- **Icon**: Alert icon

---

## 📄 Tài liệu (Documents)

### Cấu trúc
- **Bộ lọc**: Tìm kiếm, Loại tài liệu
- **Danh sách**: Bảng hoặc grid
- **Hành động**: Xem, Chỉnh sửa, Xóa, OCR review

### Cải tiến
- Bộ lọc rõ ràng, dễ hiểu
- Hiển thị metadata quan trọng
- Modal chỉnh sửa chuyên nghiệp

---

## 🎯 Quyết định (Decisions)

### Cấu trúc
- **Phân loại**: Theo năm
- **Danh sách**: Tệp quyết định
- **Hành động**: Xem, Chỉnh sửa, Xóa

### Cải tiến
- Điều hướng rõ ràng
- Hiển thị metadata đầy đủ
- Preview nhanh

---

## 👥 Dữ liệu (Data)

### Cấu trúc
- **Tab**: Sinh viên, Điểm
- **Bảng**: Danh sách dữ liệu
- **Hành động**: Thêm, Chỉnh sửa, Xóa

### Cải tiến
- Bảng dễ đọc, có highlight hàng
- Phân trang rõ ràng
- Modal CRUD chuyên nghiệp

---

## ⚙️ Cài đặt (Settings)

### Cấu trúc
- **Phân loại**: Theo category
- **Danh sách**: Cài đặt
- **Hành động**: Chỉnh sửa, Xóa, Thêm

### Cải tiến
- Giao diện chuyên nghiệp
- Xác nhận trước khi xóa
- Thông báo thành công/lỗi

---

## 🎨 Thành phần UI

### Buttons
- **Primary**: Xanh đậm (Primary-500)
- **Secondary**: Xám (Gray-300)
- **Danger**: Đỏ (Danger-500)
- **Padding**: px-4 py-2 (md), px-3 py-1.5 (sm)
- **Border radius**: rounded-lg

### Cards
- **Nền**: Trắng (light) / Slate-800 (dark)
- **Border**: Gray-200 (light) / Slate-700 (dark)
- **Shadow**: shadow-sm
- **Padding**: p-6
- **Border radius**: rounded-lg

### Inputs
- **Border**: Gray-200 (light) / Slate-700 (dark)
- **Focus**: ring-2 ring-primary-400
- **Padding**: px-4 py-2
- **Border radius**: rounded-lg

### Modals
- **Backdrop**: Black 50% opacity
- **Nền**: Trắng (light) / Slate-800 (dark)
- **Header**: Có border dưới
- **Footer**: Có border trên
- **Border radius**: rounded-lg

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (1 cột)
- **Tablet**: 640px - 1024px (2 cột)
- **Desktop**: > 1024px (3-4 cột)

### Sidebar
- **Mobile**: Ẩn (drawer)
- **Tablet+**: Hiển thị

---

## 🌙 Dark Mode

- **Hỗ trợ**: Đầy đủ
- **Toggle**: Trong header
- **Lưu trữ**: localStorage
- **Prefix**: `dark:`

---

## ✨ Animations

### Fade-in-up
- **Thời gian**: 0.6s
- **Easing**: ease-out
- **Sử dụng**: Khi load trang

### Hover Effects
- **Transition**: 0.2s - 0.3s
- **Sử dụng**: Buttons, cards, menu items

### Loading Spinner
- **Kiểu**: Rotating border
- **Màu**: Primary-600
- **Kích thước**: w-12 h-12

---

## 📋 Checklist Cập nhật

- [x] Tailwind config - Màu sắc chuyên nghiệp
- [x] Sidebar - Menu phân loại rõ ràng
- [x] Header - Đơn giản, chuyên nghiệp
- [x] Dashboard - Bỏ hero slides, tập trung dữ liệu
- [x] Modal - Thiết kế chuyên nghiệp
- [x] CSS globals - Animations tối giản
- [ ] Documents - Cập nhật UI
- [ ] Decisions - Cập nhật UI
- [ ] Data - Cập nhật UI
- [ ] Settings - Cập nhật UI
- [ ] Login - Cập nhật UI
- [ ] Buttons & Forms - Standardize

---

## 🚀 Tiếp theo

1. Cập nhật các trang còn lại (Documents, Decisions, Data, Settings)
2. Standardize buttons và form inputs
3. Thêm loading states
4. Thêm error handling UI
5. Test responsive design
6. Test dark mode
7. Optimize performance


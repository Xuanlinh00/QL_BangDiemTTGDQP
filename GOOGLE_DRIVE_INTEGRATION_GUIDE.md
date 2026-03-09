# 🚀 Hướng dẫn sử dụng Google Drive Integration

## ✅ Trạng thái hiện tại

Bạn đã hoàn thành tất cả các bước thiết lập:

- ✓ Tạo Google Cloud Project
- ✓ Bật Google Drive API
- ✓ Tạo OAuth2 Credentials
- ✓ Cấu hình OAuth Consent Screen
- ✓ Cập nhật `.env.local` với credentials

## 🎯 Bước tiếp theo: Khởi động ứng dụng

### 1. Khởi động Backend (Node.js)

```bash
cd backend-node
npm install
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3000`

### 2. Khởi động Frontend (React + Vite)

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📖 Cách sử dụng Google Drive Modal

### Bước 1: Truy cập trang Documents

1. Mở ứng dụng tại `http://localhost:5173`
2. Đăng nhập vào hệ thống
3. Vào trang **Quản lý Tài liệu** (Documents)

### Bước 2: Mở Google Drive Modal

1. Click nút **🔗 Google Drive** (hoặc tương tự)
2. Modal sẽ hiện ra

### Bước 3: Đăng nhập Google

1. Click nút **🔐 Đăng nhập Google**
2. Chọn tài khoản Google của bạn
3. Cấp quyền truy cập Google Drive

### Bước 4: Tìm kiếm file

1. Nhập tên file trong ô tìm kiếm
2. Click **🔍 Tìm** hoặc nhấn Enter
3. Danh sách file sẽ cập nhật

### Bước 5: Chọn file

1. Click checkbox để chọn file
2. Hoặc click **Chọn tất cả** để chọn tất cả
3. Số file đã chọn hiển thị ở nút **Nhập**

### Bước 6: Nhập file

1. Click nút **Nhập (n)** để thêm file vào hệ thống
2. File sẽ được thêm vào danh sách tài liệu

## 📋 Các loại file hỗ trợ

- **PDF:** `application/pdf`
- **Excel:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Excel (cũ):** `application/vnd.ms-excel`

## 🔍 Các tính năng chính

### 1. Đăng nhập/Đăng xuất Google
- Xác thực an toàn với Google OAuth2
- Hiển thị email người dùng
- Đăng xuất sạch sẽ

### 2. Tìm kiếm file
- Tìm kiếm theo tên file
- Hỗ trợ tìm kiếm trong folder cụ thể (nếu cấu hình)
- Kết quả sắp xếp theo ngày tạo mới nhất

### 3. Chọn nhiều file
- Checkbox để chọn từng file
- Chọn tất cả một lần
- Hiển thị số file đã chọn

### 4. Nhập file
- Thêm file vào hệ thống
- Lưu thông tin file (ID, tên, loại)
- Tích hợp với backend

## 🔐 Thông tin bảo mật

### Credentials hiện tại

```env
VITE_GOOGLE_API_KEY=AIzaSyBYAR3bGbM-hLzoqVDP1xRStnDBk8gV12A
VITE_GOOGLE_CLIENT_ID=580905234532-nrs4appe6gdt2ame9dfnfct4bnjs3j3l.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
VITE_GOOGLE_DRIVE_FOLDER_ID=1C9RUxKft7LfME0NdMVscmWN23MQlFGFY
```

### ⚠️ Lưu ý quan trọng

1. **Không commit `.env.local`** vào Git
2. **Không chia sẻ Client Secret** công khai
3. **Sử dụng HTTPS** trong production
4. **Giới hạn quyền truy cập** chỉ cần thiết

## 🐛 Khắc phục sự cố

### Lỗi: "Unauthorized"

**Nguyên nhân:** Client ID hoặc API Key sai

**Giải pháp:**
1. Kiểm tra lại `.env.local`
2. Xác nhận credentials từ Google Cloud Console
3. Reload trang

### Lỗi: "Redirect URI mismatch"

**Nguyên nhân:** Redirect URI không khớp

**Giải pháp:**
1. Vào Google Cloud Console
2. Vào **Credentials** → **OAuth 2.0 Client IDs**
3. Cập nhật **Authorized redirect URIs**:
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5173`

### Lỗi: "Access denied"

**Nguyên nhân:** Chưa cấp quyền truy cập Google Drive

**Giải pháp:**
1. Click **🔐 Đăng nhập Google** lại
2. Cấp quyền truy cập Google Drive

### Không thấy file

**Nguyên nhân:**
1. Chưa đăng nhập
2. Folder ID sai
3. File không phải PDF/Excel

**Giải pháp:**
1. Đăng nhập Google
2. Kiểm tra Folder ID
3. Chỉ PDF/Excel được hỗ trợ

## 📚 Tài liệu tham khảo

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🎓 Tiếp theo

### Tích hợp nâng cao

1. **Service Account** - Tự động lấy file mà không cần đăng nhập
2. **Webhook** - Tự động đồng bộ khi file thay đổi
3. **Batch operations** - Xử lý nhiều file cùng lúc
4. **Caching** - Lưu danh sách file để tăng tốc độ

## ✅ Checklist

- [ ] Khởi động Backend
- [ ] Khởi động Frontend
- [ ] Truy cập trang Documents
- [ ] Click nút Google Drive
- [ ] Đăng nhập Google
- [ ] Tìm kiếm file
- [ ] Chọn file
- [ ] Nhập file thành công

---

**Lưu ý:** Nếu gặp bất kỳ vấn đề nào, hãy kiểm tra console browser (F12) để xem lỗi chi tiết.

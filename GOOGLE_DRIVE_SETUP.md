# 🔗 Hướng dẫn cấu hình Google Drive API

## ✅ Bước 1: Tạo Google Cloud Project (Đã hoàn thành)

Bạn đã tạo xong. Nếu chưa, làm theo:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project**
3. Nhập tên: `TVU GDQP-AN`
4. Click **Create**

## ✅ Bước 2: Bật Google Drive API (Đã hoàn thành)

Bạn đã bật xong. Nếu chưa:

1. Trong Google Cloud Console, tìm **Google Drive API**
2. Click **Enable**

## ✅ Bước 3: Tạo OAuth2 Credentials (Đã hoàn thành)

Bạn đã tạo xong. Nếu chưa:

1. Vào **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Chọn **Web application**
3. Thêm Authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5173`
4. Click **Create**
5. Copy **Client ID** và **Client Secret**

## 📝 Bước 4: Cấu hình trong `.env.local`

Cập nhật file `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal

# Google Drive API Configuration
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Google Drive Folder ID (tùy chọn)
VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

### Lấy thông tin từ Google Cloud Console:

1. **API Key:**
   - Vào **Credentials** → **API Keys**
   - Copy API key

2. **Client ID & Client Secret:**
   - Vào **Credentials** → **OAuth 2.0 Client IDs**
   - Click vào client ID
   - Copy **Client ID** và **Client Secret**

3. **Folder ID (tùy chọn):**
   - Mở Google Drive
   - Tạo folder hoặc chọn folder cần lấy file
   - URL sẽ như: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy FOLDER_ID

## 🔐 Bước 5: Cấu hình OAuth Consent Screen

1. Vào **OAuth consent screen**
2. Chọn **External** (nếu chưa)
3. Click **Create**
4. Điền thông tin:
   - **App name:** TVU GDQP-AN Admin Portal
   - **User support email:** admin@tvu.edu.vn
   - **Developer contact:** admin@tvu.edu.vn
5. Click **Save and Continue**
6. Thêm scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
7. Click **Save and Continue**
8. Thêm test users (email của bạn)
9. Click **Save and Continue**

## 🚀 Bước 6: Sử dụng trong ứng dụng

### Khởi động ứng dụng

```bash
cd frontend
npm install
npm run dev
```

### Sử dụng Google Drive Modal

1. Vào trang **Documents** (Quản lý Tài liệu)
2. Click nút **🔗 Google Drive**
3. Click **🔐 Đăng nhập Google**
4. Đăng nhập bằng tài khoản Google
5. Chọn file từ Google Drive
6. Click **Nhập** để thêm vào hệ thống

## 📋 Các tính năng

### 1. Đăng nhập Google
- Click nút "🔐 Đăng nhập Google"
- Chọn tài khoản Google
- Cấp quyền truy cập Google Drive

### 2. Tìm kiếm file
- Nhập tên file trong ô tìm kiếm
- Click "🔍 Tìm" hoặc nhấn Enter
- Danh sách file sẽ cập nhật

### 3. Chọn file
- Click checkbox để chọn file
- Hoặc click "Chọn tất cả" để chọn tất cả
- Số file đã chọn hiển thị ở nút "Nhập"

### 4. Nhập file
- Click nút "Nhập (n)" để thêm file vào hệ thống
- File sẽ được thêm vào danh sách tài liệu

### 5. Đăng xuất
- Click nút "Đăng xuất" để đăng xuất Google
- Danh sách file sẽ bị xóa

## 🔍 Các loại file hỗ trợ

- **PDF:** `application/pdf`
- **Excel:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Excel (cũ):** `application/vnd.ms-excel`

## 🎯 Ví dụ sử dụng

### Lấy file từ folder cụ thể

```env
# Thêm vào .env.local
VITE_GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7g8h9i0j
```

Khi đó, chỉ file trong folder này sẽ được hiển thị.

### Tìm kiếm file

```
Tìm kiếm: "2023"
Kết quả: Tất cả file có tên chứa "2023"
```

## 🔐 Bảo mật

### Lưu ý quan trọng

1. **Không commit `.env.local`** vào Git
2. **Không chia sẻ Client Secret** công khai
3. **Sử dụng HTTPS** trong production
4. **Giới hạn quyền truy cập** chỉ cần thiết

### Trong production

1. Sử dụng environment variables từ server
2. Không lưu credentials trong code
3. Sử dụng Service Account thay vì OAuth2
4. Implement rate limiting
5. Thêm logging & monitoring

## 🐛 Khắc phục sự cố

### Lỗi: "Unauthorized"

```
Nguyên nhân: Client ID hoặc API Key sai
Giải pháp: Kiểm tra lại .env.local
```

### Lỗi: "Redirect URI mismatch"

```
Nguyên nhân: Redirect URI không khớp
Giải pháp: Cập nhật Authorized redirect URIs trong Google Cloud Console
```

### Lỗi: "Access denied"

```
Nguyên nhân: Chưa cấp quyền truy cập Google Drive
Giải pháp: Click "🔐 Đăng nhập Google" và cấp quyền
```

### Không thấy file

```
Nguyên nhân: 
1. Chưa đăng nhập
2. Folder ID sai
3. File không phải PDF/Excel

Giải pháp:
1. Đăng nhập Google
2. Kiểm tra Folder ID
3. Chỉ PDF/Excel được hỗ trợ
```

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

### Ví dụ Service Account

```typescript
// Sử dụng Service Account JSON key
const serviceAccount = require('./service-account-key.json')

const auth = new google.auth.GoogleAuth({
  keyFile: './service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const drive = google.drive({ version: 'v3', auth })
```

## ✅ Checklist

- [ ] Tạo Google Cloud Project
- [ ] Bật Google Drive API
- [ ] Tạo OAuth2 Credentials
- [ ] Cấu hình OAuth Consent Screen
- [ ] Cập nhật `.env.local`
- [ ] Khởi động ứng dụng
- [ ] Đăng nhập Google
- [ ] Tìm kiếm file
- [ ] Nhập file thành công

---

**Lưu ý:** Đây là hướng dẫn cho môi trường development. Trong production, cần cấu hình bảo mật cao hơn.

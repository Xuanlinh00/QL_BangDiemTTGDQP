# 🔍 Hướng dẫn Debug Google Drive Integration

## Bước 1: Kiểm tra Console Browser

1. Mở ứng dụng tại `http://localhost:5173`
2. Nhấn **F12** để mở Developer Tools
3. Vào tab **Console**
4. Tìm các thông báo liên quan đến Google API

## Bước 2: Kiểm tra các lỗi phổ biến

### Lỗi 1: "Google API script failed to load"

**Nguyên nhân:** Không thể tải script từ Google

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Kiểm tra xem có VPN/Proxy chặn không
3. Thử tải lại trang (Ctrl+F5)

### Lỗi 2: "Unauthorized client"

**Nguyên nhân:** Client ID sai hoặc không được phép

**Giải pháp:**
1. Vào Google Cloud Console
2. Kiểm tra Client ID trong Credentials
3. Cập nhật `.env.local` với Client ID đúng
4. Thử lại

### Lỗi 3: "Redirect URI mismatch"

**Nguyên nhân:** Redirect URI không khớp

**Giải pháp:**
1. Vào Google Cloud Console
2. Vào **Credentials** → **OAuth 2.0 Client IDs**
3. Click vào Client ID
4. Kiểm tra **Authorized redirect URIs**
5. Đảm bảo có:
   - `http://localhost:5173/auth/google/callback`
   - `http://localhost:5173`
6. Lưu lại

### Lỗi 4: "Access denied"

**Nguyên nhân:** Chưa cấp quyền hoặc quyền bị từ chối

**Giải pháp:**
1. Đăng xuất Google (nếu đã đăng nhập)
2. Xóa cookies của Google (tùy chọn)
3. Đăng nhập lại
4. Cấp quyền truy cập Google Drive

## Bước 3: Kiểm tra Credentials

### Kiểm tra `.env.local`

```bash
# Mở file frontend/.env.local
# Kiểm tra các biến:
VITE_GOOGLE_API_KEY=...
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_CLIENT_SECRET=...
VITE_GOOGLE_REDIRECT_URI=...
```

### Kiểm tra Google Cloud Console

1. Vào https://console.cloud.google.com/
2. Chọn Project: **TVU GDQP-AN**
3. Vào **APIs & Services** → **Credentials**
4. Kiểm tra:
   - **API Keys** - Có API Key không?
   - **OAuth 2.0 Client IDs** - Có Client ID không?
5. Click vào Client ID để xem chi tiết

## Bước 4: Kiểm tra OAuth Consent Screen

1. Vào Google Cloud Console
2. Vào **APIs & Services** → **OAuth consent screen**
3. Kiểm tra:
   - **User Type:** External (cho tài khoản cá nhân)
   - **App name:** TVU GDQP-AN Admin Portal
   - **Scopes:** Có `https://www.googleapis.com/auth/drive.readonly` không?
   - **Test users:** Có email của bạn không?

## Bước 5: Kiểm tra Google Drive API

1. Vào Google Cloud Console
2. Vào **APIs & Services** → **Library**
3. Tìm **Google Drive API**
4. Kiểm tra xem đã **Enable** chưa

## Bước 6: Kiểm tra Console Logs

Khi click "🔐 Đăng nhập Google", hãy xem console có các log này không:

```
Google API script loaded
Initializing Google API client...
Google API client initialized
Signing in to Google...
Signed in as: your-email@gmail.com
```

Nếu không có, hãy xem lỗi cụ thể.

## Bước 7: Kiểm tra Network

1. Mở Developer Tools (F12)
2. Vào tab **Network**
3. Click "🔐 Đăng nhập Google"
4. Kiểm tra các request:
   - `apis.google.com/js/api.js` - Có 200 OK không?
   - `accounts.google.com/...` - Có 200 OK không?

## Bước 8: Kiểm tra Folder ID (nếu có)

Nếu cấu hình `VITE_GOOGLE_DRIVE_FOLDER_ID`:

1. Mở Google Drive
2. Vào folder đó
3. URL sẽ như: `https://drive.google.com/drive/folders/FOLDER_ID`
4. Copy FOLDER_ID
5. Cập nhật `.env.local`

## Bước 9: Thử lại từ đầu

1. Xóa cache browser:
   - Nhấn Ctrl+Shift+Delete
   - Chọn "All time"
   - Xóa
2. Tải lại trang (Ctrl+F5)
3. Thử đăng nhập lại

## Bước 10: Kiểm tra Scopes

Khi đăng nhập, Google sẽ yêu cầu cấp quyền. Kiểm tra xem có yêu cầu:

```
"View and manage the files in your Google Drive"
```

Nếu không, có thể là scope không được cấu hình đúng.

## 📋 Checklist Debug

- [ ] Kiểm tra console browser (F12)
- [ ] Kiểm tra `.env.local` có credentials không
- [ ] Kiểm tra Google Cloud Console
- [ ] Kiểm tra OAuth Consent Screen
- [ ] Kiểm tra Google Drive API đã Enable
- [ ] Kiểm tra Network tab
- [ ] Xóa cache và tải lại
- [ ] Thử đăng nhập lại

## 🆘 Nếu vẫn không được

Hãy cung cấp:

1. **Lỗi cụ thể từ console** (F12 → Console)
2. **Lỗi từ Network tab** (F12 → Network)
3. **Credentials hiện tại** (từ `.env.local`)
4. **Thông tin từ Google Cloud Console**

---

**Lưu ý:** Nếu vẫn gặp vấn đề, hãy kiểm tra lại các bước thiết lập Google Cloud Project.

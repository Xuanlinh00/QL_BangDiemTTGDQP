# Sửa lỗi Upload File - MongoDB Not Connected

## 🔴 Vấn đề

```
warn: MongoDB not connected - rejecting POST /upload
503 Service Unavailable
```

Backend chạy nhưng MongoDB không kết nối, nên không thể upload file.

## ✅ Giải pháp (3 bước)

### Bước 1: Cấu hình MongoDB Atlas

**Nhanh nhất: Vào https://www.mongodb.com/cloud/atlas**

1. Đăng ký/Đăng nhập
2. Tạo cluster M0 Free (AWS, Singapore)
3. Tạo user: `admin` + password
4. Whitelist IP: 0.0.0.0/0
5. Lấy connection string

### Bước 2: Cập nhật .env

Mở `backend-node/.env`:

```properties
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `admin` → username
- `PASSWORD` → password
- `cluster0.xxxxx` → cluster name

### Bước 3: Restart Backend

```bash
# Dừng (Ctrl+C)
# Start lại
npm run dev
```

## 🎯 Kết quả

✅ Backend kết nối MongoDB
✅ Upload file hoạt động
✅ Lỗi 503 biến mất

## 📝 Lưu ý

- Không commit .env
- Giữ bảo mật password
- Sử dụng password mạnh

## 📚 Tài liệu

- Chi tiết: `CONFIGURE_MONGODB_NOW.md`
- Đầy đủ: `MONGODB_SETUP_STEP_BY_STEP.md`

# Backend Chạy nhưng MongoDB Authentication Failed

## ✅ Tốt tin

Backend đang chạy trên port 3000:
```
Server running on port 3000
```

## ❌ Vấn đề

MongoDB authentication failed:
```
MongoDB initial connection failed: Authentication failed
```

## 🔧 Cách sửa

### Bước 1: Cấu hình MongoDB Atlas

1. Vào https://www.mongodb.com/cloud/atlas
2. Đăng nhập
3. Tạo cluster M0 Free (nếu chưa có)
4. Tạo database user:
   - Username: `admin`
   - Password: `[mật khẩu mạnh]`
5. Whitelist IP: "Allow Access from Anywhere" (0.0.0.0/0)
6. Lấy connection string

### Bước 2: Cập nhật .env

Mở `backend-node/.env`:

```properties
# Trước:
MONGODB_URI=mongodb+srv://user:HaivaLinh1605@cluster0.tqmq2ht.mongodb.net/qlbangdiem

# Sau:
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `admin` → username bạn tạo
- `YOUR_PASSWORD` → password bạn tạo
- `cluster0.xxxxx` → cluster name từ connection string

**Ví dụ:**
```properties
MONGODB_URI=mongodb+srv://admin:Admin@123456@cluster0.tqmq2ht.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

### Bước 3: Restart Backend

```bash
# Dừng backend (Ctrl+C)

# Start lại
cd backend-node
npm run dev
```

### Bước 4: Kiểm tra

Logs sẽ hiển thị:
```
Connected to MongoDB Atlas
Server running on port 3000
```

## 📝 Lưu ý

- Không commit .env vào git
- Giữ bảo mật password
- Sử dụng password mạnh (8+ ký tự, hỗn hợp)

## 🎯 Kết quả

✅ Backend chạy
✅ MongoDB kết nối
✅ API hoạt động
✅ Có thể tải file lên

## 📚 Tài liệu

- Chi tiết: `MONGODB_SETUP_STEP_BY_STEP.md`
- Quick start: `MONGODB_ATLAS_QUICK_START.md`

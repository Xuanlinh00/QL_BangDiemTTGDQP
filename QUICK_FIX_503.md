# Sửa lỗi 503 - MongoDB Connection

## Vấn đề
Tất cả API trả về 503 vì MongoDB không kết nối.

## Nguyên nhân
File `.env` trong `backend-node/` có MongoDB URI nhưng credentials sai hoặc MongoDB chưa được cấu hình.

## Cách sửa nhanh (5 phút)

### Bước 1: Cấu hình MongoDB Atlas

1. Vào https://www.mongodb.com/cloud/atlas
2. Đăng nhập hoặc tạo tài khoản
3. Tạo cluster M0 Free
4. Tạo database user (username: `admin`, password: `[mật khẩu mạnh]`)
5. Whitelist IP: "Allow Access from Anywhere" (0.0.0.0/0)
6. Lấy connection string

### Bước 2: Cập nhật .env

Mở `backend-node/.env` và sửa:

```properties
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `admin` → username bạn tạo
- `YOUR_PASSWORD` → password bạn tạo
- `cluster0.xxxxx` → cluster name từ connection string

### Bước 3: Restart Backend

```bash
cd backend-node
npm run dev
```

### Bước 4: Kiểm tra

Nếu thành công, logs sẽ hiển thị:
```
Connected to MongoDB Atlas
Server running on port 3000
```

## Nếu vẫn lỗi

### Kiểm tra credentials
```bash
mongosh "mongodb+srv://admin:password@cluster.mongodb.net/qlbangdiem"
```

### Kiểm tra IP whitelist
- Vào MongoDB Atlas
- Security → Network Access
- Thêm IP của máy bạn hoặc 0.0.0.0/0

### Kiểm tra database name
- Đảm bảo database `qlbangdiem` tồn tại
- Hoặc tạo database mới

## Sau khi sửa

✅ Lỗi 503 sẽ biến mất
✅ Có thể tải file lên
✅ Tất cả API hoạt động

## Liên quan

- Hướng dẫn chi tiết: `MONGODB_ATLAS_SETUP.md`
- Quick start: `MONGODB_ATLAS_QUICK_START.md`

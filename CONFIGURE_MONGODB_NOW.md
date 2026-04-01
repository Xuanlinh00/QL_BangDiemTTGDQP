# Cấu hình MongoDB Atlas - Hướng dẫn nhanh (10 phút)

## 🔴 Vấn đề hiện tại

```
ERR_CONNECTION_REFUSED - Backend không thể kết nối MongoDB
503 Service Unavailable - API trả về lỗi
```

## ✅ Giải pháp

### Bước 1: Tạo tài khoản MongoDB Atlas (2 phút)

1. Vào: https://www.mongodb.com/cloud/atlas
2. Click **"Sign Up"** (hoặc Sign In nếu có)
3. Điền email, password
4. Xác nhận email

### Bước 2: Tạo Cluster (3 phút)

1. Click **"Create"** → **"Build a Cluster"**
2. Chọn **M0 Free** (miễn phí)
3. Cloud Provider: **AWS**
4. Region: **Singapore**
5. Click **"Create Cluster"**
6. Chờ 5-10 phút

### Bước 3: Tạo Database User (2 phút)

1. Vào **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Nhập:
   - **Username**: `admin`
   - **Password**: `Admin@123456` (hoặc password khác)
   - **Role**: `Atlas admin`
4. Click **"Add User"**

### Bước 4: Whitelist IP (1 phút)

1. Vào **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Bước 5: Lấy Connection String (1 phút)

1. Vào **Clusters** → Click **"Connect"**
2. Chọn **"Drivers"**
3. Chọn **Node.js 4.x or later**
4. Copy connection string

Sẽ trông như:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Bước 6: Cập nhật .env (1 phút)

Mở file `backend-node/.env`:

```properties
MONGODB_URI=mongodb+srv://admin:Admin@123456@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `admin` → username bạn tạo
- `Admin@123456` → password bạn tạo
- `cluster0.xxxxx` → cluster name từ connection string

### Bước 7: Restart Backend (1 phút)

```bash
# Dừng backend (Ctrl+C)

# Start lại
cd backend-node
npm run dev
```

### Bước 8: Kiểm tra (1 phút)

Logs sẽ hiển thị:
```
Connected to MongoDB Atlas
Server running on port 3000
```

## 🎯 Kết quả

✅ Backend kết nối MongoDB
✅ Lỗi 503 biến mất
✅ Có thể tải file lên
✅ Tất cả API hoạt động

## 📝 Lưu ý

- **Không commit .env** vào git
- **Giữ bảo mật password**
- **Sử dụng password mạnh** (8+ ký tự, hỗn hợp)

## 🆘 Nếu vẫn lỗi

### Kiểm tra credentials
```bash
mongosh "mongodb+srv://admin:Admin@123456@cluster0.xxxxx.mongodb.net/qlbangdiem"
```

### Kiểm tra IP whitelist
- Vào MongoDB Atlas
- Security → Network Access
- Thêm IP của máy bạn hoặc 0.0.0.0/0

### Kiểm tra database name
- Đảm bảo database `qlbangdiem` tồn tại
- Hoặc tạo database mới

## 💡 Mẹo

- Sử dụng password manager để lưu credentials
- Backup connection string ở nơi an toàn
- Kiểm tra logs backend thường xuyên

## 📚 Tài liệu chi tiết

- `MONGODB_SETUP_STEP_BY_STEP.md` - Hướng dẫn đầy đủ
- `MONGODB_ATLAS_QUICK_START.md` - Quick start
- `BACKEND_RUNNING_MONGODB_AUTH_FAILED.md` - Nếu backend chạy nhưng MongoDB lỗi

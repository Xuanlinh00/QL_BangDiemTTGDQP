# MongoDB Atlas - Quick Start (5 phút)

## 📋 Checklist

- [ ] Tạo tài khoản MongoDB Atlas
- [ ] Tạo cluster
- [ ] Tạo database user
- [ ] Whitelist IP
- [ ] Lấy connection string
- [ ] Cập nhật .env
- [ ] Restart backend
- [ ] Kiểm tra kết nối

## 🚀 Bước 1-2: Tạo Cluster (2 phút)

```
1. Vào https://www.mongodb.com/cloud/atlas
2. Đăng nhập/Tạo tài khoản
3. Click "Create" → "Build a Cluster"
4. Chọn M0 Free
5. AWS, Singapore
6. Click "Create Cluster"
7. Chờ 5-10 phút
```

## 👤 Bước 3: Tạo User (1 phút)

```
1. Security → Database Access
2. "Add New Database User"
3. Username: admin
4. Password: [tạo password mạnh]
5. Role: Atlas admin
6. "Add User"
```

**Lưu lại:**
```
Username: admin
Password: [your-password]
```

## 🌐 Bước 4: Whitelist IP (30 giây)

```
1. Security → Network Access
2. "Add IP Address"
3. "Allow Access from Anywhere" (0.0.0.0/0)
4. "Confirm"
```

## 🔗 Bước 5: Lấy Connection String (1 phút)

```
1. Clusters → "Connect"
2. "Drivers"
3. Node.js 4.x or later
4. Copy connection string
```

Sẽ trông như:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## ✏️ Bước 6: Cập nhật .env (30 giây)

Mở `backend-node/.env`:

```properties
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `YOUR_PASSWORD` → password bạn tạo
- `cluster0.xxxxx` → cluster name từ connection string

## 🔄 Bước 7: Restart Backend (30 giây)

```bash
cd backend-node

# Stop (Ctrl+C nếu đang chạy)

# Start
npm run dev
```

## ✅ Bước 8: Kiểm tra (30 giây)

Nếu thành công, logs sẽ hiển thị:
```
Connected to MongoDB Atlas
Server running on port 3000
```

## 🎉 Hoàn tất!

✅ Backend kết nối MongoDB Atlas
✅ Frontend không còn lỗi 503
✅ Activity Editor có thể lưu dữ liệu

## ❌ Nếu lỗi

### Lỗi: Authentication failed
- Kiểm tra username/password
- Kiểm tra connection string

### Lỗi: IP not whitelisted
- Vào Network Access
- Thêm IP hoặc chọn 0.0.0.0/0

### Lỗi: Connection timeout
- Kiểm tra internet
- Chờ vài phút rồi thử lại

## 📚 Tài liệu đầy đủ

Xem `MONGODB_ATLAS_SETUP.md` để biết chi tiết hơn

## 💡 Mẹo

- Sử dụng password mạnh (8+ ký tự, hỗn hợp)
- Không commit .env vào git
- Giữ bảo mật credentials
- Rotate password mỗi 3-6 tháng

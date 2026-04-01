# Cấu hình MongoDB Atlas - Hướng dẫn từng bước

## 📋 Tóm tắt

Bạn cần cấu hình MongoDB Atlas để backend có thể kết nối. Sau đó, tính năng upload file sẽ hoạt động.

## 🚀 Bước 1: Tạo tài khoản MongoDB Atlas

1. Vào https://www.mongodb.com/cloud/atlas
2. Click "Sign Up" (hoặc "Sign In" nếu đã có tài khoản)
3. Điền email, password, tên
4. Xác nhận email
5. Chọn "Create a free cluster"

## 🏗️ Bước 2: Tạo Cluster

1. Chọn **M0 Free** (miễn phí)
2. Cloud Provider: **AWS**
3. Region: **Singapore** (gần Việt Nam nhất)
4. Click **"Create Cluster"**
5. Chờ 5-10 phút cluster được tạo

## 👤 Bước 3: Tạo Database User

1. Vào **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Nhập:
   - **Username**: `admin`
   - **Password**: Tạo password mạnh (ví dụ: `Admin@123456`)
   - **Built-in Role**: `Atlas admin`
4. Click **"Add User"**

**Lưu lại:**
```
Username: admin
Password: Admin@123456
```

## 🌐 Bước 4: Whitelist IP

1. Vào **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

## 🔗 Bước 5: Lấy Connection String

1. Vào **Clusters** → Click **"Connect"**
2. Chọn **"Drivers"**
3. Chọn **Node.js** version **4.x or later**
4. Copy connection string

Sẽ trông như:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## ✏️ Bước 6: Cập nhật .env

Mở file `backend-node/.env`:

```bash
# Trước:
MONGODB_URI=mongodb+srv://user:HaivaLinh1605@cluster0.tqmq2ht.mongodb.net/qlbangdiem

# Sau:
MONGODB_URI=mongodb+srv://admin:Admin@123456@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `admin` → username bạn tạo
- `Admin@123456` → password bạn tạo
- `cluster0.xxxxx` → cluster name từ connection string

**Ví dụ hoàn chỉnh:**
```
MONGODB_URI=mongodb+srv://admin:Admin@123456@cluster0.tqmq2ht.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

## 🔄 Bước 7: Restart Backend

```bash
# Mở terminal
cd backend-node

# Stop server (Ctrl+C nếu đang chạy)

# Start lại
npm run dev
```

## ✅ Bước 8: Kiểm tra

Nếu thành công, logs sẽ hiển thị:
```
Connected to MongoDB Atlas
Server running on port 3000
```

Nếu lỗi, logs sẽ hiển thị:
```
MongoDB initial connection failed: Authentication failed
```

## 🐛 Troubleshooting

### Lỗi: Authentication failed

**Nguyên nhân**: Username/password sai

**Cách sửa**:
1. Vào MongoDB Atlas
2. Security → Database Access
3. Kiểm tra username/password
4. Cập nhật lại .env

### Lỗi: IP not whitelisted

**Nguyên nhân**: IP của máy bạn không được phép

**Cách sửa**:
1. Vào Security → Network Access
2. Thêm IP của máy bạn
3. Hoặc chọn "Allow Access from Anywhere" (0.0.0.0/0)

### Lỗi: Connection timeout

**Nguyên nhân**: Mạng chậm hoặc MongoDB Atlas bị lỗi

**Cách sửa**:
1. Kiểm tra kết nối internet
2. Chờ vài phút rồi thử lại
3. Kiểm tra status MongoDB Atlas: https://status.mongodb.com/

## 🧪 Test Connection từ Terminal

```bash
# Cài mongosh (nếu chưa có)
npm install -g mongosh

# Kết nối
mongosh "mongodb+srv://admin:Admin@123456@cluster0.xxxxx.mongodb.net/qlbangdiem"

# Nếu thành công, sẽ vào MongoDB shell
# Gõ: show collections
# Gõ: exit để thoát
```

## 🎉 Sau khi cấu hình

✅ Backend kết nối MongoDB Atlas
✅ Lỗi 503 sẽ biến mất
✅ Có thể tải file lên
✅ Tất cả API hoạt động

## 📝 Lưu ý bảo mật

⚠️ **Quan trọng:**

1. **Không commit .env** vào git
   - Đã có trong `.gitignore`
   - Kiểm tra: `git status`

2. **Không chia sẻ password**
   - Chỉ chia sẻ connection string với team nếu cần
   - Sử dụng environment variables trong production

3. **Sử dụng password mạnh**
   - Tối thiểu 8 ký tự
   - Có chữ hoa, chữ thường, số, ký tự đặc biệt

4. **Rotate password định kỳ**
   - Thay đổi password mỗi 3-6 tháng

## 🔗 Liên quan

- Activity Editor: `/activities/new`
- Upload file: `/documents`
- Dashboard: `/`
- Bảng điểm: `/documents`

## 💡 Mẹo

- Sử dụng password manager để lưu credentials
- Backup connection string ở nơi an toàn
- Kiểm tra logs backend thường xuyên

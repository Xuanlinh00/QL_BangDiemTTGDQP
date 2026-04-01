# Cấu hình MongoDB Atlas

## Bước 1: Truy cập MongoDB Atlas

1. Vào https://www.mongodb.com/cloud/atlas
2. Đăng nhập hoặc tạo tài khoản mới
3. Tạo project mới (nếu chưa có)

## Bước 2: Tạo Cluster

1. Click "Create" → "Build a Cluster"
2. Chọn **M0 Free** (miễn phí)
3. Chọn Cloud Provider: **AWS**
4. Chọn Region: **Singapore** (gần Việt Nam)
5. Click "Create Cluster"
6. Chờ cluster được tạo (khoảng 5-10 phút)

## Bước 3: Tạo Database User

1. Vào **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Nhập:
   - **Username**: `admin` (hoặc tên khác)
   - **Password**: Tạo password mạnh (lưu lại!)
   - **Built-in Role**: `Atlas admin`
4. Click **"Add User"**

**Lưu lại:**
```
Username: admin
Password: [your-password-here]
```

## Bước 4: Whitelist IP Address

1. Vào **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Hoặc nhập IP của máy bạn
4. Click **"Confirm"**

## Bước 5: Lấy Connection String

1. Vào **Clusters** → Click **"Connect"**
2. Chọn **"Drivers"**
3. Chọn **Node.js** version **4.x or later**
4. Copy connection string

Connection string sẽ trông như:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Bước 6: Cập nhật .env

Mở file `backend-node/.env` và sửa:

```properties
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

**Thay thế:**
- `admin` → username bạn tạo
- `YOUR_PASSWORD` → password bạn tạo
- `cluster0.xxxxx` → cluster name từ connection string

**Ví dụ:**
```properties
MONGODB_URI=mongodb+srv://admin:MySecurePassword123@cluster0.tqmq2ht.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

## Bước 7: Restart Backend

```bash
cd backend-node

# Stop server (Ctrl+C nếu đang chạy)

# Restart
npm run dev
```

## Bước 8: Kiểm tra kết nối

Nếu thành công, sẽ thấy trong logs:
```
Connected to MongoDB Atlas
Server running on port 3000
```

## Troubleshooting

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

### Lỗi: Database not found

**Nguyên nhân**: Database `qlbangdiem` chưa tồn tại

**Cách sửa**:
- MongoDB Atlas sẽ tự tạo database khi bạn insert dữ liệu lần đầu
- Hoặc tạo thủ công:
  1. Vào Clusters → Collections
  2. Click "Create Database"
  3. Database name: `qlbangdiem`
  4. Collection name: `activities` (hoặc tên khác)

### Lỗi: Connection timeout

**Nguyên nhân**: Mạng chậm hoặc MongoDB Atlas bị lỗi

**Cách sửa**:
1. Kiểm tra kết nối internet
2. Chờ vài phút rồi thử lại
3. Kiểm tra status MongoDB Atlas: https://status.mongodb.com/

## Kiểm tra kết nối từ Terminal

```bash
# Cài mongosh (nếu chưa có)
npm install -g mongosh

# Kết nối
mongosh "mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem"

# Nếu thành công, sẽ vào MongoDB shell
# Gõ: show collections
# Gõ: exit để thoát
```

## Bảo mật

⚠️ **Lưu ý quan trọng:**

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

## Sau khi cấu hình

✅ Backend sẽ kết nối MongoDB Atlas
✅ Frontend sẽ không còn lỗi 503
✅ Activity Editor có thể lưu dữ liệu
✅ Tất cả API sẽ hoạt động

## Liên quan

- Activity Editor: `/activities/new`
- Activities API: `GET /api/activities`
- Draft API: `POST /api/draft`
- Posts API: `POST /api/posts`

## Hỗ trợ

Nếu có vấn đề:
1. Kiểm tra logs backend
2. Kiểm tra MongoDB Atlas status
3. Kiểm tra connection string
4. Kiểm tra username/password
5. Kiểm tra IP whitelist

# Hướng dẫn Setup MongoDB cho Render

## Vấn đề
Trên Render, backend đang cố kết nối tới `mongodb://admin:password@mongodb:27017` (Docker local) nhưng service này không tồn tại trên Render.

## Giải pháp: Sử dụng MongoDB Atlas (Free)

### Bước 1: Tạo MongoDB Atlas Account

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí
3. Chọn **FREE tier** (M0 Sandbox - 512MB storage)

### Bước 2: Tạo Database Cluster

1. Sau khi đăng nhập, click **"Build a Database"**
2. Chọn **FREE** tier (M0)
3. Chọn region gần Việt Nam nhất (Singapore hoặc Mumbai)
4. Đặt tên cluster (ví dụ: `tvu-cluster`)
5. Click **"Create"**

### Bước 3: Tạo Database User

1. Trong phần **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Chọn **Password** authentication
4. Username: `tvu_admin` (hoặc tên bạn muốn)
5. Password: Tạo password mạnh (lưu lại để dùng sau)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### Bước 4: Whitelist IP Address

1. Trong phần **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Cần thiết vì Render có nhiều IP động
4. Click **"Confirm"**

### Bước 5: Lấy Connection String

1. Quay lại **Database** → Click **"Connect"** trên cluster của bạn
2. Chọn **"Connect your application"**
3. Driver: **Node.js**, Version: **4.1 or later**
4. Copy connection string, sẽ có dạng:
   ```
   mongodb+srv://tvu_admin:<password>@tvu-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Thay `<password>` bằng password thực tế của user
6. Thêm database name vào cuối:
   ```
   mongodb+srv://tvu_admin:your_password@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
   ```

### Bước 6: Cập nhật Environment Variables trên Render

#### Cho Backend Node.js:

1. Vào Render Dashboard → Chọn service **backend-node**
2. Vào tab **Environment**
3. Thêm/Cập nhật biến:
   ```
   MONGODB_URI=mongodb+srv://tvu_admin:your_password@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
   ```
4. Click **"Save Changes"**

#### Cho Backend Python:

1. Vào Render Dashboard → Chọn service **backend-python**
2. Vào tab **Environment**
3. Thêm/Cập nhật 2 biến:
   ```
   MONGODB_URL=mongodb+srv://tvu_admin:your_password@tvu-cluster.xxxxx.mongodb.net
   MONGODB_DB_NAME=tvu_documents
   ```
4. Click **"Save Changes"**

### Bước 7: Redeploy Services

Sau khi cập nhật environment variables, Render sẽ tự động redeploy. Nếu không:
1. Click **"Manual Deploy"** → **"Deploy latest commit"**

## Kiểm tra kết nối

Sau khi deploy xong, kiểm tra logs:
```bash
# Trên Render Dashboard → Service → Logs
# Tìm dòng: "MongoDB connected successfully" hoặc tương tự
```

## Lưu ý quan trọng

1. **Không commit connection string vào Git** - Chỉ lưu trong Environment Variables
2. **Free tier MongoDB Atlas**:
   - 512MB storage
   - Shared CPU
   - Đủ cho development/testing
3. **Connection string format**:
   - Docker local: `mongodb://user:pass@mongodb:27017/dbname`
   - MongoDB Atlas: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/dbname`

## Troubleshooting

### Lỗi: "Authentication failed"
- Kiểm tra username/password trong connection string
- Đảm bảo user có quyền read/write database

### Lỗi: "Connection timeout"
- Kiểm tra Network Access whitelist (phải có 0.0.0.0/0)
- Kiểm tra connection string có đúng format

### Lỗi: "Database not found"
- MongoDB Atlas tự động tạo database khi có data đầu tiên
- Không cần tạo database trước

## Cập nhật file .env local (không commit)

Để test với MongoDB Atlas ở local:

**backend-node/.env**:
```env
MONGODB_URI=mongodb+srv://tvu_admin:your_password@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
```

**backend-python/.env**:
```env
MONGODB_URL=mongodb+srv://tvu_admin:your_password@tvu-cluster.xxxxx.mongodb.net
MONGODB_DB_NAME=tvu_documents
```

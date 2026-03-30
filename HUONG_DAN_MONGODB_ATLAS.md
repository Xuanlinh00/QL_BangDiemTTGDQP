# Hướng Dẫn Setup MongoDB Atlas cho Render

## Bước 1: Tạo MongoDB Atlas (Miễn phí)

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí
3. Tạo cluster mới:
   - Chọn **FREE** tier (M0 Sandbox)
   - Chọn region gần Việt Nam: **Singapore (ap-southeast-1)**
   - Đặt tên cluster: `tvu-cluster`

## Bước 2: Cấu hình Database Access

1. Vào **Database Access** (menu bên trái)
2. Click **Add New Database User**
3. Tạo user:
   - Username: `tvu_admin`
   - Password: Tạo password mạnh (lưu lại)
   - Database User Privileges: **Read and write to any database**
4. Click **Add User**

## Bước 3: Cấu hình Network Access

1. Vào **Network Access** (menu bên trái)
2. Click **Add IP Address**
3. Chọn **Allow Access from Anywhere** (0.0.0.0/0)
   - Cần thiết cho Render vì IP động
4. Click **Confirm**

## Bước 4: Lấy Connection String

1. Vào **Database** → Click **Connect** trên cluster
2. Chọn **Connect your application**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy connection string, dạng:
   ```
   mongodb+srv://tvu_admin:<password>@tvu-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Thay `<password>` bằng password thực của user
6. Thêm database name vào cuối:
   ```
   mongodb+srv://tvu_admin:YOUR_PASSWORD@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
   ```

## Bước 5: Cấu hình Render

### Cách 1: Qua Dashboard (Dễ nhất)
1. Vào Render Dashboard
2. Chọn service **tvu-backend-node**
3. Vào **Environment** tab
4. Tìm biến `MONGODB_URI`
5. Paste connection string vừa copy
6. Click **Save Changes**
7. Service sẽ tự động redeploy

### Cách 2: Qua Render CLI
```bash
render env set MONGODB_URI="mongodb+srv://tvu_admin:YOUR_PASSWORD@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority" --service tvu-backend-node
```

## Bước 6: Kiểm tra

1. Đợi Render deploy xong
2. Kiểm tra logs: `https://dashboard.render.com/web/YOUR_SERVICE_ID/logs`
3. Tìm dòng: `Connected to MongoDB Atlas` ✓

## Lưu ý quan trọng

- ✅ MongoDB Atlas FREE tier: 512MB storage, đủ cho development
- ✅ Không cần credit card
- ✅ Tự động backup
- ⚠️ Connection string chứa password - KHÔNG commit vào git
- ⚠️ Nếu đổi password MongoDB, phải update lại MONGODB_URI trên Render

## Troubleshooting

### Lỗi: "MongoServerError: bad auth"
→ Sai username/password, kiểm tra lại connection string

### Lỗi: "MongooseServerSelectionError: connect ETIMEDOUT"
→ Chưa allow IP 0.0.0.0/0 trong Network Access

### Lỗi: "Authentication failed"
→ User chưa có quyền, vào Database Access → Edit User → Set quyền "Read and write to any database"

## Backend Python cũng cần MongoDB

Sau khi setup xong cho backend-node, làm tương tự cho backend-python:
1. Vào service **tvu-backend-python**
2. Set biến `MONGODB_URL` với cùng connection string
3. Set biến `MONGODB_DB_NAME=tvu_documents`

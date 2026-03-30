# Hướng Dẫn Deploy Lên Render - Hoàn Chỉnh

## ✅ Đã sửa trong code

1. **MongoDB optional**: Backend có thể chạy mà không cần MongoDB
2. **Middleware protection**: Tất cả routes cần MongoDB đều có middleware kiểm tra
3. **Graceful degradation**: Server trả về 503 khi MongoDB chưa kết nối thay vì crash

## 🚀 Các bước deploy

### Bước 1: Fix lỗi TypeScript Build

Trong Render Dashboard → Service **tvu-backend-node**:

#### Option A: Đổi Build Command (Khuyên dùng)
```bash
cd backend-node && npm install --include=dev && npm run build
```

#### Option B: Thêm Environment Variable cho Build
Thêm biến:
- Key: `NPM_CONFIG_PRODUCTION`
- Value: `false`

### Bước 2: Setup MongoDB Atlas (5 phút)

1. **Đăng ký MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
2. **Tạo cluster FREE**:
   - Tier: M0 Sandbox (miễn phí)
   - Region: Singapore (ap-southeast-1)
   - Tên: `tvu-cluster`

3. **Tạo Database User**:
   - Username: `tvu_admin`
   - Password: Tạo password mạnh (lưu lại)
   - Privileges: Read and write to any database

4. **Network Access**:
   - Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

5. **Lấy Connection String**:
   - Click Connect → Connect your application
   - Copy connection string:
   ```
   mongodb+srv://tvu_admin:<password>@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
   ```
   - Thay `<password>` bằng password thực

### Bước 3: Cấu hình Render Environment Variables

Vào Render Dashboard → Service **tvu-backend-node** → Environment:

#### Biến bắt buộc:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-random-32-chars>
MONGODB_URI=mongodb+srv://tvu_admin:YOUR_PASSWORD@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
```

#### Biến tùy chọn:
```
CORS_ORIGINS=https://tvu-frontend.onrender.com,http://localhost:5173
PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
LOG_LEVEL=info
```

### Bước 4: Deploy

1. Commit và push code lên GitHub
2. Vào Render Dashboard
3. Click **Manual Deploy** → **Deploy latest commit**
4. Xem logs

### Bước 5: Kiểm tra

Sau khi deploy xong, kiểm tra:

1. **Health check**: `https://tvu-backend-node.onrender.com/health`
   - Kết quả: `{"status":"ok"}`

2. **Root endpoint**: `https://tvu-backend-node.onrender.com/`
   - Kết quả: Thông tin API

3. **Logs**: Tìm dòng:
   ```
   ✓ Server running on port 3000
   ✓ Connected to MongoDB Atlas
   ```

## 🔧 Troubleshooting

### Lỗi: TypeScript build failed
→ Chắc chắn Build Command có `--include=dev`

### Lỗi: MongoDB connection timeout
→ Kiểm tra:
- Network Access đã allow 0.0.0.0/0
- Connection string đúng format
- Password không có ký tự đặc biệt (hoặc encode URL)

### Backend start nhưng MongoDB không kết nối
→ Không sao! Backend vẫn chạy được:
- Health check vẫn hoạt động
- Auth vẫn hoạt động
- Các routes cần MongoDB sẽ trả về 503

### Lỗi: CORS
→ Thêm domain frontend vào `CORS_ORIGINS`

## 📝 Lưu ý

1. **MongoDB Atlas FREE tier**:
   - 512MB storage
   - Đủ cho development/testing
   - Không cần credit card

2. **Connection string**:
   - KHÔNG commit vào git
   - Chỉ lưu trong Render Environment Variables

3. **Backend Python**:
   - Cũng cần MongoDB
   - Dùng cùng connection string
   - Set biến `MONGODB_URL` và `MONGODB_DB_NAME=tvu_documents`

4. **Render Free Tier**:
   - Service sleep sau 15 phút không dùng
   - Lần đầu truy cập sẽ chậm (cold start)
   - Đủ cho demo/testing

## 🎯 Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Backend deploy thành công
- ✅ Health check hoạt động
- ✅ MongoDB kết nối
- ✅ Auth hoạt động
- ✅ Tất cả API endpoints sẵn sàng

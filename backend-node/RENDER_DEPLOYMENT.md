# Hướng dẫn triển khai lên Render

## Bước 1: Chuẩn bị MongoDB Atlas
1. Đăng nhập vào [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo một cluster hoặc sử dụng cluster hiện có
3. Lấy connection string (MongoDB URI):
   - Chọn "Connect" → "Drivers"
   - Sao chép URI có dạng: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

## Bước 2: Deploy trên Render

### 2.1 Push code lên Git
```bash
git add .
git commit -m "Standardize backend for Render - MongoDB only"
git push origin feature-login  # hoặc branch hiện tại
```

### 2.2 Kết nối Render với GitHub
1. Đăng nhập vào [Render](https://render.com)
2. Tạo "New Web Service"
3. Kết nối với GitHub repository
4. Chọn branch (feature-login hoặc main)
5. Build command: `npm run build`
6. Start command: `npm start`
7. Root directory (nếu có): `backend-node`

### 2.3 Thiết lập Environment Variables trên Render
Trong Render Dashboard, đi đến "Environment" và thêm:

| Biến | Giá trị |
|------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | Sinh khóa mới - VD: `your-random-secret-key-min-32-characters` |
| `MONGODB_URI` | MongoDB connection string từ bước 1 |
| `CORS_ORIGINS` | `https://your-frontend-domain.com,http://localhost:5173` |
| `LOG_LEVEL` | `info` |

### 2.4 Deploy
- Render sẽ tự động deploy sau khi push code
- Kiểm tra logs: Render Dashboard → "Logs" tab
- Backend URL: `https://tvu-backend-node.onrender.com/`

## Kiểm tra Deploy
```bash
# Health check
curl https://tvu-backend-node.onrender.com/health

# Kiểm tra root endpoint
curl https://tvu-backend-node.onrender.com/
```

## Troubleshooting

### MongoDB Connection Error
- Kiểm tra `MONGODB_URI` có đúng không
- Đảm bảo MongoDB Atlas cho phép kết nối từ bất kỳ IP nào (0.0.0.0/0)
- Kiểm tra username/password không có ký tự đặc biệt cần encode

### Build Error
- Đảm bảo `npm run build` chạy được locally
- Kiểm tra TypeScript errors
- Xem logs trên Render

### CORS Error
- Cập nhật `CORS_ORIGINS` với domain frontend của bạn
- Đảm bảo domain không có `/` ở cuối

## Lưu ý quan trọng
- ✅ Chỉ sử dụng MongoDB (không PostgreSQL, Redis, S3)
- ✅ Mọi config đều qua environment variables
- ✅ Không hardcode secrets vào code
- ✅ MongoDB optional - server sẽ start ngay cả khi MongoDB chưa kết nối

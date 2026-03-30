# Hướng Dẫn Fix Lỗi Deploy Render - Tiếng Việt

## Vấn đề hiện tại

1. ❌ Build lỗi TypeScript: thiếu type definitions
2. ❌ Backend cần MongoDB nhưng chưa có

## Giải pháp - Làm theo thứ tự

### Bước 1: Fix lỗi TypeScript Build

Vào Render Dashboard → Service **tvu-backend-node** → Settings:

1. **Root Directory**: Để trống hoặc set `backend-node`
2. **Build Command**: Đổi thành:
   ```bash
   cd backend-node && npm install --include=dev && npm run build
   ```
3. **Start Command**: 
   ```bash
   cd backend-node && npm start
   ```

Hoặc thêm biến môi trường build:
- Key: `NPM_CONFIG_PRODUCTION`
- Value: `false`

### Bước 2: Setup MongoDB Atlas (MIỄN PHÍ)

Xem file `HUONG_DAN_MONGODB_ATLAS.md` để setup chi tiết.

Tóm tắt nhanh:
1. Đăng ký MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register
2. Tạo FREE cluster (M0) ở Singapore
3. Tạo database user
4. Allow IP: 0.0.0.0/0
5. Copy connection string
6. Paste vào Render Environment Variable `MONGODB_URI`

### Bước 3: Deploy lại

Sau khi setup xong:
1. Vào Render Dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Xem logs để kiểm tra

## Kết quả mong đợi

Logs sẽ hiển thị:
```
✓ Build succeeded
✓ Server running on port 3000
✓ Connected to MongoDB Atlas
```

## Nếu vẫn lỗi

### Lỗi TypeScript vẫn còn
→ Chắc chắn Build Command có `--include=dev`

### Lỗi MongoDB connection
→ Kiểm tra:
- Connection string đúng format
- Password không có ký tự đặc biệt (hoặc encode URL)
- Network Access đã allow 0.0.0.0/0
- Database user có quyền read/write

### Backend start nhưng crash ngay
→ Xem logs chi tiết, có thể thiếu biến môi trường khác

## Các biến môi trường cần thiết

Trong Render Environment Variables:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tvu_documents
JWT_SECRET=<generate-random-string>
CORS_ORIGINS=https://tvu-frontend.onrender.com
DATABASE_URL=<postgres-connection-string>
PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
```

## Lưu ý

- Code đã được sửa để backend có thể chạy mà không cần MongoDB (tạm thời)
- Nhưng một số tính năng sẽ không hoạt động nếu thiếu MongoDB
- Nên setup MongoDB Atlas ngay để đầy đủ chức năng

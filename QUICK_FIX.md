# 🚀 Fix Nhanh - Frontend Không Kết Nối Backend

## Vấn đề
Frontend đang cố kết nối `localhost:3000` nhưng backend đã ở trên Render.

## ✅ Đã sửa
File `frontend/.env` đã được cập nhật:
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
```

## 🔧 Làm ngay bây giờ

### Cách 1: Dùng script (Dễ nhất)
```bash
restart-frontend.bat
```

### Cách 2: Manual
```bash
# Stop frontend hiện tại (Ctrl+C nếu đang chạy)

# Restart
cd frontend
npm run dev
```

### Cách 3: Nếu đang dùng PowerShell
```powershell
cd frontend
npm run dev
```

## ✓ Kiểm tra

1. Mở browser: http://localhost:5173
2. Thử login:
   - Email: `admin@tvu.edu.vn`
   - Password: `password`
3. Nếu thành công → Done! ✅

## ⚠️ Nếu vẫn lỗi

### Lỗi CORS
Backend cần allow frontend domain.

**Fix:**
1. Vào Render Dashboard → tvu-backend-node
2. Environment → Thêm/sửa:
   ```
   CORS_ORIGINS=https://tvu-frontend.onrender.com,http://localhost:5173
   ```
3. Save Changes

### Lỗi 503 Database Unavailable
Backend chưa có MongoDB.

**Fix:**
Xem file `HUONG_DAN_MONGODB_ATLAS.md` để setup MongoDB Atlas (5 phút)

### Backend chậm (cold start)
Render FREE tier sleep sau 15 phút không dùng.

**Fix:**
Đợi 30-60 giây cho backend wake up, thử lại.

## 📊 Backend Status

Backend đang chạy tốt:
- ✅ Health: https://tvu-backend-node.onrender.com/health
- ✅ API: https://tvu-backend-node.onrender.com/api

## 💡 Tip

Nếu muốn chạy backend local thay vì dùng Render:
1. Đổi lại `.env`: `VITE_API_URL=http://localhost:3000/api`
2. Start backend local: `cd backend-node && npm run dev`
3. Restart frontend

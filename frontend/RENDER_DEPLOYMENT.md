# Hướng dẫn Deploy Frontend lên Render

## 📋 Yêu cầu
- Frontend code đã được chuẩn hóa với Dockerfile
- Backend đã deploy: https://one-nn3u.onrender.com/

## 🚀 Các bước Deploy

### 1. Cập nhật .env.local (local development)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_GOOGLE_DRIVE=true
```

### 2. Push code lên Git
```bash
git add .
git commit -m "Chỉnh sửa frontend cho Render - Backend URL: one-nn3u.onrender.com"
git push
```

### 3. Cấu hình trên Render Dashboard

#### 3.1 Tạo Web Service mới
1. Vào https://render.com
2. Click **New → Web Service**
3. Kết nối GitHub repository
4. Chọn branch chính (main hoặc feature-login)

#### 3.2 Cấu hình
- **Name:** `tvu-frontend` (hoặc tên khác)
- **Root Directory:** `frontend` *(hoặc để trống nếu Dockerfile ở root)*
- **Runtime:** `Docker`
- **Plan:** `Free` (hoặc cao hơn)

#### 3.3 Build & Start Commands
- **Build Command:** `docker build -t tvu-frontend .`
- **Start Command:** `docker run -p 3000:3000 tvu-frontend`

*Hoặc để Render tự động detect Dockerfile*

#### 3.4 Environment Variables
Không cần thêm biến vì `VITE_API_URL` đã được set trong `.env.example` làm default cho production.

Nếu muốn override, thêm:
```
VITE_API_URL=https://one-nn3u.onrender.com/api
```

### 4. Deploy
Render sẽ tự động build và deploy:
- 📦 Build sẽ chạy: `npm ci` → `npm run build` → Docker build
- 🚀 Frontend sẽ chạy trên: `https://your-frontend-name.onrender.com`

### 5. Kiểm tra
1. Truy cập frontend URL (Render sẽ gán)
2. Đăng nhập - kiểm tra API requests đi đến backend mới
3. Xem Developer Console → Network tab để confirm API_URL

## 🔧 Troubleshooting

### Port Error (Port 8080 not allowed)
- Dockerfile đã được cập nhật dùng port 3000 (mặc định Render)
- Không cần thay đổi

### API 404 Errors
- Kiểm tra `VITE_API_URL` có đúng không trong Network tab
- Chắc chắn backend https://one-nn3u.onrender.com/ đang chạy

### Build Fail
- Kiểm trap logs trên Render
- Chạy `npm run build` locally để kiểm tra TypeScript errors
- Đảm bảo tất cả dependencies đã cài đặt

### CORS Error
- Kiểm tra backend có set CORS cho frontend domain không
- Backend file: `backend-node/src/app.ts` → `CORS_ORIGINS`

## 📝 Ghi chú

- Frontend code đã được tối ưu cho Render
- Nginx để caching static assets (tăng tốc độ)
- React Router được cấu hình để hoạt động với SPA (Single Page App)
- `.env` được ignore từ git - Render sẽ dùng `.env.example` làm template

## ✅ Checklist
- [ ] Code push lên git
- [ ] Render Web Service được tạo
- [ ] Environment variables được thiết lập
- [ ] Build thành công
- [ ] Frontend URL hoạt động
- [ ] API requests đến backend mới

---

**Backend URL:** https://one-nn3u.onrender.com/
**Frontend URL:** `https://your-frontend-name.onrender.com` (sẽ được Render gán)

# 🚀 TVU GDQP-AN - Render Deployment Guide

## ✅ Trạng thái Deploy

| Component | URL | Status |
|-----------|-----|--------|
| **Backend** | https://one-nn3u.onrender.com/ | ✅ Deploy hoàn tất |
| **Frontend** | `Chưa deploy` | ⏳ Sẵn sàng đẩy lên |

---

## 📋 Điều kiện tiên quyết

### Backend (Node.js + MongoDB)
- ✅ Chuẩn hóa code cho Render
- ✅ Loại bỏ PostgreSQL, AWS S3, Redis
- ✅ Chỉ sử dụng MongoDB
- ✅ Dockerfile sẵn sàng
- ✅ Đã deploy: https://one-nn3u.onrender.com/

### Frontend (React + Vite)
- ✅ Chuẩn hóa .env cho Render
- ✅ Dockerfile sẵn sàng (nginx)
- ✅ Vite config cập nhật
- ✅ API URL trỏ đến backend mới

---

## 🎯 Bước tiếp theo - Deploy Frontend

### 1. Chuẩn bị Code
```bash
# Kiểm tra code đã push chưa
git status

# Nếu chưa, push lên
git add .
git commit -m "Standardize frontend for Render - Backend: one-nn3u.onrender.com"
git push origin feature-login  # hoặc main
```

### 2. Tạo Web Service trên Render
1. Vào https://dashboard.render.com
2. Click **New → Web Service**
3. Chọn GitHub repository: `Xuanlinh00/QL_BangDiemTTGDQP`
4. Chọn branch: `feature-login` hoặc `main`

### 3. Cấu hình Service
| Setting | Giá trị |
|---------|--------|
| **Name** | `tvu-frontend` |
| **Root Directory** | `frontend` |
| **Runtime** | `Docker` |
| **Region** | `Singapore` (gần nhất) |

### 4. Environment Variables (Render Dashboard)
Không cần thiết - đã được config trong `.env.example`

Nếu muốn thay đổi API URL:
```
VITE_API_URL=https://one-nn3u.onrender.com/api
```

### 5. Deploy
- Nhấn **Create Web Service**
- Render sẽ tự động build & deploy
- Chờ 5-10 phút

### 6. Kiểm tra
```bash
# Sau khi deploy, truy cập:
https://your-service-name.onrender.com

# Kiểm tra API requests đến backend mới
# Mở DevTools → Network tab
```

---

## 🔗 Cấu trúc Deployment

```
┌─────────────────────────────────────┐
│        React Frontend               │
│  https://tvu-frontend.onrender.com  │
└────────────┬────────────────────────┘
             │ API Calls (/api/...)
             ↓
┌─────────────────────────────────────┐
│      Express.js Backend             │
│  https://one-nn3u.onrender.com      │
└────────────┬────────────────────────┘
             │ Database Query
             ↓
┌─────────────────────────────────────┐
│      MongoDB Atlas Cloud            │
│  (Connection via MONGODB_URI)       │
└─────────────────────────────────────┘
```

---

## ⚙️ Environment Variables Checklist

### Backend (`backend-node`)
- ✅ `NODE_ENV` = `production`
- ✅ `PORT` = `3000`
- ✅ `JWT_SECRET` = *(random secret key)*
- ✅ `MONGODB_URI` = *(MongoDB connection string)*
- ✅ `CORS_ORIGINS` = *(frontend URL sẽ được thêm)*

### Frontend (`frontend`)
- ✅ `VITE_API_URL` = `https://one-nn3u.onrender.com/api`
- ✅ `VITE_APP_NAME` = `TVU GDQP-AN Admin Portal`
- ⚠️ `VITE_GOOGLE_*` = *(optional - nếu dùng Google Drive)*

---

## ✅ Final Checklist

- [ ] Backend đang chạy trên: https://one-nn3u.onrender.com/
- [ ] Frontend code đã push lên git
- [ ] Frontend Dockerfile & nginx.conf sẵn sàng
- [ ] `.env.example` có `VITE_API_URL` = backend URL mới
- [ ] Frontend Web Service được tạo trên Render
- [ ] Build & Deploy thành công
- [ ] Frontend URL hoạt động
- [ ] API requests đến backend mới
- [ ] Đăng nhập hoạt động bình thường
- [ ] Có thể lấy dữ liệu từ MongoDB thông qua backend

---

## 🆘 Troubleshooting

### Frontend không connect đến backend
- Kiểm tra `VITE_API_URL` ở DevTools Network tab
- Chắc chắn backend CORS config đúng domain frontend
- Check backend logs

### Build fail trên Render
- Xem logs: Render Dashboard → Logs tab
- Chạy `npm run build` locally để debug
- Đảm bảo `package-lock.json` đã commit

### 404 trên frontend
- Nginx đã được cấu hình cho React Router
- Refresh page → nếu 404 vẫn có, check nginx.conf

### MongoDB Connection Error
- Kiểm tra `MONGODB_URI` đúng không
- MongoDB Atlas cho phép IP 0.0.0.0/0
- Test connection locally

---

## 📚 Documents

- **Backend Deploy Guide:** `backend-node/RENDER_DEPLOYMENT.md`
- **Frontend Deploy Guide:** `frontend/RENDER_DEPLOYMENT.md`

---

## 🎉 Done!

Sau khi hoàn tất, bạn sẽ có:
- ✅ Backend API chạy trên Render
- ✅ Frontend app chạy trên Render
- ✅ MongoDB Atlas kết nối qua backend
- ✅ Production-ready deployment

**Chúc mừng! 🚀**

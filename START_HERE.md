# 🚀 Bắt Đầu Deploy Frontend lên Render

## 👋 Chào mừng!

Frontend của bạn đã được **chuẩn hóa hoàn toàn** để deploy lên Render.

## ⚡ Bắt Đầu Nhanh (3 bước)

### 1️⃣ Push lên Git (1 phút)

```bash
git add .
git commit -m "Prepare frontend for Render deployment"
git push origin main
```

### 2️⃣ Deploy lên Render (10 phút)

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Kết nối GitHub repository
4. Cấu hình:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
5. Thêm Environment Variables:
   ```
   VITE_API_URL=https://tvu-backend-node.onrender.com/api
   VITE_APP_NAME=TVU GDQP-AN Admin Portal
   VITE_ENABLE_EXCEL_EXPORT=true
   VITE_ENABLE_OCR=true
   VITE_DEBUG=false
   ```
6. Click **Create Web Service**

### 3️⃣ Xác Minh (5 phút)

1. Chờ build hoàn tất
2. Truy cập URL công khai
3. Kiểm tra trang login
4. Đăng nhập test

## 📚 Hướng Dẫn Chi Tiết

Nếu bạn cần hướng dẫn chi tiết, hãy đọc:

| Tài liệu | Nội dung |
|----------|---------|
| **[PUSH_TO_GIT_GUIDE.md](./PUSH_TO_GIT_GUIDE.md)** | Hướng dẫn push lên Git |
| **[READY_FOR_RENDER.md](./READY_FOR_RENDER.md)** | Xác nhận sẵn sàng + checklist |
| **[frontend/RENDER_DEPLOY_GUIDE.md](./frontend/RENDER_DEPLOY_GUIDE.md)** | Hướng dẫn chi tiết deploy |
| **[frontend/RENDER_CHECKLIST.md](./frontend/RENDER_CHECKLIST.md)** | Checklist trước/sau deploy |
| **[SUMMARY.md](./SUMMARY.md)** | Tóm tắt tất cả thay đổi |

## 🔑 Thông Tin Quan Trọng

### Backend URL
```
https://tvu-backend-node.onrender.com/api
```

### Database
```
MongoDB Atlas (Cloud)
```

### Environment Variables
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

## ✅ Các Tính Năng Hoạt động

- ✅ Login/Authentication
- ✅ Dashboard
- ✅ Documents management
- ✅ Decisions management
- ✅ Certificates
- ✅ Settings
- ✅ About page
- ✅ Excel export
- ✅ PDF preview

## ⚠️ Tính Năng Tùy Chọn

- Python API (TVU Extract) - cần deploy Python backend riêng
- Google Drive - cần cấu hình Google OAuth

## 🆘 Troubleshooting

### Trang trắng?
→ Mở DevTools (F12) → Console → Tìm lỗi

### CORS error?
→ Kiểm tra backend CORS configuration

### Build failed?
→ Kiểm tra Render logs

### API connection failed?
→ Kiểm tra backend URL có đúng không

## 📋 Checklist Nhanh

- ✅ Frontend đã được chuẩn hóa
- ✅ Không có lỗi TypeScript
- ✅ Build test đã pass
- ✅ Environment variables đã cấu hình
- ✅ Backend URL đã cấu hình
- ⏳ Sẵn sàng push lên Git
- ⏳ Sẵn sàng deploy lên Render

## 🎯 Bước Tiếp Theo

### Nếu bạn muốn bắt đầu ngay:
1. Chạy: `git add . && git commit -m "Prepare frontend for Render deployment" && git push origin main`
2. Vào Render Dashboard
3. Tạo Web Service mới
4. Kết nối GitHub
5. Cấu hình theo hướng dẫn trên

### Nếu bạn muốn đọc hướng dẫn chi tiết:
1. Đọc [PUSH_TO_GIT_GUIDE.md](./PUSH_TO_GIT_GUIDE.md)
2. Đọc [frontend/RENDER_DEPLOY_GUIDE.md](./frontend/RENDER_DEPLOY_GUIDE.md)
3. Đọc [frontend/RENDER_CHECKLIST.md](./frontend/RENDER_CHECKLIST.md)

## 💡 Mẹo

- Mỗi lần push code lên GitHub, Render sẽ tự động rebuild
- Không cần commit `.env` file (đã trong `.gitignore`)
- Chỉ cần điền environment variables trên Render Dashboard
- Build thường mất 5-10 phút

## 📞 Liên Hệ

Nếu gặp vấn đề:
1. Kiểm tra Render logs
2. Kiểm tra browser console
3. Đọc file hướng dẫn chi tiết
4. Kiểm tra backend hoạt động

## 🚀 Sẵn Sàng?

Hãy bắt đầu bằng cách chạy:

```bash
git add .
git commit -m "Prepare frontend for Render deployment"
git push origin main
```

Sau đó, vào [Render Dashboard](https://dashboard.render.com) để deploy!

---

**Chúc bạn deploy thành công!** 🎉

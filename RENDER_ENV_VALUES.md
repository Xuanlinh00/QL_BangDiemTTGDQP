# Environment Variables cho Render - Copy & Paste

## Frontend Service Environment Variables

Vào Render Dashboard → Frontend service → Tab Environment → Add:

```
VITE_API_URL=https://ql-bangdiemttgdqp-4.onrender.com/api
VITE_PYTHON_API_URL=https://ql-bangdiemttgdqp-4.onrender.com
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_GOOGLE_DRIVE=false
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

**Lưu ý:** Nếu bạn có backend Python riêng, thay URL `VITE_PYTHON_API_URL` bằng URL đó.

## Backend Node.js Service Environment Variables

Vào Render Dashboard → Backend service → Tab Environment → Add/Update:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here-change-this
CORS_ORIGINS=https://your-frontend-url.onrender.com
PYTHON_WORKER_URL=https://ql-bangdiemttgdqp-4.onrender.com
```

**Quan trọng:**
- Thay `MONGODB_URI` bằng connection string từ MongoDB Atlas
- Thay `CORS_ORIGINS` bằng URL frontend thực tế của bạn
- Thay `JWT_SECRET` bằng chuỗi random mạnh

## Backend Python Service (nếu có riêng)

```
MONGODB_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net
MONGODB_DB_NAME=tvu_documents
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
API_PORT=8000
```

## Các bước thực hiện

1. ✅ Copy các environment variables ở trên
2. ✅ Vào Render Dashboard
3. ✅ Chọn Frontend service → Environment tab
4. ✅ Paste các biến VITE_*
5. ✅ Click "Save Changes"
6. ✅ Chọn Backend service → Environment tab
7. ✅ Update CORS_ORIGINS với URL frontend
8. ✅ Update MONGODB_URI với MongoDB Atlas connection string
9. ✅ Click "Save Changes"
10. ✅ Cả 2 services sẽ tự động redeploy

## Kiểm tra sau khi deploy

1. Mở frontend URL
2. F12 → Console tab
3. Thử login
4. Kiểm tra Network tab xem request có gọi đúng `https://ql-bangdiemttgdqp-4.onrender.com/api/auth/login`

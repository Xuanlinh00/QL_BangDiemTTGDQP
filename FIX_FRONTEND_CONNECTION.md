# Fix Lỗi Frontend Không Kết Nối Được Backend

## Vấn đề

Frontend đang cố kết nối tới `localhost:3000` nhưng backend đã deploy lên Render.

Lỗi:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
localhost:3000/api/auth/login
```

## Giải pháp

### Trường hợp 1: Frontend đang chạy LOCAL (localhost:5173)

#### Bước 1: Cập nhật file `.env`

File `frontend/.env` đã được sửa thành:
```env
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
```

#### Bước 2: Restart frontend

**Windows:**
```bash
# Stop frontend (Ctrl+C)
# Restart
cd frontend
npm run dev
```

**Hoặc dùng PowerShell:**
```powershell
cd frontend
npm run dev
```

#### Bước 3: Test lại

Mở browser: http://localhost:5173
Login sẽ hoạt động!

### Trường hợp 2: Frontend đã deploy lên Render

#### Bước 1: Cập nhật Environment Variables trên Render

1. Vào Render Dashboard
2. Chọn service **tvu-frontend**
3. Vào tab **Environment**
4. Cập nhật:
   ```
   VITE_API_URL=https://tvu-backend-node.onrender.com/api
   VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
   ```
5. Click **Save Changes**
6. Render sẽ tự động redeploy

#### Bước 2: Đợi deploy xong

Kiểm tra logs, đợi build hoàn thành (~2-3 phút)

#### Bước 3: Test

Mở: https://tvu-frontend.onrender.com
Login sẽ hoạt động!

## Kiểm tra Backend CORS

Backend cần allow frontend domain. Kiểm tra trên Render:

### Backend Environment Variables

Đảm bảo có:
```
CORS_ORIGINS=https://tvu-frontend.onrender.com,http://localhost:5173
```

Nếu chưa có:
1. Vào Render Dashboard → **tvu-backend-node**
2. Tab **Environment**
3. Thêm/cập nhật `CORS_ORIGINS`
4. Save Changes

## Test Backend trực tiếp

Trước khi test frontend, kiểm tra backend hoạt động:

### 1. Health check
```
https://tvu-backend-node.onrender.com/health
```
Kết quả: `{"status":"ok"}`

### 2. Root endpoint
```
https://tvu-backend-node.onrender.com/
```
Kết quả: Thông tin API

### 3. Test login (dùng curl hoặc Postman)
```bash
curl -X POST https://tvu-backend-node.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tvu.edu.vn","password":"password"}'
```

Kết quả: Token và user info

## Troubleshooting

### Lỗi: CORS error
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Giải pháp:**
- Thêm frontend domain vào `CORS_ORIGINS` trên backend
- Format: `https://tvu-frontend.onrender.com,http://localhost:5173`

### Lỗi: 503 Service Unavailable
```
{"success":false,"error":{"code":"DATABASE_UNAVAILABLE"}}
```

**Giải pháp:**
- Backend chưa kết nối MongoDB
- Setup MongoDB Atlas (xem `HUONG_DAN_MONGODB_ATLAS.md`)
- Cập nhật `MONGODB_URI` trên Render

### Lỗi: Backend cold start chậm
```
Request timeout after 30s
```

**Giải pháp:**
- Render FREE tier: service sleep sau 15 phút
- Lần đầu truy cập chậm 30-60 giây
- Đợi backend wake up, thử lại

### Frontend vẫn kết nối localhost

**Nguyên nhân:**
- Chưa restart frontend sau khi đổi .env
- Browser cache

**Giải pháp:**
```bash
# Stop frontend (Ctrl+C)
cd frontend
npm run dev
# Hard refresh browser (Ctrl+Shift+R)
```

## Kết quả mong đợi

Sau khi fix:
- ✅ Frontend kết nối được backend trên Render
- ✅ Login thành công
- ✅ Không còn lỗi ERR_CONNECTION_REFUSED
- ✅ API calls hoạt động bình thường

## Lưu ý

1. **Local development:**
   - Dùng `http://localhost:3000/api` nếu chạy backend local
   - Dùng `https://tvu-backend-node.onrender.com/api` nếu dùng backend trên Render

2. **Production:**
   - Luôn dùng HTTPS URLs
   - Cập nhật CORS_ORIGINS trên backend

3. **Environment files:**
   - `.env` cho local development
   - Render Environment Variables cho production
   - KHÔNG commit `.env` vào git (đã có trong .gitignore)

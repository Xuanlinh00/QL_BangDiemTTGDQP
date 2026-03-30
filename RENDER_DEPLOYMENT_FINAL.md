# Hướng dẫn Deploy Toàn bộ Project lên Render

## Tóm tắt

Project đã được chuẩn hóa để deploy lên Render với:
- **Backend**: Node.js + MongoDB (đã deploy tại `https://tvu-backend-node.onrender.com`)
- **Frontend**: React + Vite (sẽ deploy tại Render)
- **Database**: MongoDB Atlas (cloud)

## Cấu trúc Project

```
project/
├── backend-node/          # Node.js backend (đã deploy)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── render.yaml
├── frontend/              # React frontend (chuẩn bị deploy)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   ├── .env.production
│   ├── Dockerfile.render
│   ├── RENDER_DEPLOY_GUIDE.md
│   ├── RENDER_SETUP_GUIDE.md
│   └── RENDER_CHECKLIST.md
└── backend-python/        # Python backend (tùy chọn)
    ├── app/
    ├── requirements.txt
    └── Dockerfile
```

## Các bước Deploy

### 1. Chuẩn bị Backend (Đã hoàn tất)

Backend Node.js đã được deploy lên Render tại:
```
https://tvu-backend-node.onrender.com/api
```

**Kiểm tra backend hoạt động:**
```bash
curl https://tvu-backend-node.onrender.com/api/health
```

### 2. Chuẩn bị Frontend

#### 2.1 Kiểm tra cấu hình

```bash
cd frontend
cat .env.example
cat .env.production
```

Đảm bảo `.env.production` có:
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
```

#### 2.2 Test build locally

```bash
cd frontend
npm install
npm run build
npm run preview
```

Truy cập `http://localhost:5173` để test

#### 2.3 Commit và push

```bash
git add .
git commit -m "Prepare frontend for Render deployment"
git push origin main
```

### 3. Deploy Frontend lên Render

#### 3.1 Tạo Web Service

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Kết nối GitHub repository
4. Chọn branch `main`

#### 3.2 Cấu hình

**Thông tin cơ bản:**
- **Name**: `tvu-frontend`
- **Root Directory**: `frontend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`

**Environment Variables:**
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

#### 3.3 Deploy

1. Click **Create Web Service**
2. Chờ build hoàn tất (5-10 phút)
3. Render sẽ cấp URL công khai

### 4. Xác minh Deploy

#### 4.1 Kiểm tra Frontend

1. Truy cập URL công khai của frontend
2. Trang login phải hiển thị đúng
3. Mở DevTools (F12) → Console
4. Không có lỗi JavaScript

#### 4.2 Kiểm tra API Connection

1. Đăng nhập bằng tài khoản test
2. Kiểm tra các trang chính
3. Mở DevTools → Network tab
4. Kiểm tra API calls đến backend
5. Không có lỗi CORS

#### 4.3 Kiểm tra Logs

1. Vào Render Dashboard → Web Service → Logs
2. Không có lỗi build
3. Không có lỗi runtime

## Cấu hình MongoDB Atlas

Database đã được cấu hình trên MongoDB Atlas. Backend sử dụng:
```
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]
```

**Kiểm tra connection:**
```bash
# Trên backend
curl https://tvu-backend-node.onrender.com/api/health
```

## Troubleshooting

### Lỗi Build

**Lỗi**: `npm ERR! code ERESOLVE`
- Xóa `package-lock.json` và push lại

**Lỗi**: `Cannot find module`
- Chạy `npm install` locally
- Kiểm tra `package.json`

### Lỗi Runtime

**Lỗi**: `CORS error`
- Kiểm tra backend CORS configuration
- Đảm bảo backend cho phép origin của frontend

**Lỗi**: `Cannot GET /`
- Kiểm tra `npm run preview` chạy đúng cách
- Kiểm tra build output

### Lỗi API Connection

**Lỗi**: `Failed to fetch`
- Kiểm tra backend URL có đúng không
- Kiểm tra backend có hoạt động không
- Kiểm tra network connection

## Cập nhật sau Deploy

Mỗi khi push code lên GitHub:
1. Render sẽ tự động detect thay đổi
2. Tự động build và deploy
3. Không cần làm gì thêm

## Tối ưu hóa

### Frontend

- Code splitting đã được cấu hình
- Minification bật mặc định
- Source maps tắt trong production

### Backend

- Đã cấu hình CORS
- Đã cấu hình MongoDB connection pooling
- Đã cấu hình environment variables

## Liên kết Hữu ích

- [Render Dashboard](https://dashboard.render.com)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)

## Ghi chú Quan trọng

1. **Không commit `.env` file** - Đã trong `.gitignore`
2. **Chỉ điền environment variables trên Render** - Không commit vào Git
3. **Backend URL** - `https://tvu-backend-node.onrender.com/api`
4. **Database** - MongoDB Atlas (cloud)
5. **Mỗi lần push** - Render sẽ tự động rebuild

## Danh sách File Chuẩn hóa

### Frontend

- ✅ `.env.example` - Cập nhật
- ✅ `.env.production` - Tạo mới
- ✅ `vite.config.ts` - Cập nhật
- ✅ `package.json` - Không thay đổi
- ✅ `Dockerfile.render` - Tạo mới
- ✅ `.dockerignore` - Cập nhật
- ✅ `RENDER_DEPLOY_GUIDE.md` - Tạo mới
- ✅ `RENDER_SETUP_GUIDE.md` - Tạo mới
- ✅ `RENDER_CHECKLIST.md` - Tạo mới

### Backend

- ✅ Đã deploy lên Render
- ✅ MongoDB connection đã cấu hình
- ✅ CORS đã cấu hình

## Bước Tiếp Theo

1. Kiểm tra tất cả file chuẩn hóa
2. Test build locally
3. Commit và push lên GitHub
4. Deploy frontend lên Render
5. Xác minh deploy
6. Cập nhật DNS (nếu cần)

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra Render logs
2. Kiểm tra browser console
3. Kiểm tra network tab
4. Đọc file hướng dẫn chi tiết trong `frontend/`

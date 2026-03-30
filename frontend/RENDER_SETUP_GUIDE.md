# Hướng dẫn Chuẩn hóa Frontend cho Render

## Tóm tắt thay đổi

Frontend đã được chuẩn hóa để deploy lên Render với các thay đổi sau:

### 1. **Loại bỏ Python API (Tùy chọn)**
- File `TVUExtract.tsx` vẫn hỗ trợ Python API cho development local
- Trên Render, trang này sẽ hiển thị "API offline" nếu không có Python server
- Để sử dụng OCR trên Render, cần deploy Python backend riêng

### 2. **Loại bỏ Google Drive (Tùy chọn)**
- Các file liên quan đến Google Drive vẫn tồn tại nhưng không bắt buộc
- Nếu không cần Google Drive, có thể xóa:
  - `frontend/src/hooks/useGoogleDrive.ts`
  - `frontend/src/components/DocumentUpload/GoogleDriveModal.tsx`
  - Các tham chiếu trong `frontend/src/pages/Documents.tsx`

### 3. **Cấu hình Environment Variables**

**File `.env.example`** - Đã cập nhật để chỉ chứa:
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

**File `.env.production`** - Tạo mới cho Render:
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

### 4. **Cấu hình Build**

**File `vite.config.ts`** - Đã cập nhật:
- Thêm cấu hình `server` cho development
- Thêm cấu hình `build` với code splitting
- Thêm cấu hình `preview` cho production

### 5. **File mới được tạo**

- `frontend/.env.production` - Environment variables cho production
- `frontend/render.yaml` - Cấu hình Render (tùy chọn)
- `frontend/Dockerfile.render` - Docker image cho Render (tùy chọn)
- `frontend/RENDER_DEPLOY_GUIDE.md` - Hướng dẫn deploy chi tiết

## Các bước chuẩn bị trước khi push lên Git

### 1. Kiểm tra dependencies

```bash
cd frontend
npm install
```

### 2. Test build locally

```bash
npm run build
npm run preview
```

### 3. Kiểm tra environment variables

Đảm bảo `.env.production` có đúng backend URL:
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
```

### 4. Commit và push

```bash
git add .
git commit -m "Prepare frontend for Render deployment"
git push origin main
```

## Cấu hình trên Render

### Tùy chọn 1: Sử dụng GitHub Integration (Khuyến nghị)

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Kết nối GitHub repository
4. Chọn branch `main`
5. Cấu hình:
   - **Name**: `tvu-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Environment Variables**: (xem bên dưới)

### Tùy chọn 2: Sử dụng Docker

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Kết nối GitHub repository
4. Cấu hình:
   - **Name**: `tvu-frontend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `frontend/Dockerfile.render`

### Environment Variables trên Render

Thêm các biến sau:

```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

## Xác minh sau Deploy

1. **Kiểm tra URL công khai**
   - Truy cập URL được cấp bởi Render
   - Trang login phải hiển thị đúng

2. **Kiểm tra API connection**
   - Đăng nhập bằng tài khoản test
   - Kiểm tra các trang chính (Dashboard, Documents, etc.)
   - Xem console browser để phát hiện lỗi CORS

3. **Kiểm tra build logs**
   - Vào Render Dashboard → Web Service → Logs
   - Tìm lỗi build hoặc runtime

## Troubleshooting

### Lỗi: "Cannot find module"

**Nguyên nhân**: Dependencies không được cài đặt đúng

**Giải pháp**:
1. Xóa `package-lock.json`
2. Commit và push lại
3. Render sẽ tự động rebuild

### Lỗi: "CORS error"

**Nguyên nhân**: Backend không cho phép origin của frontend

**Giải pháp**:
1. Kiểm tra backend CORS configuration
2. Đảm bảo backend cho phép origin của frontend Render
3. Ví dụ: `https://tvu-frontend.onrender.com`

### Lỗi: "Build failed"

**Giải pháp**:
1. Kiểm tra build logs trên Render
2. Chạy `npm run build` locally để test
3. Kiểm tra TypeScript errors: `npm run build`

### Trang trắng sau deploy

**Nguyên nhân**: Có thể là lỗi JavaScript hoặc API connection

**Giải pháp**:
1. Mở DevTools (F12) → Console
2. Tìm lỗi JavaScript
3. Kiểm tra Network tab để xem API calls
4. Kiểm tra `VITE_API_URL` có đúng không

## Tối ưu hóa Performance

### 1. Code Splitting
- Đã cấu hình trong `vite.config.ts`
- Các vendor libraries được tách riêng

### 2. Minification
- Bật mặc định trong build production

### 3. Source Maps
- Tắt trong production để giảm kích thước bundle

## Cập nhật sau Deploy

Mỗi khi push code lên GitHub:
1. Render sẽ tự động detect thay đổi
2. Tự động build và deploy
3. Không cần làm gì thêm

## Liên kết hữu ích

- [Render Documentation](https://render.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Deployment](https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

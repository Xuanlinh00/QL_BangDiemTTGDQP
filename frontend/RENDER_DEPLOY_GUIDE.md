# Hướng dẫn Deploy Frontend lên Render

## Chuẩn bị

1. **Đảm bảo backend đã deploy**: https://tvu-backend-node.onrender.com/
2. **Có tài khoản Render**: https://render.com

## Các bước Deploy

### 1. Chuẩn bị Repository

```bash
# Đảm bảo tất cả file đã được commit
git add .
git commit -m "Prepare frontend for Render deployment"
git push origin main
```

### 2. Tạo Web Service trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Kết nối GitHub repository của bạn
4. Chọn branch `main`

### 3. Cấu hình Web Service

**Thông tin cơ bản:**
- **Name**: `tvu-frontend` (hoặc tên khác)
- **Root Directory**: `frontend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`

**Environment Variables:**

Thêm các biến sau (hoặc để trống để sử dụng giá trị mặc định):

```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
VITE_ENABLE_EXCEL_EXPORT=true
VITE_ENABLE_OCR=true
VITE_DEBUG=false
```

**Plan**: Chọn `Free` hoặc `Paid` tùy theo nhu cầu

### 4. Deploy

1. Click **Create Web Service**
2. Render sẽ tự động build và deploy
3. Chờ khoảng 5-10 phút để build hoàn tất
4. Khi hoàn tất, bạn sẽ nhận được URL công khai

## Xác minh Deploy

1. Truy cập URL công khai của frontend
2. Kiểm tra:
   - Trang login hiển thị đúng
   - Có thể đăng nhập (nếu backend hoạt động)
   - Không có lỗi CORS

## Troubleshooting

### Lỗi Build

**Lỗi**: `npm ERR! code ERESOLVE`
- **Giải pháp**: Xóa `package-lock.json` và push lại

**Lỗi**: `Cannot find module`
- **Giải pháp**: Đảm bảo tất cả dependencies trong `package.json` đã được cài đặt

### Lỗi Runtime

**Lỗi**: `CORS error` khi gọi API
- **Giải pháp**: Kiểm tra backend đã cấu hình CORS đúng
- **Kiểm tra**: Backend phải cho phép origin của frontend

**Lỗi**: `Cannot GET /`
- **Giải pháp**: Đảm bảo `npm run preview` chạy đúng cách

## Cập nhật sau Deploy

Mỗi khi bạn push code lên GitHub:

1. Render sẽ tự động detect thay đổi
2. Tự động build và deploy phiên bản mới
3. Không cần làm gì thêm

## Tối ưu hóa

### Giảm thời gian build

- Xóa `node_modules` cũ trước khi push
- Sử dụng `.dockerignore` để loại bỏ file không cần thiết

### Giảm kích thước bundle

- Hiện tại đã cấu hình code splitting trong `vite.config.ts`
- Tesseract.js sẽ được lazy load khi cần

## Liên kết hữu ích

- [Render Documentation](https://render.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [React Deployment](https://react.dev/learn/start-a-new-react-project#production-grade-react-frameworks)

# Render Deployment Checklist - Frontend

## Trước khi Push lên Git

- [ ] Đã cập nhật `.env.example` - chỉ chứa MongoDB backend URL
- [ ] Đã tạo `.env.production` với backend URL: `https://tvu-backend-node.onrender.com/api`
- [ ] Đã cập nhật `vite.config.ts` với cấu hình production
- [ ] Đã test build locally: `npm run build`
- [ ] Đã test preview: `npm run preview`
- [ ] Không có lỗi TypeScript: `npm run build` không báo lỗi
- [ ] Đã xóa `node_modules` cũ (nếu cần)
- [ ] Đã commit tất cả file: `git add .`
- [ ] Đã push lên GitHub: `git push origin main`

## Cấu hình trên Render

### Tạo Web Service

- [ ] Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
- [ ] Click **New +** → **Web Service**
- [ ] Kết nối GitHub repository
- [ ] Chọn branch: `main`
- [ ] Chọn repository: `<your-repo-name>`

### Cấu hình Build

- [ ] **Name**: `tvu-frontend` (hoặc tên khác)
- [ ] **Root Directory**: `frontend`
- [ ] **Runtime**: `Node`
- [ ] **Build Command**: `npm install && npm run build`
- [ ] **Start Command**: `npm run preview`

### Environment Variables

Thêm các biến sau:

- [ ] `VITE_API_URL` = `https://tvu-backend-node.onrender.com/api`
- [ ] `VITE_APP_NAME` = `TVU GDQP-AN Admin Portal`
- [ ] `VITE_ENABLE_EXCEL_EXPORT` = `true`
- [ ] `VITE_ENABLE_OCR` = `true`
- [ ] `VITE_DEBUG` = `false`

### Plan & Deploy

- [ ] Chọn Plan: `Free` hoặc `Paid`
- [ ] Click **Create Web Service**
- [ ] Chờ build hoàn tất (5-10 phút)

## Sau khi Deploy

### Xác minh

- [ ] Truy cập URL công khai của frontend
- [ ] Trang login hiển thị đúng
- [ ] Không có lỗi JavaScript (F12 → Console)
- [ ] Có thể đăng nhập (nếu backend hoạt động)
- [ ] Các trang chính hoạt động (Dashboard, Documents, etc.)

### Kiểm tra Logs

- [ ] Vào Render Dashboard → Web Service → Logs
- [ ] Không có lỗi build
- [ ] Không có lỗi runtime

### Kiểm tra API Connection

- [ ] Mở DevTools (F12) → Network tab
- [ ] Kiểm tra API calls đến backend
- [ ] Không có lỗi CORS
- [ ] Không có lỗi 404 hoặc 500

## Troubleshooting

### Nếu Build Failed

- [ ] Kiểm tra build logs trên Render
- [ ] Chạy `npm run build` locally để test
- [ ] Kiểm tra TypeScript errors
- [ ] Xóa `package-lock.json` và push lại

### Nếu Trang Trắng

- [ ] Mở DevTools → Console
- [ ] Tìm lỗi JavaScript
- [ ] Kiểm tra Network tab
- [ ] Kiểm tra `VITE_API_URL` có đúng không

### Nếu CORS Error

- [ ] Kiểm tra backend CORS configuration
- [ ] Đảm bảo backend cho phép origin của frontend
- [ ] Ví dụ: `https://tvu-frontend.onrender.com`

### Nếu API Connection Failed

- [ ] Kiểm tra backend đã deploy lên Render chưa
- [ ] Kiểm tra backend URL có đúng không
- [ ] Kiểm tra backend có hoạt động không

## Cập nhật sau Deploy

- [ ] Mỗi khi push code lên GitHub, Render sẽ tự động rebuild
- [ ] Không cần làm gì thêm
- [ ] Chỉ cần chờ build hoàn tất

## Liên kết Hữu ích

- [Render Dashboard](https://dashboard.render.com)
- [Render Documentation](https://render.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

## Ghi chú

- Backend URL: `https://tvu-backend-node.onrender.com/api`
- Frontend sẽ được deploy tại: `https://tvu-frontend.onrender.com` (hoặc URL khác)
- Mỗi lần push code, Render sẽ tự động rebuild và deploy
- Không cần commit `.env` file (đã trong `.gitignore`)

# ✅ Checklist Deploy Render

## Chuẩn bị (Local)

- [ ] Test build local: Chạy `test-build.bat` (Windows) hoặc `bash test-build.sh` (Linux/Mac)
- [ ] Build thành công không có lỗi TypeScript
- [ ] Commit tất cả thay đổi (đặc biệt là package.json và render.yaml)
- [ ] Push lên GitHub

## MongoDB Atlas Setup

- [ ] Đăng ký tài khoản MongoDB Atlas
- [ ] Tạo cluster FREE (M0) ở Singapore
- [ ] Tạo database user với quyền read/write
- [ ] Allow IP 0.0.0.0/0 trong Network Access
- [ ] Copy connection string
- [ ] Test connection string (optional)

## Render Backend Node Setup

### Build Settings (Không cần thay đổi nếu dùng render.yaml)
- [ ] Service đã được tạo từ render.yaml
- [ ] Hoặc manual setup:
  - Root Directory: để trống
  - Build Command: `cd backend-node && npm ci && npm run build`
  - Start Command: `cd backend-node && npm start`

### Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `JWT_SECRET` = `<random-32-chars>`
- [ ] `MONGODB_URI` = `mongodb+srv://...` (từ Atlas)
- [ ] `CORS_ORIGINS` = `https://your-frontend.onrender.com`
- [ ] `PYTHON_WORKER_URL` = `https://your-python-backend.onrender.com`

## Deploy & Test

- [ ] Click "Manual Deploy" trên Render
- [ ] Đợi build hoàn thành (3-5 phút)
- [ ] Kiểm tra logs không có lỗi
- [ ] Test health check: `https://your-backend.onrender.com/health`
- [ ] Test root endpoint: `https://your-backend.onrender.com/`
- [ ] Logs hiển thị "Connected to MongoDB Atlas"

## Backend Python Setup (Optional)

- [ ] Deploy backend Python
- [ ] Set `MONGODB_URL` = cùng connection string
- [ ] Set `MONGODB_DB_NAME` = `tvu_documents`
- [ ] Test health check

## Frontend Setup

- [ ] Update `VITE_API_URL` trong frontend env
- [ ] Deploy frontend
- [ ] Test login
- [ ] Test các tính năng chính

## Troubleshooting

Nếu có lỗi, kiểm tra:
- [ ] Logs trên Render Dashboard
- [ ] Environment variables đúng format
- [ ] MongoDB connection string đúng
- [ ] Network Access đã allow 0.0.0.0/0
- [ ] Build command có `--include=dev`

## Ghi chú

- MongoDB Atlas FREE: 512MB, đủ cho dev/test
- Render FREE: Service sleep sau 15 phút không dùng
- Cold start lần đầu có thể chậm 30-60 giây
- Connection string KHÔNG commit vào git

## Kết quả mong đợi

✅ Backend chạy ổn định
✅ MongoDB kết nối thành công
✅ API endpoints hoạt động
✅ Frontend kết nối được backend
✅ Auth hoạt động
✅ Upload/download files hoạt động

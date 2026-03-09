# 🚀 Quick Start - TVU GDQP-AN Admin Portal

## ⚡ 5 phút để khởi động

### Bước 1: Khởi động Docker (1 phút)

```bash
docker-compose up -d
```

Chờ cho đến khi tất cả services khởi động:
```bash
docker-compose ps
```

### Bước 2: Khởi động Frontend (2 phút)

```bash
cd frontend
npm install
npm run dev
```

Mở browser: http://localhost:5173

### Bước 3: Khởi động Backend (1 phút)

```bash
cd backend-node
npm install
npm run dev
```

Backend API: http://localhost:3000

### Bước 4: Đăng nhập

```
Email: admin@tvu.edu.vn
Password: password
```

### Bước 5: Truy cập pgAdmin4 (tùy chọn)

```
URL: http://localhost:5050
Email: admin@tvu.edu.vn
Password: password
```

## 📍 Các URL chính

| Service | URL | Mục đích |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Giao diện chính |
| Backend API | http://localhost:3000 | API endpoints |
| Python API | http://localhost:8000 | OCR & Extract |
| pgAdmin4 | http://localhost:5050 | Database management |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## 🎯 Các tính năng chính

### 1. Tải tài liệu lên
```
Documents → Tải lên → Chọn file → Tải lên
```

### 2. Lấy từ Google Drive
```
Documents → Google Drive → Chọn file → Nhập
```

### 3. Xuất Excel
```
Documents → Xuất Excel → Download
```

### 4. Xem Dashboard
```
Dashboard → Xem thống kê, biểu đồ
```

### 5. Quản lý dữ liệu
```
Data → Sinh viên/Điểm số → Sửa/Xóa
```

## 🔧 Các lệnh hữu ích

### Docker

```bash
# Khởi động tất cả
docker-compose up -d

# Dừng tất cả
docker-compose down

# Xem logs
docker-compose logs -f

# Restart service
docker-compose restart postgres

# Xóa volume (reset database)
docker-compose down -v
```

### Frontend

```bash
# Khởi động dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Backend

```bash
# Khởi động dev server
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## 🐛 Khắc phục nhanh

### Frontend không tải
```bash
cd frontend
rm -rf node_modules/.vite
npm install
npm run dev
```

### Backend lỗi
```bash
docker-compose logs backend-node
docker-compose restart backend-node
```

### Database lỗi
```bash
docker-compose down -v
docker-compose up -d
```

### pgAdmin4 không kết nối
```bash
docker-compose restart pgadmin
```

## 📊 Kiểm tra status

```bash
# Kiểm tra tất cả services
docker-compose ps

# Kiểm tra logs
docker-compose logs

# Kiểm tra network
docker network ls

# Kiểm tra volumes
docker volume ls
```

## 🔐 Thông tin đăng nhập

### Frontend
- Email: admin@tvu.edu.vn
- Password: password

### pgAdmin4
- Email: admin@tvu.edu.vn
- Password: password

### PostgreSQL
- Host: localhost
- Port: 5432
- User: admin
- Password: password
- Database: tvu_gdqp_admin

### App User (Backend)
- User: app_user
- Password: app_password

## 📝 Các file quan trọng

| File | Mục đích |
|------|---------|
| docker-compose.yml | Docker configuration |
| frontend/src/pages/Documents.tsx | Tải tài liệu |
| frontend/src/utils/excelExport.ts | Xuất Excel |
| backend-node/src/database/init.sql | Database schema |
| DATABASE_GUIDE.md | Database documentation |
| PGADMIN_SETUP.md | pgAdmin4 guide |

## 🎓 Tiếp theo

1. **Tùy chỉnh giao diện**
   - Sửa logo, màu sắc
   - Thêm/xóa tính năng
   - Dịch sang ngôn ngữ khác

2. **Cấu hình Google Drive**
   - Tạo Google Cloud Project
   - Bật Google Drive API
   - Cấu hình OAuth2

3. **Cấu hình OCR**
   - Cài đặt Tesseract
   - Hoặc sử dụng EasyOCR
   - Tuning parameters

4. **Triển khai Production**
   - Cấu hình HTTPS
   - Setup backup
   - Monitoring & alerting

## 💡 Mẹo

1. **Lưu thời gian**: Sử dụng Docker để tránh cài đặt thủ công
2. **Kiểm tra logs**: Luôn xem logs khi gặp lỗi
3. **Backup database**: Thường xuyên backup dữ liệu
4. **Update dependencies**: Cập nhật npm packages định kỳ
5. **Sử dụng pgAdmin4**: Quản lý database dễ dàng hơn

## 🆘 Cần giúp?

1. Xem [DATABASE_GUIDE.md](DATABASE_GUIDE.md)
2. Xem [PGADMIN_SETUP.md](PGADMIN_SETUP.md)
3. Xem [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
4. Kiểm tra logs: `docker-compose logs`

## ✅ Checklist

- [ ] Docker khởi động thành công
- [ ] Frontend chạy tại http://localhost:5173
- [ ] Backend chạy tại http://localhost:3000
- [ ] Đăng nhập thành công
- [ ] Xem Dashboard
- [ ] Tải tài liệu lên
- [ ] Xuất Excel
- [ ] Truy cập pgAdmin4

## 🎉 Hoàn thành!

Bạn đã sẵn sàng sử dụng TVU GDQP-AN Admin Portal!

```
Frontend:     http://localhost:5173
Backend API:  http://localhost:3000
pgAdmin4:     http://localhost:5050
```

**Chúc bạn sử dụng hệ thống thành công! 🚀**

---

**Lưu ý:** Nếu gặp vấn đề, hãy:
1. Kiểm tra logs
2. Restart services
3. Reset database nếu cần
4. Xem tài liệu chi tiết

# Các Bước Tiếp Theo

## ✅ Đã Hoàn Thành

- ✅ Tạo Dockerfile cho frontend, backend-node, backend-python
- ✅ Cấu hình docker-compose.yml với 8 services
- ✅ Build thành công tất cả images
- ✅ Backend Python đã chạy (port 8000)
- ✅ Databases đã chạy (MongoDB, PostgreSQL, Redis)

## ⚠️ Cần Sửa

### 1. Port 3000 đã được sử dụng

Backend Node.js development đang chạy trên port 3000, cần dừng lại.

**Giải pháp nhanh:**

```bash
# Chạy script tự động sửa lỗi
scripts\fix-docker.bat
```

**Hoặc thủ công:**

```bash
# Dừng Node.js processes
taskkill /IM node.exe /F

# Khởi động lại Docker
docker-compose down
docker-compose up -d
```

### 2. Backend Python cần file .env

Tạo file `backend-python/.env`:

```env
MONGODB_URL=mongodb://admin:password@mongodb:27017
MONGODB_DB_NAME=tvu_documents
GEMINI_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
API_PORT=8000
```

Script `fix-docker.bat` sẽ tự động tạo file này.

## 🚀 Chạy Ngay

### Cách 1: Tự động (Khuyến nghị)

```bash
scripts\fix-docker.bat
```

### Cách 2: Thủ công

```bash
# 1. Dừng development processes
taskkill /IM node.exe /F

# 2. Tạo backend-python/.env (xem nội dung ở trên)

# 3. Restart Docker
docker-compose down
docker-compose up -d

# 4. Xem logs
docker-compose logs -f
```

## 📊 Kiểm Tra

Sau khi chạy, kiểm tra các URL sau:

- ✅ Frontend: http://localhost
- ✅ Backend Node: http://localhost:3000
- ✅ Backend Python: http://localhost:8000
- ✅ Mongo Express: http://localhost:8081
- ✅ pgAdmin: http://localhost:5050

## 📚 Tài Liệu

- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Hướng dẫn nhanh
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Hướng dẫn chi tiết
- [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) - Xử lý lỗi

## 🔧 Lệnh Hữu Ích

```bash
# Xem logs
docker-compose logs -f

# Xem logs của một service
docker-compose logs -f backend-node

# Kiểm tra status
docker-compose ps

# Restart một service
docker-compose restart backend-node

# Dừng tất cả
docker-compose down

# Xóa và tạo lại
docker-compose down -v
docker-compose up -d --build
```

## ❓ Cần Trợ Giúp?

Nếu gặp vấn đề, xem file [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md)

# Xử Lý Lỗi Docker - Hướng Dẫn Nhanh

## Vấn Đề Hiện Tại

### 1. Port 3000 đã được sử dụng

**Lỗi:** `bind: Only one usage of each socket address (protocol/network address/port) is normally permitted`

**Nguyên nhân:** Backend Node.js đang chạy ở chế độ development trên port 3000

**Giải pháp:**

```bash
# Kiểm tra process đang dùng port 3000
netstat -ano | findstr :3000

# Dừng process (thay PID bằng số thực tế)
taskkill /PID 14260 /F

# Hoặc dừng tất cả node processes
taskkill /IM node.exe /F
```

### 2. Backend Python không kết nối được MongoDB

**Nguyên nhân:** File `.env` của backend-python đang dùng `localhost` thay vì tên service Docker

**Giải pháp:**

Tạo file `backend-python/.env` với nội dung:

```env
# Database Configuration (Docker)
MONGODB_URL=mongodb://admin:password@mongodb:27017
MONGODB_DB_NAME=tvu_documents

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json

# OCR Configuration
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie

# API Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

## Các Bước Triển Khai Đầy Đủ

### Bước 1: Dừng các process đang chạy

```bash
# Dừng backend-node development
taskkill /IM node.exe /F

# Dừng backend-python development (nếu có)
taskkill /IM python.exe /F
```

### Bước 2: Tạo file .env cho backend-python

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

### Bước 3: Khởi động lại Docker services

```bash
# Dừng tất cả containers
docker-compose down

# Khởi động lại
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Bước 4: Kiểm tra trạng thái

```bash
# Kiểm tra containers
docker-compose ps

# Kiểm tra logs của từng service
docker-compose logs backend-node
docker-compose logs backend-python
docker-compose logs frontend
```

## Kiểm Tra Services Đang Chạy

### Kiểm tra từng endpoint:

```bash
# Backend Node.js
curl http://localhost:3000/health

# Backend Python
curl http://localhost:8000/health

# Frontend
curl http://localhost
```

### Hoặc mở trình duyệt:

- Frontend: http://localhost
- Backend Node API: http://localhost:3000
- Backend Python API: http://localhost:8000
- Mongo Express: http://localhost:8081
- pgAdmin: http://localhost:5050

## Lỗi Thường Gặp

### Lỗi: "Cannot connect to database"

```bash
# Kiểm tra database containers
docker-compose ps mongodb postgres

# Restart database services
docker-compose restart mongodb postgres

# Xem logs
docker-compose logs mongodb
docker-compose logs postgres
```

### Lỗi: "Port already in use"

```bash
# Tìm process đang dùng port
netstat -ano | findstr :<PORT>

# Dừng process
taskkill /PID <PID> /F

# Hoặc thay đổi port trong docker-compose.yml
```

### Lỗi: "Image build failed"

```bash
# Xóa cache và rebuild
docker-compose build --no-cache

# Hoặc xóa tất cả và build lại
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

### Lỗi: "Container keeps restarting"

```bash
# Xem logs chi tiết
docker-compose logs -f <service-name>

# Kiểm tra healthcheck
docker inspect <container-name> | grep -A 10 Health
```

## Script Tự Động Sửa Lỗi

Tạo file `fix-docker.bat`:

```batch
@echo off
echo Fixing Docker deployment issues...

echo Step 1: Stopping development processes...
taskkill /IM node.exe /F 2>nul
taskkill /IM python.exe /F 2>nul

echo Step 2: Stopping Docker containers...
docker-compose down

echo Step 3: Starting Docker services...
docker-compose up -d

echo Step 4: Waiting for services to start...
timeout /t 20 /nobreak

echo Step 5: Checking status...
docker-compose ps

echo.
echo Done! Check the services at:
echo - Frontend: http://localhost
echo - Backend Node: http://localhost:3000
echo - Backend Python: http://localhost:8000
```

Chạy script:

```bash
fix-docker.bat
```

## Xóa Và Tạo Lại Hoàn Toàn

Nếu gặp nhiều vấn đề, xóa tất cả và bắt đầu lại:

```bash
# Dừng và xóa containers, volumes, images
docker-compose down -v --rmi all

# Xóa Docker cache
docker system prune -a -f

# Build và start lại
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

## Kiểm Tra Tài Nguyên

```bash
# Kiểm tra disk space
docker system df

# Xem resource usage
docker stats

# Xóa unused resources
docker system prune -a
```

## Hỗ Trợ

Nếu vẫn gặp vấn đề:

1. Kiểm tra logs: `docker-compose logs -f`
2. Kiểm tra Docker Desktop có đang chạy không
3. Kiểm tra disk space còn đủ không
4. Restart Docker Desktop
5. Kiểm tra firewall/antivirus có block ports không

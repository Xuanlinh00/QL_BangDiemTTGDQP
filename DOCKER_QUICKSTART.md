# Docker Quick Start Guide

## Triển Khai Nhanh (5 phút)

### Windows

```bash
# Chạy script tự động
scripts\deploy.bat
```

### Linux/Mac

```bash
# Cấp quyền thực thi
chmod +x scripts/deploy.sh

# Chạy script tự động
./scripts/deploy.sh
```

### Hoặc Thủ Công

```bash
# 1. Build và start
docker-compose up -d --build

# 2. Xem logs
docker-compose logs -f

# 3. Kiểm tra status
docker-compose ps
```

## Truy Cập Ứng Dụng

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend | http://localhost | Giao diện web chính |
| Backend Node | http://localhost:3000 | API chính |
| Backend Python | http://localhost:8000 | OCR & PDF API |
| Mongo Express | http://localhost:8081 | MongoDB admin |
| pgAdmin | http://localhost:5050 | PostgreSQL admin |

## Lệnh Thường Dùng

```bash
# Xem logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Dừng tất cả
docker-compose down

# Xóa và tạo lại
docker-compose down -v
docker-compose up -d --build
```

## Xử Lý Lỗi Nhanh

### Port đã được sử dụng
Sửa port trong `docker-compose.yml` hoặc dừng service đang dùng port đó.

### Service không start
```bash
docker-compose logs [service-name]
```

### Database connection error
```bash
docker-compose restart postgres mongodb
```

## Tài Liệu Chi Tiết

Xem [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) để biết thêm chi tiết.

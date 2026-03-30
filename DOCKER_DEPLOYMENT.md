# Hướng Dẫn Triển Khai Docker

## Yêu Cầu Hệ Thống

- Docker Engine 20.10+
- Docker Compose 2.0+
- Ít nhất 4GB RAM
- 10GB dung lượng đĩa trống

## Cấu Trúc Docker

Dự án bao gồm các service sau:

### Database Services
- **MongoDB** (port 27017): Lưu trữ documents và activities
- **PostgreSQL** (port 5432): Lưu trữ users và system data
- **Redis** (port 6379): Cache và rate limiting
- **Mongo Express** (port 8081): MongoDB admin UI
- **pgAdmin** (port 5050): PostgreSQL admin UI

### Application Services
- **Backend Node.js** (port 3000): API chính
- **Backend Python** (port 8000): OCR và PDF processing
- **Frontend React** (port 80): Web interface

## Chuẩn Bị Trước Khi Triển Khai

### 1. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc:

```bash
# JWT Secret (thay đổi trong production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database passwords (thay đổi trong production)
POSTGRES_PASSWORD=your-postgres-password
MONGODB_PASSWORD=your-mongodb-password
```

### 2. Kiểm tra file Google Credentials

Đảm bảo file `backend-python/google-credentials.json` tồn tại nếu sử dụng Google Cloud services.

### 3. Cập nhật Frontend Environment

Chỉnh sửa `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_PYTHON_API_URL=http://localhost:8000
```

Hoặc cho production:

```env
VITE_API_URL=https://your-domain.com/api
VITE_PYTHON_API_URL=https://your-domain.com/python-api
```

## Triển Khai

### Bước 1: Build và Start Services

```bash
# Build tất cả images
docker-compose build

# Start tất cả services
docker-compose up -d

# Hoặc build và start cùng lúc
docker-compose up -d --build
```

### Bước 2: Kiểm Tra Trạng Thái

```bash
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f backend-node
docker-compose logs -f backend-python
docker-compose logs -f frontend

# Kiểm tra trạng thái services
docker-compose ps
```

### Bước 3: Truy Cập Ứng Dụng

- **Frontend**: http://localhost
- **Backend Node API**: http://localhost:3000
- **Backend Python API**: http://localhost:8000
- **Mongo Express**: http://localhost:8081
- **pgAdmin**: http://localhost:5050

## Quản Lý Services

### Dừng Services

```bash
# Dừng tất cả services
docker-compose stop

# Dừng một service cụ thể
docker-compose stop backend-node
```

### Khởi Động Lại Services

```bash
# Restart tất cả services
docker-compose restart

# Restart một service cụ thể
docker-compose restart backend-node
```

### Xóa Services và Volumes

```bash
# Dừng và xóa containers
docker-compose down

# Xóa cả volumes (MẤT DỮ LIỆU!)
docker-compose down -v

# Xóa cả images
docker-compose down --rmi all
```

## Cập Nhật Ứng Dụng

### Cập nhật code và rebuild

```bash
# Pull code mới
git pull

# Rebuild và restart services
docker-compose up -d --build

# Hoặc rebuild một service cụ thể
docker-compose up -d --build backend-node
```

## Backup và Restore

### Backup MongoDB

```bash
# Backup
docker-compose exec mongodb mongodump --username admin --password password --authenticationDatabase admin --out /data/backup

# Copy backup ra host
docker cp $(docker-compose ps -q mongodb):/data/backup ./mongodb-backup
```

### Backup PostgreSQL

```bash
# Backup
docker-compose exec postgres pg_dump -U admin tvu_gdqp_admin > postgres-backup.sql

# Restore
docker-compose exec -T postgres psql -U admin tvu_gdqp_admin < postgres-backup.sql
```

## Troubleshooting

### Service không start được

```bash
# Xem logs chi tiết
docker-compose logs backend-node

# Kiểm tra health status
docker-compose ps
```

### Port đã được sử dụng

Chỉnh sửa ports trong `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Thay vì 80:80
```

### Lỗi kết nối database

```bash
# Kiểm tra database đã ready chưa
docker-compose exec postgres pg_isready -U admin
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Restart database services
docker-compose restart postgres mongodb
```

### Xóa và tạo lại từ đầu

```bash
# Dừng và xóa tất cả
docker-compose down -v

# Xóa images cũ
docker-compose down --rmi all

# Build và start lại
docker-compose up -d --build
```

## Production Deployment

### 1. Sử dụng Docker Swarm hoặc Kubernetes

Cho production scale, nên sử dụng orchestration tools như Docker Swarm hoặc Kubernetes.

### 2. Cấu hình SSL/TLS

Thêm reverse proxy như Nginx hoặc Traefik để handle SSL certificates.

### 3. Environment Variables

Sử dụng Docker secrets hoặc external configuration management:

```bash
# Sử dụng .env file
docker-compose --env-file .env.production up -d
```

### 4. Monitoring và Logging

Thêm services như Prometheus, Grafana, ELK stack để monitor.

### 5. Security Best Practices

- Thay đổi tất cả default passwords
- Sử dụng secrets management
- Giới hạn network exposure
- Regular security updates
- Backup thường xuyên

## Tối Ưu Hóa

### Giảm Image Size

Images đã được tối ưu với:
- Multi-stage builds
- Alpine Linux base images
- Production dependencies only
- .dockerignore files

### Caching

- Redis được sử dụng cho caching
- Nginx caching cho static assets
- Docker layer caching khi build

### Resource Limits

Thêm resource limits trong docker-compose.yml:

```yaml
services:
  backend-node:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Docker logs: `docker-compose logs -f`
2. Container status: `docker-compose ps`
3. Network connectivity: `docker network inspect tvu_network`
4. Volume mounts: `docker volume ls`

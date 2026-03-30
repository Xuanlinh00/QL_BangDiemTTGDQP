# ✅ CORS Issue Đã Được Sửa!

## Vấn Đề

Frontend (http://localhost) không thể gọi API backend (http://localhost:3000) do lỗi CORS:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/auth/login' from origin 'http://localhost' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Nguyên Nhân

Backend CORS chỉ cho phép origins từ Vite dev server (localhost:5173-5176) nhưng không bao gồm `http://localhost` (port 80) - nơi frontend Docker đang chạy.

## Giải Pháp

### 1. Cập nhật docker-compose.yml

Thêm `CORS_ORIGINS` environment variable vào backend-node service:

```yaml
backend-node:
  environment:
    CORS_ORIGINS: http://localhost,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

### 2. Cập nhật backend-node/.env

```env
CORS_ORIGINS=http://localhost,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
DATABASE_URL=postgresql://admin:password@postgres:5432/tvu_gdqp_admin
MONGODB_URI=mongodb://admin:password@mongodb:27017/tvu_documents?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
PYTHON_WORKER_URL=http://backend-python:8000
```

### 3. Restart Backend

```bash
docker-compose up -d backend-node
```

## Kiểm Tra

### Test CORS Preflight
```bash
curl -X OPTIONS http://localhost:3000/api/auth/login -H "Origin: http://localhost"
```

Kết quả mong đợi:
```
Access-Control-Allow-Origin: http://localhost
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

### Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"admin@tvu.edu.vn","password":"password123"}'
```

## Các Thay Đổi Khác

Cũng đã cập nhật các environment variables để sử dụng Docker service names:

- `DATABASE_URL`: `localhost` → `postgres`
- `MONGODB_URI`: `localhost` → `mongodb`
- `REDIS_HOST`: `localhost` → `redis`
- `PYTHON_WORKER_URL`: `localhost:8000` → `backend-python:8000`

## Truy Cập Ứng Dụng

Bây giờ bạn có thể:

1. Mở http://localhost trong trình duyệt
2. Đăng nhập với credentials hợp lệ
3. Sử dụng tất cả các tính năng của ứng dụng

## Lưu Ý

Nếu bạn thêm frontend vào domain khác trong tương lai, cần thêm domain đó vào `CORS_ORIGINS`:

```yaml
CORS_ORIGINS: http://localhost,https://yourdomain.com,https://www.yourdomain.com
```

## Troubleshooting

### Vẫn gặp lỗi CORS?

1. Kiểm tra backend logs:
```bash
docker-compose logs backend-node
```

2. Kiểm tra environment variables:
```bash
docker-compose exec backend-node env | grep CORS
```

3. Restart backend:
```bash
docker-compose restart backend-node
```

4. Clear browser cache và reload trang

### API trả về 404?

Kiểm tra routes có đúng không:
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Health: `GET /health`

### Database connection errors?

Kiểm tra database services:
```bash
docker-compose ps postgres mongodb redis
```

Restart nếu cần:
```bash
docker-compose restart postgres mongodb redis backend-node
```

---

**Status: ✅ CORS đã được sửa và hoạt động bình thường!**

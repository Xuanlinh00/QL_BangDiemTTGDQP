# Deploy Docker Lên Render - Siêu Đơn Giản

## 🎯 Bạn Đã Có Gì

✅ Docker đang chạy local  
✅ Dockerfiles đã sẵn sàng  
✅ Ứng dụng hoạt động tốt  

## 🚀 Chỉ Cần 3 Bước

### Bước 1: Push Code Lên GitHub (2 phút)

```bash
# Nếu chưa có git
git init
git add .
git commit -m "Ready for Render"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### Bước 2: Tạo Databases Miễn Phí (5 phút)

#### MongoDB Atlas (Free 512MB)
1. Vào https://www.mongodb.com/cloud/atlas
2. Sign up → Create Free Cluster
3. Create Database User: `admin` / `<password>`
4. Network Access → Add IP: `0.0.0.0/0`
5. Connect → Copy connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/tvu_documents
   ```

#### Upstash Redis (Free)
1. Vào https://upstash.com
2. Create Database → Free tier
3. Copy: Host, Port, Password

### Bước 3: Deploy Lên Render (10 phút)

#### 3.1. Backend Node.js

**Render.com → New → Web Service**

| Setting | Value |
|---------|-------|
| Repository | Your GitHub repo |
| Name | `tvu-backend-node` |
| Environment | `Docker` |
| Dockerfile Path | `./backend-node/Dockerfile` |
| Plan | `Free` |

**Environment Variables** (copy từ local .env, thay đổi hosts):
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@dpg-xxxxx.oregon-postgres.render.com/tvu_gdqp_admin
MONGODB_URI=mongodb+srv://admin:pass@cluster0.mongodb.net/tvu_documents
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxxxx
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=https://tvu-frontend.onrender.com
PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
```

Click **Create Web Service** → Đợi build (~5 phút)

#### 3.2. Backend Python

**New → Web Service**

| Setting | Value |
|---------|-------|
| Name | `tvu-backend-python` |
| Environment | `Docker` |
| Dockerfile Path | `./backend-python/Dockerfile` |

**Environment Variables**:
```env
MONGODB_URL=mongodb+srv://admin:pass@cluster0.mongodb.net
MONGODB_DB_NAME=tvu_documents
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
API_PORT=8000
```

Click **Create Web Service**

#### 3.3. PostgreSQL

**New → PostgreSQL**

| Setting | Value |
|---------|-------|
| Name | `tvu-postgres` |
| Database | `tvu_gdqp_admin` |
| Plan | `Free` |

Sau khi tạo xong:
1. Copy **Internal Database URL**
2. Paste vào `DATABASE_URL` của backend-node
3. Redeploy backend-node

#### 3.4. Frontend

**New → Static Site**

| Setting | Value |
|---------|-------|
| Name | `tvu-frontend` |
| Build Command | `cd frontend && npm install && npm run build` |
| Publish Directory | `frontend/dist` |

**Environment Variables**:
```env
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
VITE_APP_NAME=TVU GDQP-AN Admin Portal
```

**Redirects/Rewrites** (Settings → Redirects):
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

Click **Create Static Site**

## ✅ Xong Rồi!

Sau ~10-15 phút, tất cả services sẽ online:

- Frontend: `https://tvu-frontend.onrender.com`
- Backend Node: `https://tvu-backend-node.onrender.com`
- Backend Python: `https://tvu-backend-python.onrender.com`

## 🔧 Khởi Tạo Database

### Chạy SQL Init

Kết nối đến PostgreSQL và chạy init.sql:

**Option 1: Sử dụng psql**
```bash
psql <postgres-connection-string> -f backend-node/src/database/init.sql
```

**Option 2: Sử dụng Render Shell**
1. Render Dashboard → PostgreSQL service
2. Shell tab
3. Copy/paste nội dung init.sql

### Tạo Admin User

```bash
curl -X POST https://tvu-backend-node.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tvu.edu.vn",
    "password": "Admin@123",
    "fullName": "Administrator",
    "role": "admin"
  }'
```

## 🎉 Hoàn Tất!

Truy cập `https://tvu-frontend.onrender.com` và đăng nhập!

## 📝 So Sánh Docker Local vs Render

| Aspect | Docker Local | Render Cloud |
|--------|--------------|--------------|
| Databases | localhost | Cloud URLs |
| CORS | localhost | .onrender.com URLs |
| Ports | 3000, 8000, 80 | HTTPS (443) |
| Sleep | Không | Sau 15 phút (free tier) |
| Access | Chỉ bạn | Public internet |

## 💡 Tips

### 1. Keep Services Awake (Free)

Sử dụng UptimeRobot để ping mỗi 5 phút:
- https://uptimerobot.com
- Add monitors cho backend URLs

### 2. Auto-Deploy

Render tự động deploy khi push code:
```bash
git add .
git commit -m "Update feature"
git push
# Render sẽ tự động build và deploy
```

### 3. Xem Logs

```
Render Dashboard → Service → Logs
```

### 4. Environment Variables

Khi thay đổi env vars:
1. Settings → Environment
2. Update variables
3. Service sẽ tự động redeploy

## 🐛 Troubleshooting

### Service không start?
```
Dashboard → Service → Logs
```

### Database connection error?
```
Kiểm tra DATABASE_URL format:
postgresql://user:pass@host:5432/database
```

### CORS error?
```
Cập nhật CORS_ORIGINS trong backend-node:
https://tvu-frontend.onrender.com
```

### Build quá lâu?
```
Free tier có limit 15 phút build time
Dockerfiles của bạn đã tối ưu nên OK
```

## 💰 Chi Phí

**FREE TIER**:
- ✅ 750 hours/month per service
- ✅ PostgreSQL 1GB
- ✅ 100GB bandwidth
- ⚠️ Services sleep sau 15 phút không dùng

**Nâng cấp** (nếu cần):
- Starter: $7/month (không sleep)
- Professional: $25/month (dedicated)

## 🔄 Workflow

### Development (Local)
```bash
docker-compose up -d
# Code và test local
```

### Deploy (Production)
```bash
git add .
git commit -m "New feature"
git push
# Render tự động deploy
```

## 📚 Tài Liệu

- Chi tiết: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- Checklist: [RENDER_CHECKLIST.md](./RENDER_CHECKLIST.md)
- Quick Start: [RENDER_QUICKSTART.md](./RENDER_QUICKSTART.md)

---

**Tóm tắt**: Bạn chỉ cần push code lên GitHub, tạo databases miễn phí, và connect với Render. Dockerfiles hiện tại sẽ hoạt động ngay!

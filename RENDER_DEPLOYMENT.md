# Hướng Dẫn Deploy Lên Render.com

## 📋 Tổng Quan

Render.com là platform PaaS miễn phí (có giới hạn) cho phép deploy ứng dụng dễ dàng. Dự án này sẽ được deploy thành các services riêng biệt.

## 🏗️ Kiến Trúc Trên Render

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│            (Static Site - Free)                  │
│         https://tvu-frontend.onrender.com        │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼─────────┐
│ Backend Node.js│            │ Backend Python   │
│  (Web Service) │            │  (Web Service)   │
│     Free       │            │     Free         │
└───────┬────────┘            └────────┬─────────┘
        │                              │
        ├──────────┬───────────────────┘
        │          │
┌───────▼──┐  ┌───▼────┐  ┌──────────┐
│PostgreSQL│  │MongoDB │  │  Redis   │
│  (Free)  │  │ Atlas  │  │  Upstash │
└──────────┘  └────────┘  └──────────┘
```

## 🚀 Bước 1: Chuẩn Bị

### 1.1. Tạo Tài Khoản

1. **Render.com**: https://render.com (đăng ký với GitHub)
2. **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas (Free tier 512MB)
3. **Upstash Redis**: https://upstash.com (Free tier 10K commands/day)

### 1.2. Push Code Lên GitHub

```bash
# Khởi tạo git (nếu chưa có)
git init

# Add remote repository
git remote add origin https://github.com/your-username/your-repo.git

# Commit và push
git add .
git commit -m "Initial commit for Render deployment"
git push -u origin main
```

## 🗄️ Bước 2: Setup Databases

### 2.1. MongoDB Atlas (Free)

1. Truy cập https://www.mongodb.com/cloud/atlas
2. Tạo cluster mới (Free tier - M0)
3. Chọn region gần nhất (Singapore/Tokyo)
4. Tạo database user:
   - Username: `admin`
   - Password: (tạo password mạnh)
5. Whitelist IP: `0.0.0.0/0` (cho phép tất cả)
6. Lấy connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
   ```

### 2.2. Upstash Redis (Free)

1. Truy cập https://upstash.com
2. Tạo database mới (Free tier)
3. Chọn region gần nhất
4. Lấy connection info:
   - Host: `xxx.upstash.io`
   - Port: `6379`
   - Password: `xxxxx`

## 📦 Bước 3: Deploy Services

### 3.1. Deploy Backend Node.js

1. Vào Render Dashboard → New → Web Service
2. Connect GitHub repository
3. Cấu hình:
   - **Name**: `tvu-backend-node`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./backend-node/Dockerfile`
   - **Plan**: Free
   - **Health Check Path**: `/health`

4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://user:pass@host:5432/tvu_gdqp_admin
   MONGODB_URI=mongodb+srv://admin:pass@cluster.mongodb.net/tvu_documents
   REDIS_HOST=xxx.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=xxxxx
   JWT_SECRET=your-super-secret-jwt-key-change-this
   CORS_ORIGINS=https://tvu-frontend.onrender.com
   PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
   ```

5. Click "Create Web Service"

### 3.2. Deploy Backend Python

1. New → Web Service
2. Connect same repository
3. Cấu hình:
   - **Name**: `tvu-backend-python`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./backend-python/Dockerfile`
   - **Plan**: Free
   - **Health Check Path**: `/health`

4. Environment Variables:
   ```
   MONGODB_URL=mongodb+srv://admin:pass@cluster.mongodb.net
   MONGODB_DB_NAME=tvu_documents
   TESSERACT_PATH=/usr/bin/tesseract
   OCR_LANGUAGE=vie
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

5. Click "Create Web Service"

### 3.3. Deploy PostgreSQL

**Option A: Render PostgreSQL (Recommended)**

1. New → PostgreSQL
2. Cấu hình:
   - **Name**: `tvu-postgres`
   - **Database**: `tvu_gdqp_admin`
   - **User**: `admin`
   - **Plan**: Free (1GB storage)

3. Lấy Internal/External Connection String
4. Cập nhật `DATABASE_URL` trong backend-node

**Option B: External PostgreSQL**

Sử dụng ElephantSQL (Free 20MB): https://www.elephantsql.com

### 3.4. Deploy Frontend

1. New → Static Site
2. Connect repository
3. Cấu hình:
   - **Name**: `tvu-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Environment Variables:
   ```
   VITE_API_URL=https://tvu-backend-node.onrender.com/api
   VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
   VITE_APP_NAME=TVU GDQP-AN Admin Portal
   ```

5. Rewrite Rules (trong Settings):
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`

## 🔧 Bước 4: Cấu Hình Sau Deploy

### 4.1. Chạy Database Migrations

Kết nối đến PostgreSQL và chạy init.sql:

```bash
# Sử dụng psql hoặc pgAdmin
psql -h <render-postgres-host> -U admin -d tvu_gdqp_admin -f backend-node/src/database/init.sql
```

Hoặc sử dụng Render Shell:
```bash
# Trong Render Dashboard → PostgreSQL → Shell
\i /path/to/init.sql
```

### 4.2. Tạo Admin User

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

### 4.3. Cập nhật CORS

Sau khi có URL frontend, cập nhật CORS_ORIGINS trong backend-node:
```
CORS_ORIGINS=https://tvu-frontend.onrender.com,https://your-custom-domain.com
```

## 📝 Bước 5: Custom Domain (Optional)

### 5.1. Thêm Custom Domain

1. Vào Frontend service → Settings → Custom Domains
2. Add domain: `yourdomain.com`
3. Cấu hình DNS:
   ```
   Type: CNAME
   Name: @
   Value: tvu-frontend.onrender.com
   ```

### 5.2. Cập nhật Environment Variables

Cập nhật CORS_ORIGINS với domain mới:
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## ⚙️ Cấu Hình Nâng Cao

### Auto-Deploy từ GitHub

Render tự động deploy khi push code lên GitHub:

1. Settings → Build & Deploy
2. Enable "Auto-Deploy"
3. Branch: `main`

### Environment Groups

Tạo Environment Group để share variables:

1. Dashboard → Environment Groups → New
2. Add common variables
3. Link to services

### Health Checks

Render tự động restart service nếu health check fail:

- Backend Node: `/health`
- Backend Python: `/health`
- Interval: 30s
- Timeout: 10s

## 🐛 Troubleshooting

### Service Không Start

```bash
# Xem logs
Render Dashboard → Service → Logs

# Kiểm tra environment variables
Settings → Environment → Verify all variables
```

### Database Connection Error

```bash
# Test connection
curl https://tvu-backend-node.onrender.com/health

# Kiểm tra DATABASE_URL format
postgresql://user:password@host:5432/database
```

### CORS Error

```bash
# Kiểm tra CORS_ORIGINS
Settings → Environment → CORS_ORIGINS

# Phải bao gồm frontend URL
https://tvu-frontend.onrender.com
```

### Build Failed

```bash
# Kiểm tra Dockerfile
# Đảm bảo paths đúng
# Kiểm tra dependencies trong package.json/requirements.txt
```

## 💰 Chi Phí

### Free Tier Limits

- **Web Services**: 750 hours/month (sleep sau 15 phút không dùng)
- **PostgreSQL**: 1GB storage, 1GB RAM
- **Static Sites**: 100GB bandwidth/month
- **MongoDB Atlas**: 512MB storage
- **Upstash Redis**: 10K commands/day

### Nâng Cấp (Nếu Cần)

- **Starter Plan**: $7/month (không sleep)
- **PostgreSQL**: $7/month (10GB storage)
- **Professional**: $25/month (dedicated resources)

## 🔐 Security Best Practices

1. **Environment Variables**: Không commit secrets vào Git
2. **JWT Secret**: Sử dụng secret mạnh (32+ characters)
3. **Database Passwords**: Sử dụng passwords phức tạp
4. **CORS**: Chỉ cho phép domains cụ thể
5. **HTTPS**: Render tự động cung cấp SSL
6. **IP Whitelist**: Giới hạn database access nếu có thể

## 📊 Monitoring

### Render Dashboard

- **Metrics**: CPU, Memory, Response time
- **Logs**: Real-time logs cho mỗi service
- **Events**: Deploy history, restarts

### External Monitoring

- **UptimeRobot**: https://uptimerobot.com (Free)
- **Better Uptime**: https://betteruptime.com (Free tier)

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Tạo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 📚 Tài Liệu Tham Khảo

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Upstash Redis: https://docs.upstash.com

## 🎯 Checklist Deploy

- [ ] Push code lên GitHub
- [ ] Tạo MongoDB Atlas cluster
- [ ] Tạo Upstash Redis database
- [ ] Deploy Backend Node.js
- [ ] Deploy Backend Python
- [ ] Deploy PostgreSQL
- [ ] Deploy Frontend
- [ ] Chạy database migrations
- [ ] Tạo admin user
- [ ] Test tất cả endpoints
- [ ] Cấu hình custom domain (optional)
- [ ] Setup monitoring

## 🚀 URLs Sau Khi Deploy

- Frontend: `https://tvu-frontend.onrender.com`
- Backend Node: `https://tvu-backend-node.onrender.com`
- Backend Python: `https://tvu-backend-python.onrender.com`

---

**Lưu ý**: Free tier services sẽ sleep sau 15 phút không hoạt động. Lần đầu truy cập sau khi sleep sẽ mất ~30s để wake up.

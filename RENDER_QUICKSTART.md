# Render Deployment - Quick Start

## 🚀 Deploy Nhanh (15 phút)

### Bước 1: Chuẩn Bị (5 phút)

1. **Tạo tài khoản**:
   - Render.com: https://render.com
   - MongoDB Atlas: https://www.mongodb.com/cloud/atlas
   - Upstash Redis: https://upstash.com

2. **Push code lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Deploy to Render"
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

### Bước 2: Setup Databases (5 phút)

#### MongoDB Atlas
1. Tạo cluster (Free M0)
2. Tạo user: `admin` / `<password>`
3. Whitelist IP: `0.0.0.0/0`
4. Copy connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/tvu_documents
   ```

#### Upstash Redis
1. Tạo database (Free)
2. Copy: Host, Port, Password

### Bước 3: Deploy Services (5 phút)

#### 3.1. Backend Node.js

**Render Dashboard → New → Web Service**

- Repository: Your GitHub repo
- Name: `tvu-backend-node`
- Environment: `Docker`
- Dockerfile Path: `./backend-node/Dockerfile`
- Plan: `Free`

**Environment Variables**:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<render-postgres-url>
MONGODB_URI=<mongodb-atlas-url>
REDIS_HOST=<upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-password>
JWT_SECRET=<generate-random-32-chars>
CORS_ORIGINS=https://tvu-frontend.onrender.com
PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
```

#### 3.2. Backend Python

**New → Web Service**

- Name: `tvu-backend-python`
- Environment: `Docker`
- Dockerfile Path: `./backend-python/Dockerfile`

**Environment Variables**:
```
MONGODB_URL=<mongodb-atlas-url>
MONGODB_DB_NAME=tvu_documents
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
API_PORT=8000
```

#### 3.3. PostgreSQL

**New → PostgreSQL**

- Name: `tvu-postgres`
- Database: `tvu_gdqp_admin`
- Plan: `Free`

Copy Internal Connection String → Update `DATABASE_URL` in backend-node

#### 3.4. Frontend

**New → Static Site**

- Name: `tvu-frontend`
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/dist`

**Environment Variables**:
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
VITE_APP_NAME=TVU GDQP-AN Admin Portal
```

**Rewrite Rules** (Settings → Redirects/Rewrites):
- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

### Bước 4: Khởi Tạo Database

#### Run SQL Init Script

Connect to PostgreSQL và chạy:
```bash
psql <postgres-connection-string> -f backend-node/src/database/init.sql
```

#### Tạo Admin User

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

### Bước 5: Truy Cập

🎉 **Hoàn tất!** Truy cập:
- Frontend: `https://tvu-frontend.onrender.com`
- Backend: `https://tvu-backend-node.onrender.com/health`

## 📝 Lưu Ý Quan Trọng

### Free Tier Limitations

1. **Services sleep sau 15 phút không dùng**
   - Lần đầu truy cập sau khi sleep: ~30s để wake up
   - Giải pháp: Nâng lên Starter plan ($7/month)

2. **Build time limit: 15 phút**
   - Nếu build quá lâu, tối ưu Dockerfile

3. **Bandwidth: 100GB/month**
   - Đủ cho hầu hết ứng dụng nhỏ

### Tối Ưu Performance

1. **Keep services awake**:
   - Sử dụng UptimeRobot để ping mỗi 5 phút
   - URL: https://uptimerobot.com

2. **CDN cho static assets**:
   - Sử dụng Cloudflare (free)

3. **Database indexing**:
   - Tạo indexes cho queries thường dùng

## 🐛 Troubleshooting Nhanh

### Service không start
```bash
# Xem logs
Render Dashboard → Service → Logs
```

### Database connection error
```bash
# Kiểm tra connection string
# Format: postgresql://user:pass@host:5432/db
```

### CORS error
```bash
# Cập nhật CORS_ORIGINS
Settings → Environment → Add frontend URL
```

### Build failed
```bash
# Kiểm tra Dockerfile
# Xem build logs trong Render
```

## 🔄 Auto-Deploy

Render tự động deploy khi push code:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render sẽ tự động deploy
```

## 📊 Monitoring

### Render Dashboard
- Metrics: CPU, Memory, Response time
- Logs: Real-time logs
- Events: Deploy history

### External (Free)
- UptimeRobot: https://uptimerobot.com
- Better Uptime: https://betteruptime.com

## 💡 Tips

1. **Environment Variables**: Dùng Render's secret management
2. **Logs**: Enable persistent logs (Settings → Logs)
3. **Backups**: Backup PostgreSQL thường xuyên
4. **Monitoring**: Setup uptime monitoring
5. **Custom Domain**: Thêm domain riêng (free SSL)

## 📚 Tài Liệu Đầy Đủ

Xem [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) để biết chi tiết.

---

**Thời gian deploy**: ~15 phút  
**Chi phí**: $0 (Free tier)  
**Khó khăn**: ⭐⭐☆☆☆ (Dễ)

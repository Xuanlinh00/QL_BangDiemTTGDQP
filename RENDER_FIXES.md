# ✅ Render Deployment Fixes - Hoàn tất

## 📝 Tóm tắt Thay đổi

### 1. **Frontend Dockerfile** ✅
- **Vấn đề**: nginx cứng port 80, Render gán PORT dynami (10000+)
- **Giải pháp**: 
  - Thêm `gettext` (envsubst)
  - Tạo entrypoint script để động hóa PORT
  - nginx.conf → nginx.conf.template với `${PORT}`
  - Default PORT=8080

### 2. **Frontend nginx.conf** ✅
- **Thay đổi**: `listen 80` → `listen ${PORT}`
- **Lý do**: Cho phép nginx lắng nghe port được set từ environment

### 3. **Backend Python** ✅
- Support PORT env variable
- Thay CMD từ cứng port 8000 thành gọi `python -m app.main`

### 4. **render.yaml** ✅
- **Loại bỏ**: PostgreSQL service (type: pserv)
- **Chỉ còn**: MongoDB (external via Atlas), Redis (external), Backend Node, Backend Python, Frontend

### 5. **MongoDB Only** ✅ (MỚI)
- Loại bỏ PostgreSQL dependencies: `pg`, `typeorm`
- Loại bỏ file: `src/config/database.ts` (TypeORM config)
- Loại bỏ DATABASE_URL từ mọi nơi
- Backend chỉ sử dụng MongoDB qua Mongoose

## 🎯 Services Deploy trên Render

```
┌─────────────────────────────────────────┐
│   MongoDB Atlas (External)              │
│   Free tier (512MB storage)             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   tvu-backend-node (Docker)             │
│   PORT: Dynamic (Render assigns)        │
│   Only: MongoDB + Redis                 │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   tvu-backend-python (Docker)           │
│   PORT: Dynamic (Render assigns)        │
│   Only: MongoDB                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   tvu-frontend (Docker)                 │
│   PORT: Dynamic (Render assigns)        │
│   nginx reverse proxy built-in          │
└─────────────────────────────────────────┘
```

## 📋 Environment Variables Required on Render

### Backend Node.js (MONGODB ONLY):
```
NODE_ENV=production
MONGODB_URI=<Your MongoDB Atlas URL>
REDIS_HOST=<Your Upstash Redis host>
REDIS_PORT=6379
REDIS_PASSWORD=<Your Upstash Redis password>
JWT_SECRET=<Auto generated>
CORS_ORIGINS=https://tvu-frontend.onrender.com,https://tvu-backend-python.onrender.com
PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
```

### Backend Python (MONGODB ONLY):
```
MONGODB_URL=<Your MongoDB Atlas URL>
MONGODB_DB_NAME=tvu_documents
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
```

### Frontend:
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
VITE_APP_NAME=TVU GDQP-AN Admin Portal
```

## 🚀 Deploy Steps

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Switch to MongoDB only, remove PostgreSQL"
   git push
   ```

2. **On Render Dashboard:**
   - Create New → Web Service
   - Connect GitHub repo
   - For each service (node, python, frontend):
     - Set Dockerfile path
     - Add environment variables
     - Deploy

3. **Setup External Services:**
   - MongoDB Atlas: https://www.mongodb.com/cloud/atlas
   - Upstash Redis: https://upstash.com
   - Update environment variables in Render

4. **Health Checks:**
   - Backend Node: `GET /health` → `{"status":"ok"}`
   - Backend Python: `GET /health` → `{"status":"ok"}`
   - Frontend: `GET /` → HTML page

## ✅ Checklist Khi Deploy

- [ ] MongoDB Atlas accessible from Render
- [ ] Redis connection configured
- [ ] CORS_ORIGINS includes all Render domains
- [ ] All health check endpoints responding
- [ ] Frontend API URLs point to correct backends
- [ ] Environment variables all set
- [ ] No PostgreSQL references remaining

## 🔗 Useful Links

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://cloud.mongodb.com
- Upstash Redis: https://upstash.com
- RENDER_QUICKSTART.md: For quick reference
- RENDER_DEPLOYMENT.md: For detailed guide

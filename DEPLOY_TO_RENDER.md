# 🚀 Deploy Lên Render - 3 Bước Đơn Giản

Bạn đã có Docker chạy local → Chỉ cần đưa lên cloud!

## Bước 1: Push Code (2 phút)

```bash
git init
git add .
git commit -m "Deploy to Render"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

## Bước 2: Tạo Databases (5 phút)

### MongoDB Atlas
https://www.mongodb.com/cloud/atlas → Free Cluster → Copy connection string

### Upstash Redis  
https://upstash.com → Free Database → Copy host/port/password

## Bước 3: Deploy Services (10 phút)

### Render.com → New Services

#### Backend Node
- **Type**: Web Service (Docker)
- **Dockerfile**: `./backend-node/Dockerfile`
- **Env Vars**: Copy từ local .env, thay hosts thành cloud URLs

#### Backend Python
- **Type**: Web Service (Docker)
- **Dockerfile**: `./backend-python/Dockerfile`
- **Env Vars**: MongoDB URL, Tesseract config

#### PostgreSQL
- **Type**: PostgreSQL
- **Plan**: Free
- Copy URL → Update backend-node DATABASE_URL

#### Frontend
- **Type**: Static Site
- **Build**: `cd frontend && npm install && npm run build`
- **Publish**: `frontend/dist`
- **Env Vars**: Backend URLs
- **Rewrite**: `/*` → `/index.html`

## ✅ Xong!

URLs:
- Frontend: `https://tvu-frontend.onrender.com`
- Backend: `https://tvu-backend-node.onrender.com`

## 🔧 Khởi Tạo

```bash
# Run SQL init
psql <postgres-url> -f backend-node/src/database/init.sql

# Tạo admin
curl -X POST https://tvu-backend-node.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tvu.edu.vn","password":"Admin@123","fullName":"Admin","role":"admin"}'
```

## 📖 Chi Tiết

Xem [RENDER_FROM_DOCKER.md](./RENDER_FROM_DOCKER.md) để hiểu rõ hơn.

---

**Thời gian**: 15-20 phút  
**Chi phí**: $0 (Free tier)  
**Khó**: ⭐⭐☆☆☆

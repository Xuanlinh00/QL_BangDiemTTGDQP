# ✅ Setup 3 Databases - Checklist

Ứng dụng cần 3 CSDL giống như Docker local.

## 📋 Checklist

### 1. PostgreSQL (5 phút)

- [ ] Render → New → PostgreSQL
- [ ] Name: `tvu-postgres`
- [ ] Database: `tvu_gdqp_admin`
- [ ] Plan: Free
- [ ] Create Database
- [ ] Copy **Internal Database URL**
- [ ] Run init.sql script (Shell hoặc psql)

**Connection String**:
```
postgresql://admin:xxxxx@dpg-xxxxx.oregon-postgres.render.com/tvu_gdqp_admin
```

---

### 2. MongoDB Atlas (10 phút)

- [ ] https://www.mongodb.com/cloud/atlas
- [ ] Create Free Cluster (M0)
- [ ] Region: Singapore
- [ ] Create Database User: `admin` / `<password>`
- [ ] Network Access: `0.0.0.0/0`
- [ ] Connect → Copy connection string

**Connection String**:
```
mongodb+srv://admin:<password>@cluster.mongodb.net/tvu_documents?retryWrites=true&w=majority
```

**Lưu ý**: Thay `<password>` bằng password thực!

---

### 3. Upstash Redis (3 phút)

- [ ] https://upstash.com
- [ ] Create Database
- [ ] Name: `tvu-redis`
- [ ] Region: Singapore
- [ ] Plan: Free
- [ ] Copy: Host, Port, Password

**Connection Info**:
```
Host: xxx.upstash.io
Port: 6379
Password: Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔧 Cập Nhật Render Environment Variables

### Backend Node

**Dashboard → Backend Node → Environment → Add/Edit**

```env
DATABASE_URL=<postgresql-connection-string>
MONGODB_URI=<mongodb-connection-string>
REDIS_HOST=<upstash-host>
REDIS_PORT=6379
REDIS_PASSWORD=<upstash-password>
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key-32-chars
CORS_ORIGINS=https://your-frontend.onrender.com
PYTHON_WORKER_URL=https://your-backend-python.onrender.com
```

**Save Changes** → Auto redeploy

### Backend Python

**Dashboard → Backend Python → Environment → Add/Edit**

```env
MONGODB_URL=<mongodb-connection-string-without-database>
MONGODB_DB_NAME=tvu_documents
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
API_PORT=8000
```

**Save Changes** → Auto redeploy

---

## ✅ Verify

Sau khi redeploy (~2-3 phút), check logs:

**Backend Node Logs**:
```
✅ PostgreSQL connected
✅ MongoDB connected successfully  
✅ Redis connected
✅ Server running on port 3000
```

**Test**:
```bash
curl https://your-backend.onrender.com/health
# Should return: {"status":"ok"}
```

---

## 💰 Chi Phí

**Tất cả FREE**:
- PostgreSQL: 1GB
- MongoDB: 512MB
- Redis: 10K commands/day

---

## 📚 Chi Tiết

Xem [RENDER_DATABASE_SETUP.md](./RENDER_DATABASE_SETUP.md) để biết chi tiết từng bước.

---

**Thời gian**: ~20 phút  
**Chi phí**: $0  
**Kết quả**: 3 databases giống hệt Docker local!

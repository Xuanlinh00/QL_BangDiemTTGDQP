# Setup 3 Databases Cho Render

Ứng dụng cần **3 databases**:
- PostgreSQL (users, auth)
- MongoDB (documents, activities)
- Redis (cache)

## 🗄️ Bước 1: PostgreSQL (Render Built-in)

### Tạo PostgreSQL trên Render

**Render Dashboard → New → PostgreSQL**

```
Name: tvu-postgres
Database: tvu_gdqp_admin
User: admin
Region: Oregon (US West)
Plan: Free (1GB)
```

Click **Create Database**

### Lấy Connection String

Sau khi tạo xong, copy **Internal Database URL**:

```
postgresql://admin:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/tvu_gdqp_admin
```

### Chạy Init Script

**Option 1: Sử dụng Render Shell**

1. Dashboard → PostgreSQL service → Shell
2. Copy/paste nội dung file `backend-node/src/database/init.sql`
3. Run

**Option 2: Sử dụng psql local**

```bash
psql <connection-string> -f backend-node/src/database/init.sql
```

---

## 🍃 Bước 2: MongoDB Atlas (Free 512MB)

### Tạo Cluster

1. Vào https://www.mongodb.com/cloud/atlas
2. **Sign Up** (hoặc Login)
3. **Create a Deployment** → **M0 Free**
4. **Provider**: AWS
5. **Region**: Singapore (gần Việt Nam nhất)
6. **Cluster Name**: `tvu-cluster`
7. Click **Create Deployment**

### Tạo Database User

1. **Security → Database Access → Add New Database User**
2. **Username**: `admin`
3. **Password**: Tạo password mạnh (lưu lại!)
4. **Database User Privileges**: Read and write to any database
5. Click **Add User**

### Whitelist IP

1. **Security → Network Access → Add IP Address**
2. **Access List Entry**: `0.0.0.0/0` (Allow from anywhere)
3. Click **Confirm**

### Lấy Connection String

1. **Deployment → Database → Connect**
2. **Connect your application**
3. **Driver**: Node.js
4. Copy connection string:

```
mongodb+srv://admin:<password>@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
```

**Quan trọng**: Thay `<password>` bằng password thực tế!

---

## 🔴 Bước 3: Redis (Upstash Free)

### Tạo Database

1. Vào https://upstash.com
2. **Sign Up** (hoặc Login với GitHub)
3. **Create Database**
4. **Name**: `tvu-redis`
5. **Type**: Regional
6. **Region**: Singapore
7. **Plan**: Free (10K commands/day)
8. Click **Create**

### Lấy Connection Info

Sau khi tạo xong, copy:

```
Endpoint: xxx-xxx.upstash.io
Port: 6379
Password: AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

---

## 🔧 Bước 4: Cập Nhật Environment Variables

### Backend Node Service

**Render Dashboard → Backend Node → Environment**

Thêm/cập nhật các variables:

```env
# PostgreSQL (từ Render PostgreSQL)
DATABASE_URL=postgresql://admin:xxxxx@dpg-xxxxx.oregon-postgres.render.com/tvu_gdqp_admin

# MongoDB (từ Atlas)
MONGODB_URI=mongodb+srv://admin:<password>@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority

# Redis (từ Upstash)
REDIS_HOST=xxx-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ

# Other
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-32-chars-min
CORS_ORIGINS=https://your-frontend.onrender.com
PYTHON_WORKER_URL=https://your-backend-python.onrender.com
```

Click **Save Changes** → Service sẽ tự động redeploy

### Backend Python Service

**Render Dashboard → Backend Python → Environment**

```env
# MongoDB (từ Atlas)
MONGODB_URL=mongodb+srv://admin:<password>@tvu-cluster.xxxxx.mongodb.net
MONGODB_DB_NAME=tvu_documents

# Other
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
API_PORT=8000
```

Click **Save Changes**

---

## ✅ Verify

### Kiểm Tra Logs

**Backend Node Logs** sẽ hiển thị:

```
✅ PostgreSQL connected
✅ MongoDB connected successfully
✅ Redis connected
✅ Server running on port 3000
```

Thay vì:

```
❌ MongoDB connection error
❌ Server running on port 3000 (MongoDB disconnected)
```

### Test Endpoints

```bash
# Health check
curl https://your-backend.onrender.com/health

# Should return: {"status":"ok"}
```

---

## 💰 Chi Phí

| Database | Plan | Storage | Cost |
|----------|------|---------|------|
| PostgreSQL (Render) | Free | 1GB | $0 |
| MongoDB (Atlas) | M0 Free | 512MB | $0 |
| Redis (Upstash) | Free | 256MB | $0 |

**Tổng**: $0/tháng

---

## 📝 Tóm Tắt Connection Strings

Lưu lại 3 connection strings này:

### PostgreSQL
```
postgresql://admin:xxxxx@dpg-xxxxx.oregon-postgres.render.com/tvu_gdqp_admin
```

### MongoDB
```
mongodb+srv://admin:<password>@tvu-cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
```

### Redis
```
Host: xxx-xxx.upstash.io
Port: 6379
Password: AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

---

## 🔄 Backup & Restore

### PostgreSQL Backup

```bash
# Backup
pg_dump <connection-string> > backup.sql

# Restore
psql <connection-string> < backup.sql
```

### MongoDB Backup

```bash
# Backup (sử dụng mongodump)
mongodump --uri="<mongodb-connection-string>"

# Restore
mongorestore --uri="<mongodb-connection-string>" dump/
```

---

## 🐛 Troubleshooting

### PostgreSQL connection error

```
Kiểm tra DATABASE_URL format:
postgresql://user:password@host:5432/database
```

### MongoDB connection error

```
Kiểm tra:
1. Password đúng (không có ký tự đặc biệt cần encode)
2. IP whitelist: 0.0.0.0/0
3. Database user có quyền read/write
```

### Redis connection error

```
Kiểm tra:
1. REDIS_HOST đúng
2. REDIS_PASSWORD đúng
3. Port 6379
```

---

**Sau khi setup xong 3 databases, backend sẽ hoạt động hoàn toàn bình thường như Docker local!**

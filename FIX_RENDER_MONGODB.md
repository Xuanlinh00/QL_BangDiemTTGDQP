# Fix lỗi MongoDB trên Render - Checklist nhanh

## Nguyên nhân
Backend trên Render đang cố kết nối `mongodb://mongodb:27017` (Docker local) nhưng service này không tồn tại trên cloud.

## Giải pháp: 3 bước

### 1️⃣ Tạo MongoDB Atlas (5 phút)

1. Đăng ký: https://www.mongodb.com/cloud/atlas/register
2. Tạo **FREE cluster** (M0 - 512MB)
3. Tạo user: username + password (lưu lại)
4. Network Access: Allow `0.0.0.0/0` (all IPs)
5. Lấy connection string:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/tvu_documents
   ```

### 2️⃣ Cập nhật Render Environment Variables

**Backend Node.js service:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/tvu_documents?retryWrites=true&w=majority
```

**Backend Python service:**
```
MONGODB_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net
MONGODB_DB_NAME=tvu_documents
```

### 3️⃣ Redeploy

Render sẽ tự động redeploy sau khi save environment variables.

## Kiểm tra

Vào Logs của service, tìm:
- ✅ "MongoDB connected" hoặc "Database connected"
- ❌ "Connection refused" hoặc "Authentication failed"

## Link hữu ích

- MongoDB Atlas: https://cloud.mongodb.com
- Render Dashboard: https://dashboard.render.com
- Hướng dẫn chi tiết: `RENDER_MONGODB_SETUP.md`

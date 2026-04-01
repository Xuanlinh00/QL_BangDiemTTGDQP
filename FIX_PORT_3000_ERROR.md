# Sửa lỗi EADDRINUSE: Port 3000 đang được sử dụng

## 🔴 Vấn đề

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

Port 3000 đang được sử dụng bởi một process khác.

## ✅ Cách sửa

### Option 1: Dùng Script (Khuyến nghị)

```bash
cd backend-node
.\START_BACKEND.ps1
```

Script sẽ:
1. Tìm process sử dụng port 3000
2. Dừng process đó
3. Start backend

### Option 2: Manual - Kill Process

#### Windows PowerShell:

```powershell
# Tìm process sử dụng port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess

# Dừng process (thay 13252 bằng PID từ trên)
Stop-Process -Id 13252 -Force

# Start backend
cd backend-node
npm run dev
```

#### Windows CMD:

```cmd
# Tìm process sử dụng port 3000
netstat -ano | findstr :3000

# Dừng process (thay 13252 bằng PID từ trên)
taskkill /PID 13252 /F

# Start backend
cd backend-node
npm run dev
```

#### Mac/Linux:

```bash
# Tìm process sử dụng port 3000
lsof -i :3000

# Dừng process (thay 13252 bằng PID từ trên)
kill -9 13252

# Start backend
cd backend-node
npm run dev
```

### Option 3: Sử dụng Port Khác

Nếu không muốn kill process, có thể sử dụng port khác:

```bash
cd backend-node

# Windows
$env:PORT=3001; npm run dev

# Mac/Linux
PORT=3001 npm run dev
```

Sau đó cập nhật frontend `.env`:
```
VITE_API_URL=http://localhost:3001/api
```

## 🔍 Kiểm tra

Nếu thành công, logs sẽ hiển thị:
```
Server running on port 3000
Connected to MongoDB Atlas
```

## 🛠️ Nguyên nhân

- Backend đang chạy từ lần trước
- Hoặc một ứng dụng khác sử dụng port 3000
- Hoặc process không được dừng đúng cách

## 💡 Mẹo

1. **Luôn dừng backend đúng cách**
   - Nhấn Ctrl+C trong terminal
   - Chờ process dừng hoàn toàn

2. **Kiểm tra port trước khi start**
   ```bash
   netstat -ano | findstr :3000
   ```

3. **Sử dụng script để tự động**
   - Chạy `START_BACKEND.ps1` thay vì `npm run dev`

## 📝 Lưu ý

- Nếu vẫn lỗi, restart máy tính
- Kiểm tra firewall có chặn port 3000 không
- Đảm bảo MongoDB đã được cấu hình đúng

## 🎯 Kết quả

✅ Backend chạy trên port 3000
✅ Lỗi EADDRINUSE biến mất
✅ API hoạt động bình thường

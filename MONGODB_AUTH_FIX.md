# Sửa lỗi MongoDB Authentication Failed

## Vấn đề

```
MongoServerError: Authentication failed.
```

Backend không thể kết nối MongoDB vì credentials sai.

## Nguyên nhân

File `.env` trong `backend-node/` có MongoDB URI nhưng credentials không đúng:

```
MONGODB_URI=mongodb+srv://user:HaivaLinh1605@cluster0.tqmq2ht.mongodb.net/qlbangdiem
```

Tài khoản `user` hoặc mật khẩu `HaivaLinh1605` không đúng hoặc không tồn tại.

## Cách sửa

### Option 1: Sử dụng MongoDB Atlas (Cloud)

1. **Truy cập MongoDB Atlas**
   - Vào https://www.mongodb.com/cloud/atlas
   - Đăng nhập vào tài khoản của bạn

2. **Lấy connection string**
   - Chọn cluster
   - Click "Connect"
   - Chọn "Drivers"
   - Copy connection string

3. **Cập nhật .env**
   ```bash
   cd backend-node
   ```
   
   Sửa file `.env`:
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE
   ```

4. **Restart backend**
   ```bash
   npm run dev
   ```

### Option 2: Sử dụng MongoDB Local

1. **Cài MongoDB Community Edition**
   - Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
   - Mac: `brew install mongodb-community`
   - Linux: https://docs.mongodb.com/manual/administration/install-on-linux/

2. **Start MongoDB**
   ```bash
   # Windows
   mongod
   
   # Mac/Linux
   brew services start mongodb-community
   ```

3. **Cập nhật .env**
   ```
   MONGODB_URI=mongodb://localhost:27017/qlbangdiem
   ```

4. **Restart backend**
   ```bash
   npm run dev
   ```

### Option 3: Sử dụng Docker (Khuyến nghị)

1. **Chạy MongoDB trong Docker**
   ```bash
   docker run -d \
     --name mongodb \
     -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=password \
     mongo:latest
   ```

2. **Cập nhật .env**
   ```
   MONGODB_URI=mongodb://admin:password@localhost:27017/qlbangdiem?authSource=admin
   ```

3. **Restart backend**
   ```bash
   npm run dev
   ```

## Kiểm tra kết nối

Sau khi sửa, kiểm tra logs:

```bash
cd backend-node
npm run dev
```

Nếu thành công, sẽ thấy:
```
Connected to MongoDB Atlas
```

hoặc

```
Server running on port 3000
```

## Nếu vẫn lỗi

### 1. Kiểm tra credentials
```bash
# Thử kết nối trực tiếp
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"
```

### 2. Kiểm tra IP whitelist (MongoDB Atlas)
- Vào MongoDB Atlas
- Security → Network Access
- Thêm IP của máy bạn (hoặc 0.0.0.0/0 để cho phép tất cả)

### 3. Kiểm tra database name
- Đảm bảo database `qlbangdiem` tồn tại
- Hoặc tạo database mới

### 4. Xóa cache và restart
```bash
cd backend-node
rm -r node_modules
npm install
npm run dev
```

## Lưu ý

- **Không commit .env** vào git (đã có trong .gitignore)
- **Bảo mật credentials** - không chia sẻ password
- **Sử dụng environment variables** trong production

## Sau khi sửa

Frontend sẽ tự động kết nối được:
- ✅ Lỗi 503 sẽ biến mất
- ✅ Activities API sẽ hoạt động
- ✅ Activity Editor có thể lưu dữ liệu

## Liên quan

- Activity Editor: `/activities/new`
- Activities API: `GET /api/activities`
- Draft API: `POST /api/draft`
- Posts API: `POST /api/posts`

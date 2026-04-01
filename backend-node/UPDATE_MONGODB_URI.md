# Cập nhật MongoDB URI

## Cách nhanh nhất

### 1. Lấy Connection String từ MongoDB Atlas

1. Vào https://www.mongodb.com/cloud/atlas
2. Đăng nhập
3. Vào **Clusters** → Click **"Connect"**
4. Chọn **"Drivers"**
5. Copy connection string

Sẽ trông như:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 2. Sửa file .env

Mở file `backend-node/.env` và thay thế dòng:

```properties
MONGODB_URI=mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Thay thế:**
- `<password>` → password bạn tạo
- Thêm `/qlbangdiem` trước `?` để chỉ định database

**Kết quả:**
```properties
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

### 3. Restart Backend

```bash
cd backend-node
npm run dev
```

## Ví dụ

**Trước:**
```properties
MONGODB_URI=mongodb+srv://user:HaivaLinh1605@cluster0.tqmq2ht.mongodb.net/qlbangdiem
```

**Sau:**
```properties
MONGODB_URI=mongodb+srv://admin:MyNewPassword123@cluster0.tqmq2ht.mongodb.net/qlbangdiem?retryWrites=true&w=majority
```

## Kiểm tra

Nếu thành công, logs sẽ hiển thị:
```
Connected to MongoDB Atlas
Server running on port 3000
```

## Lưu ý

- Không commit .env vào git
- Giữ bảo mật password
- Sử dụng password mạnh

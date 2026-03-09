# Hướng dẫn sử dụng pgAdmin4

## 🚀 Khởi động pgAdmin4

pgAdmin4 đã được thêm vào `docker-compose.yml`. Để khởi động:

```bash
docker-compose up -d
```

## 🔐 Đăng nhập pgAdmin4

**URL:** http://localhost:5050

**Thông tin đăng nhập:**
- Email: `admin@tvu.edu.vn`
- Password: `password`

## 📊 Kết nối PostgreSQL

### Cách 1: Tự động (Khuyến nghị)

pgAdmin4 sẽ tự động kết nối với PostgreSQL nếu bạn sử dụng Docker network.

### Cách 2: Thủ công

1. Đăng nhập vào pgAdmin4
2. Click **Servers** → **Register** → **Server**
3. Điền thông tin:
   - **Name:** `TVU GDQP-AN`
   - **Host name/address:** `postgres` (hoặc `localhost` nếu chạy ngoài Docker)
   - **Port:** `5432`
   - **Username:** `admin`
   - **Password:** `password`
   - **Database:** `tvu_gdqp_admin`
4. Click **Save**

## 📝 Các tác vụ thường dùng

### Xem dữ liệu bảng

1. Mở **Servers** → **TVU GDQP-AN** → **Databases** → **tvu_gdqp_admin**
2. Chọn **Schemas** → **public** → **Tables**
3. Click chuột phải vào bảng → **View/Edit Data** → **All Rows**

### Chạy Query

1. Click **Tools** → **Query Tool**
2. Viết SQL query
3. Click **Execute** (F5)

### Ví dụ Query

```sql
-- Xem tất cả bảng
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Xem cấu trúc bảng
\d table_name

-- Đếm số bản ghi
SELECT COUNT(*) FROM table_name;
```

### Backup Database

1. Click chuột phải vào database → **Backup**
2. Chọn format: **Custom** (khuyến nghị)
3. Click **Backup**

### Restore Database

1. Click chuột phải vào database → **Restore**
2. Chọn file backup
3. Click **Restore**

## 🔧 Cấu hình nâng cao

### Thay đổi thông tin đăng nhập

Sửa trong `docker-compose.yml`:

```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: your_email@example.com
    PGADMIN_DEFAULT_PASSWORD: your_password
```

### Thay đổi port

Sửa trong `docker-compose.yml`:

```yaml
pgadmin:
  ports:
    - "5050:80"  # Thay 5050 bằng port khác nếu cần
```

## 🐛 Khắc phục sự cố

### Không thể kết nối PostgreSQL

1. Kiểm tra PostgreSQL đang chạy:
   ```bash
   docker-compose ps
   ```

2. Kiểm tra logs:
   ```bash
   docker-compose logs postgres
   ```

3. Restart services:
   ```bash
   docker-compose restart
   ```

### Quên mật khẩu

Xóa volume pgAdmin và khởi động lại:

```bash
docker-compose down -v
docker-compose up -d
```

## 📚 Tài liệu tham khảo

- [pgAdmin4 Documentation](https://www.pgadmin.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎯 Các bảng chính

Sau khi tạo database, bạn sẽ có các bảng:

- `users` - Thông tin người dùng
- `documents` - Tài liệu scan
- `students` - Thông tin sinh viên
- `scores` - Điểm số
- `decisions` - Quyết định công nhận
- `audit_logs` - Lịch sử hoạt động

## 💡 Mẹo

1. **Tạo shortcut:** Lưu query thường dùng trong **Saved Queries**
2. **Export dữ liệu:** Click chuột phải vào bảng → **Export**
3. **Import dữ liệu:** Click chuột phải vào bảng → **Import**
4. **Tạo index:** Cải thiện hiệu suất query
5. **Monitoring:** Xem **Dashboard** để theo dõi hiệu suất

---

**Lưu ý:** Đây là môi trường development. Trong production, cần cấu hình bảo mật cao hơn.

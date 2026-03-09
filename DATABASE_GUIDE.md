# Hướng dẫn Database & pgAdmin4

## 📊 Kiến trúc Database

### Các bảng chính

```
users (Người dùng)
├── id (UUID)
├── email (VARCHAR)
├── password_hash (VARCHAR)
├── name (VARCHAR)
├── role (VARCHAR) - admin, user
├── is_active (BOOLEAN)
└── timestamps

documents (Tài liệu Scan)
├── id (UUID)
├── name (VARCHAR)
├── folder (VARCHAR)
├── type (VARCHAR) - DSGD, QD, KeHoach
├── file_path_s3 (VARCHAR)
├── pages (INTEGER)
├── ocr_status (VARCHAR) - Pending, Processing, Completed, Error
├── extract_status (VARCHAR)
├── uploaded_by (FK → users)
└── timestamps

students (Sinh viên)
├── id (UUID)
├── code (VARCHAR) - Mã sinh viên
├── name (VARCHAR)
├── class (VARCHAR)
├── cohort (INTEGER)
├── dob (DATE)
├── extracted_from_doc_id (FK → documents)
└── timestamps

scores (Điểm số)
├── id (UUID)
├── student_id (FK → students)
├── subject_code (VARCHAR)
├── subject_name (VARCHAR)
├── score (DECIMAL)
├── grade (VARCHAR) - A, B, C, D, F
├── status (VARCHAR) - Dat, Hong, HocLai
├── extracted_from_doc_id (FK → documents)
└── timestamps

decisions (Quyết định công nhận)
├── id (UUID)
├── number (VARCHAR) - Số QĐ
├── date (DATE)
├── cohort (INTEGER)
├── system (VARCHAR) - DH, CD, LT
├── total_students (INTEGER)
├── file_path_s3 (VARCHAR)
├── reconciled_at (TIMESTAMP)
├── reconciled_by (FK → users)
└── timestamps

decision_students (Sinh viên trong QĐ)
├── id (UUID)
├── decision_id (FK → decisions)
├── student_id (FK → students)
└── created_at

audit_logs (Lịch sử hoạt động)
├── id (UUID)
├── user_id (FK → users)
├── action (VARCHAR)
├── entity_type (VARCHAR)
├── entity_id (VARCHAR)
├── old_values (JSONB)
├── new_values (JSONB)
├── ip_address (VARCHAR)
├── user_agent (TEXT)
└── created_at

settings (Cài đặt hệ thống)
├── id (UUID)
├── key (VARCHAR) - UNIQUE
├── value (TEXT)
├── description (TEXT)
└── timestamps
```

## 🚀 Khởi động

### 1. Khởi động tất cả services

```bash
docker-compose up -d
```

Điều này sẽ:
- Tạo PostgreSQL database
- Chạy script init.sql để tạo bảng
- Khởi động pgAdmin4
- Khởi động Redis

### 2. Kiểm tra status

```bash
docker-compose ps
```

Kết quả mong đợi:
```
NAME                COMMAND                  SERVICE      STATUS
postgres            docker-entrypoint.s...   postgres     Up (healthy)
pgadmin             /entrypoint.sh           pgadmin      Up
redis               redis-server             redis        Up
```

### 3. Truy cập pgAdmin4

- URL: http://localhost:5050
- Email: admin@tvu.edu.vn
- Password: password

## 📝 Các Query thường dùng

### Xem thống kê tài liệu

```sql
SELECT * FROM v_document_stats;
```

### Xem thống kê sinh viên

```sql
SELECT * FROM v_student_stats;
```

### Xem thống kê điểm số

```sql
SELECT * FROM v_score_stats;
```

### Tìm sinh viên theo mã

```sql
SELECT * FROM students WHERE code = 'SV001';
```

### Tìm điểm của sinh viên

```sql
SELECT s.name, sc.subject_name, sc.score, sc.grade
FROM scores sc
JOIN students s ON sc.student_id = s.id
WHERE s.code = 'SV001'
ORDER BY sc.created_at DESC;
```

### Tìm sinh viên theo khóa

```sql
SELECT * FROM students WHERE cohort = 2021 ORDER BY name;
```

### Tìm sinh viên hỏng môn

```sql
SELECT DISTINCT s.code, s.name, s.class
FROM students s
JOIN scores sc ON s.id = sc.student_id
WHERE sc.status = 'Hong'
ORDER BY s.name;
```

### Tìm sinh viên cần học lại

```sql
SELECT DISTINCT s.code, s.name, COUNT(*) as retake_count
FROM students s
JOIN scores sc ON s.id = sc.student_id
WHERE sc.status = 'HocLai'
GROUP BY s.id, s.code, s.name
ORDER BY retake_count DESC;
```

### Tìm QĐ chưa đối chiếu

```sql
SELECT * FROM decisions WHERE reconciled_at IS NULL ORDER BY date DESC;
```

### Tìm sinh viên trong QĐ

```sql
SELECT s.code, s.name, s.class
FROM students s
JOIN decision_students ds ON s.id = ds.student_id
WHERE ds.decision_id = 'decision_id_here'
ORDER BY s.name;
```

### Xem lịch sử hoạt động

```sql
SELECT u.name, al.action, al.entity_type, al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;
```

### Xem lỗi OCR

```sql
SELECT name, ocr_status, error_message, uploaded_at
FROM documents
WHERE ocr_status = 'Error'
ORDER BY uploaded_at DESC;
```

### Thống kê OCR theo loại tài liệu

```sql
SELECT type, ocr_status, COUNT(*) as count
FROM documents
GROUP BY type, ocr_status
ORDER BY type, ocr_status;
```

### Thống kê điểm theo xếp loại

```sql
SELECT grade, COUNT(*) as count, ROUND(AVG(score)::numeric, 2) as avg_score
FROM scores
GROUP BY grade
ORDER BY grade;
```

## 🔧 Quản lý Database

### Backup Database

```bash
# Sử dụng pgAdmin4
# Hoặc dùng command line:
docker-compose exec postgres pg_dump -U admin tvu_gdqp_admin > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U admin tvu_gdqp_admin < backup.sql
```

### Xóa tất cả dữ liệu (cẩn thận!)

```bash
docker-compose exec postgres psql -U admin tvu_gdqp_admin -c "
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS decision_students CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
"
```

### Reset Database

```bash
# Xóa volume
docker-compose down -v

# Khởi động lại (sẽ chạy init.sql)
docker-compose up -d
```

## 👥 Người dùng mặc định

### Admin User
- Email: admin@tvu.edu.vn
- Password: password (cần thay đổi trong production)

### Application User (cho backend)
- Username: app_user
- Password: app_password
- Quyền: SELECT, INSERT, UPDATE, DELETE

### Read-only User
- Username: app_readonly
- Password: readonly_password
- Quyền: SELECT only

## 🔐 Bảo mật

### Thay đổi mật khẩu admin

```bash
docker-compose exec postgres psql -U admin tvu_gdqp_admin -c "
ALTER USER admin WITH PASSWORD 'new_password';
"
```

### Thay đổi mật khẩu app_user

```bash
docker-compose exec postgres psql -U admin tvu_gdqp_admin -c "
ALTER USER app_user WITH PASSWORD 'new_password';
"
```

## 📈 Hiệu suất

### Xem kích thước database

```sql
SELECT pg_size_pretty(pg_database_size('tvu_gdqp_admin'));
```

### Xem kích thước bảng

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Xem indexes

```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### Xem slow queries

```sql
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🐛 Khắc phục sự cố

### PostgreSQL không khởi động

```bash
# Xem logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### pgAdmin4 không kết nối được PostgreSQL

```bash
# Kiểm tra network
docker network ls

# Kiểm tra container
docker-compose ps

# Restart pgAdmin
docker-compose restart pgadmin
```

### Lỗi "database already exists"

```bash
# Xóa volume
docker-compose down -v

# Khởi động lại
docker-compose up -d
```

## 📚 Tài liệu tham khảo

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin4 Documentation](https://www.pgadmin.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Lưu ý:** Đây là hướng dẫn cho môi trường development. Trong production, cần cấu hình bảo mật cao hơn, backup tự động, và monitoring.

# 🔧 HƯỚNG DẪN CÀI ĐẶT CÁC SỬA ĐỔI

## ✅ CÁC VẤN ĐỀ ĐÃ SỬA

### 1. Lỗ hổng Authentication ✅
- **File:** `backend-node/src/routes/auth.routes.ts`
- **Sửa:** Đã loại bỏ hardcoded password check
- **Trạng thái:** HOÀN THÀNH

### 2. Google Drive Token Persistence ✅
- **Files:** 
  - `frontend/src/hooks/useGoogleDrive.ts`
  - `frontend/src/pages/Documents.tsx`
- **Sửa:** Chuyển từ sessionStorage sang localStorage
- **Trạng thái:** HOÀN THÀNH

### 3. Error Boundary ✅
- **File:** `frontend/src/components/ErrorBoundary.tsx`
- **Sửa:** Đã tạo ErrorBoundary component và integrate vào App.tsx
- **Trạng thái:** HOÀN THÀNH

### 4. Input Validation ✅
- **File:** `backend-node/src/middleware/validation.middleware.ts`
- **Sửa:** Đã tạo validation middleware với Joi
- **Trạng thái:** HOÀN THÀNH (cần cài đặt dependencies)

### 5. Rate Limiting ✅
- **File:** `backend-node/src/middleware/rateLimiter.middleware.ts`
- **Sửa:** Đã tạo rate limiter cho API, auth, và upload
- **Trạng thái:** HOÀN THÀNH (cần cài đặt dependencies)

### 6. Database Configuration ✅
- **File:** `backend-node/src/config/database.ts`
- **Sửa:** Đã tạo TypeORM configuration
- **Trạng thái:** HOÀN THÀNH (cần cài đặt dependencies và tạo entities)

---

## 📦 CÀI ĐẶT DEPENDENCIES

### Backend (Node.js)

```bash
cd backend-node

# Cài đặt dependencies mới
npm install express-rate-limit joi typeorm reflect-metadata

# Hoặc với yarn
yarn add express-rate-limit joi typeorm reflect-metadata
```

### Frontend (React)

Không cần cài đặt thêm dependencies mới cho frontend.

---

## 🔐 CẬP NHẬT SECRETS

### 1. Rotate Google API Credentials

**QUAN TRỌNG:** Các credentials trong `.env.local` đã bị expose. Cần rotate ngay:

```bash
# 1. Vào Google Cloud Console
# https://console.cloud.google.com/apis/credentials

# 2. Xóa API key và Client ID cũ

# 3. Tạo mới và cập nhật vào .env.local
VITE_GOOGLE_API_KEY=<NEW_API_KEY>
VITE_GOOGLE_CLIENT_ID=<NEW_CLIENT_ID>
VITE_GOOGLE_CLIENT_SECRET=<NEW_CLIENT_SECRET>
```

### 2. Cập nhật .gitignore

```bash
# Thêm vào .gitignore
echo "frontend/.env.local" >> .gitignore
echo "backend-node/.env" >> .gitignore
```

### 3. Tạo .env.example

```bash
# Frontend
cp frontend/.env.local frontend/.env.example

# Thay thế secrets bằng placeholders trong .env.example
# VITE_GOOGLE_API_KEY=your_api_key_here
# VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

---

## 🗄️ THIẾT LẬP DATABASE

### 1. Tạo PostgreSQL Database

```bash
# Với Docker
docker run --name tvu-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tvu_gdqp \
  -p 5432:5432 \
  -d postgres:15

# Hoặc cài đặt PostgreSQL local
# https://www.postgresql.org/download/
```

### 2. Cập nhật .env

```bash
# backend-node/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tvu_gdqp
JWT_SECRET=<GENERATE_RANDOM_SECRET>
NODE_ENV=development
```

### 3. Tạo TypeORM Entities

Cần tạo các entity files trong `backend-node/src/entities/`:

```typescript
// backend-node/src/entities/User.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  password_hash: string

  @Column()
  name: string

  @Column({ default: 'admin' })
  role: string

  @Column({ default: true })
  is_active: boolean

  @Column({ nullable: true })
  last_login: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
```

```typescript
// backend-node/src/entities/Document.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { User } from './User.entity'

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  folder: string

  @Column()
  type: string

  @Column({ nullable: true })
  file_path_s3: string

  @Column({ nullable: true })
  pages: number

  @Column({ default: 'Pending' })
  ocr_status: string

  @Column({ default: 'Pending' })
  extract_status: string

  @ManyToOne(() => User)
  uploaded_by: User

  @CreateDateColumn()
  uploaded_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column({ nullable: true, type: 'text' })
  error_message: string
}
```

### 4. Chạy Migrations

```bash
cd backend-node

# Tạo migration từ init.sql
npm run typeorm migration:create -- -n InitialSchema

# Chạy migrations
npm run typeorm migration:run
```

---

## 🚀 KHỞI ĐỘNG ỨNG DỤNG

### 1. Backend

```bash
cd backend-node

# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 2. Frontend

```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

---

## ✅ KIỂM TRA CÁC SỬA ĐỔI

### 1. Test Authentication

```bash
# Thử login với password sai - phải bị reject
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tvu.edu.vn","password":"wrong"}'

# Kết quả mong đợi: 401 Unauthorized
```

### 2. Test Rate Limiting

```bash
# Thử login 6 lần liên tiếp - lần thứ 6 phải bị block
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@tvu.edu.vn","password":"test"}'
  echo "\nAttempt $i"
done

# Kết quả mong đợi: Lần thứ 6 trả về 429 Too Many Requests
```

### 3. Test Input Validation

```bash
# Thử register document với invalid data
curl -X POST http://localhost:3000/api/documents/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"test.pdf"}'

# Kết quả mong đợi: 400 Bad Request với validation errors
```

### 4. Test Google Drive Token Persistence

1. Mở ứng dụng
2. Đăng nhập Google Drive
3. Refresh trang (F5)
4. Kiểm tra: Phải vẫn đăng nhập, không cần login lại

### 5. Test Error Boundary

1. Mở DevTools Console
2. Throw error trong component:
```javascript
// Trong bất kỳ component nào
throw new Error('Test error boundary')
```
3. Kiểm tra: Phải hiển thị error UI thay vì white screen

---

## 📝 CẬP NHẬT PACKAGE.JSON

### Backend

Thêm scripts vào `backend-node/package.json`:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:create": "npm run typeorm migration:create",
    "migration:run": "npm run typeorm migration:run -d src/config/database.ts",
    "migration:revert": "npm run typeorm migration:revert -d src/config/database.ts"
  }
}
```

---

## 🔄 MIGRATION PLAN

### Phase 1: Immediate (Đã hoàn thành)
- [x] Fix authentication vulnerability
- [x] Add input validation
- [x] Add rate limiting
- [x] Fix Google Drive token persistence
- [x] Add error boundary
- [x] Create database configuration

### Phase 2: This Week (Cần làm)
- [ ] Install dependencies
- [ ] Create TypeORM entities
- [ ] Run database migrations
- [ ] Update routes to use database instead of Map
- [ ] Test all endpoints
- [ ] Rotate API secrets

### Phase 3: This Month (Kế hoạch)
- [ ] Add comprehensive error handling
- [ ] Implement audit logging
- [ ] Add loading states
- [ ] Standardize API responses
- [ ] Add pagination
- [ ] Enable TypeScript strict mode
- [ ] Add unit tests

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Cannot find module 'express-rate-limit'"

```bash
cd backend-node
npm install express-rate-limit
```

### Lỗi: "Cannot find module 'joi'"

```bash
cd backend-node
npm install joi
```

### Lỗi: "Cannot connect to database"

1. Kiểm tra PostgreSQL đang chạy:
```bash
docker ps | grep postgres
# hoặc
pg_isready
```

2. Kiểm tra credentials trong `.env`

3. Kiểm tra firewall/port 5432

### Lỗi: "TypeORM entities not found"

1. Kiểm tra path trong `database.ts`:
```typescript
entities: ['src/entities/**/*.ts']
```

2. Đảm bảo đã tạo entity files

### Google Drive token không persist

1. Kiểm tra localStorage trong DevTools
2. Xóa cache và thử lại
3. Kiểm tra console có lỗi không

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:

1. **Logs:** `backend-node/combined.log` và `backend-node/error.log`
2. **Browser Console:** F12 → Console tab
3. **Network Tab:** F12 → Network tab để xem API requests

---

**Cập nhật lần cuối:** 6/3/2026  
**Version:** 1.0

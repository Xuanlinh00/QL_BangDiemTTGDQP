# Hướng dẫn Push Code lên Git để Deploy lên Render

## Tóm tắt

Tất cả file frontend đã được chuẩn hóa. Bây giờ bạn chỉ cần:
1. Commit tất cả file
2. Push lên GitHub
3. Deploy lên Render

## Các bước

### 1. Kiểm tra Status

```bash
git status
```

Bạn sẽ thấy các file mới được tạo:
- `frontend/.env.production`
- `frontend/.env.local.example`
- `frontend/Dockerfile.render`
- `frontend/render.yaml`
- `frontend/RENDER_DEPLOY_GUIDE.md`
- `frontend/RENDER_SETUP_GUIDE.md`
- `frontend/RENDER_CHECKLIST.md`
- `frontend/CHANGES_SUMMARY.md`
- `frontend/vite.config.ts` (cập nhật)
- `frontend/.env.example` (cập nhật)
- `frontend/.dockerignore` (cập nhật)
- `frontend/src/pages/TVUExtract.tsx` (cập nhật)
- `RENDER_DEPLOYMENT_FINAL.md`
- `PUSH_TO_GIT_GUIDE.md` (file này)

### 2. Thêm tất cả file

```bash
git add .
```

### 3. Commit

```bash
git commit -m "Prepare frontend for Render deployment - MongoDB only"
```

Hoặc chi tiết hơn:

```bash
git commit -m "Prepare frontend for Render deployment

- Update .env.example to use MongoDB backend only
- Create .env.production for Render
- Update vite.config.ts with production build config
- Add Dockerfile.render for Docker deployment
- Add render.yaml for Render configuration
- Add comprehensive deployment guides
- Update TVUExtract.tsx with timeout for API health check
- Update .dockerignore and .env.local.example"
```

### 4. Push lên GitHub

```bash
git push origin main
```

Hoặc nếu branch khác:

```bash
git push origin <branch-name>
```

## Xác minh Push

1. Truy cập GitHub repository
2. Kiểm tra commit mới nhất
3. Kiểm tra tất cả file đã được push

## Bước Tiếp Theo: Deploy lên Render

Sau khi push thành công, hãy:

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Tạo Web Service mới
3. Kết nối GitHub repository
4. Cấu hình theo hướng dẫn trong `frontend/RENDER_DEPLOY_GUIDE.md`

## Troubleshooting

### Lỗi: "Permission denied"

**Giải pháp**:
```bash
# Kiểm tra SSH key
ssh -T git@github.com

# Hoặc sử dụng HTTPS
git remote set-url origin https://github.com/<username>/<repo>.git
```

### Lỗi: "Rejected"

**Giải pháp**:
```bash
# Pull latest changes
git pull origin main

# Resolve conflicts nếu có
# Sau đó push lại
git push origin main
```

### Lỗi: "Large files"

**Giải pháp**:
```bash
# Kiểm tra file size
git ls-files -s | sort -k4 -n -r | head -10

# Xóa file lớn nếu cần
git rm --cached <large-file>
```

## Liên kết Hữu ích

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Help](https://docs.github.com)
- [Render Documentation](https://render.com/docs)

## Ghi chú

- ✅ Tất cả file đã được chuẩn hóa
- ✅ Không có lỗi TypeScript
- ✅ Build test đã pass
- ✅ Sẵn sàng deploy lên Render
- ✅ Chỉ cần điền environment variables trên Render

## Danh sách File Chuẩn hóa

### Frontend
- ✅ `.env.example` - Cập nhật
- ✅ `.env.production` - Tạo mới
- ✅ `.env.local.example` - Tạo mới
- ✅ `vite.config.ts` - Cập nhật
- ✅ `Dockerfile.render` - Tạo mới
- ✅ `render.yaml` - Tạo mới
- ✅ `.dockerignore` - Cập nhật
- ✅ `src/pages/TVUExtract.tsx` - Cập nhật
- ✅ `RENDER_DEPLOY_GUIDE.md` - Tạo mới
- ✅ `RENDER_SETUP_GUIDE.md` - Tạo mới
- ✅ `RENDER_CHECKLIST.md` - Tạo mới
- ✅ `CHANGES_SUMMARY.md` - Tạo mới

### Root
- ✅ `RENDER_DEPLOYMENT_FINAL.md` - Tạo mới
- ✅ `PUSH_TO_GIT_GUIDE.md` - Tạo mới (file này)

## Sẵn sàng?

Khi bạn sẵn sàng, chạy:

```bash
git add .
git commit -m "Prepare frontend for Render deployment"
git push origin main
```

Sau đó, hãy đọc `frontend/RENDER_DEPLOY_GUIDE.md` để deploy lên Render.

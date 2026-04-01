# Sửa lỗi Activity Editor

## Lỗi gặp phải

```
ReferenceError: ActivityEditorPage is not defined
```

## Nguyên nhân

- File `ActivityEditorPage.tsx` cũ đã bị xóa
- Browser cache còn giữ reference cũ
- Vite dev server cần restart

## Đã sửa

✅ Xóa file `ActivityEditorPage.tsx` cũ
✅ Tạo file mới `ActivityEditorDemo.tsx`
✅ Cập nhật import trong `App.tsx`

## Cách khắc phục

### Option 1: Hard refresh browser (Khuyến nghị)

1. Mở browser
2. Nhấn `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
3. Hoặc mở DevTools (F12) → Right click nút Refresh → "Empty Cache and Hard Reload"

### Option 2: Restart dev server

```powershell
# Trong terminal đang chạy dev server
# Nhấn Ctrl+C để stop

# Sau đó chạy lại
cd frontend
npm run dev
```

### Option 3: Dùng script tự động

```powershell
cd frontend
.\restart-dev.ps1
```

## Kiểm tra sau khi sửa

1. Mở browser: `http://localhost:5173`
2. Đăng nhập vào hệ thống
3. Truy cập: `http://localhost:5173/activities/new`
4. ✅ Không còn lỗi
5. ✅ Hiển thị Activity Editor

## Cấu trúc file hiện tại

```
frontend/src/
├── pages/
│   ├── Activities.tsx              # Trang danh sách
│   └── ActivityEditorDemo.tsx      # Trang editor mới ✅
├── components/
│   └── ActivityEditor/
│       ├── ActivityEditor.tsx
│       ├── ActivityEditorHeader.tsx
│       ├── ActivityEditorToolbar.tsx
│       ├── ActivityEditorContent.tsx
│       ├── ActivityEditorSidebar.tsx
│       ├── ActivityEditor.css
│       └── index.ts
├── hooks/
│   └── useActivityEditor.ts
└── services/
    └── activityService.ts
```

## Route hiện tại

```tsx
// App.tsx
<Route path="activities/new" element={<ActivityEditorDemo />} />
```

## Nếu vẫn còn lỗi

### Clear tất cả cache

```powershell
# Stop dev server (Ctrl+C)

# Xóa node_modules và reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install

# Xóa Vite cache
Remove-Item -Recurse -Force .vite

# Start lại
npm run dev
```

### Kiểm tra console errors

1. Mở DevTools (F12)
2. Tab Console
3. Xem có lỗi import nào không
4. Nếu có lỗi về lucide-react:
   ```powershell
   cd frontend
   npm install lucide-react
   ```

## Test component

Sau khi sửa xong, test các tính năng:

1. ✅ Header hiển thị đúng
2. ✅ Toolbar có đầy đủ nút
3. ✅ Editor nhập được text
4. ✅ Nút B, I, U hoạt động
5. ✅ Heading dropdown hoạt động
6. ✅ Sidebar hiển thị bên phải

## Lưu ý

- Lỗi 503 từ API là bình thường nếu backend chưa chạy
- Component vẫn hoạt động offline
- Chỉ cần backend chạy mới lưu được dữ liệu

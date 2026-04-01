# Test Activity Editor

## Cách test component

### 1. Khởi động dev server

```bash
cd frontend
npm run dev
```

### 2. Truy cập URL

Sau khi đăng nhập vào hệ thống, truy cập:

```
http://localhost:5173/activities/new
```

### 3. Kiểm tra các tính năng

#### Header
- ✅ Tiêu đề "Thêm hoạt động mới" hiển thị italic
- ✅ Nút "Hủy" - click để quay lại
- ✅ Nút "Lưu nháp" màu cyan
- ✅ Nút "Đăng bài" màu xanh lá

#### Toolbar
- ✅ Dropdown "Văn bản" - chọn Paragraph, H1-H6
- ✅ Dropdown "Thường" - chọn Bold, Italic, Underline
- ✅ Nút B, I, U, S - click để format text
- ✅ Nút highlight khi active (màu xanh)
- ✅ Các nút list, alignment, link, image, video

#### Editor
- ✅ Nhập text vào editor
- ✅ Chọn text và click B → text đậm
- ✅ Chọn text và click I → text nghiêng
- ✅ Chọn text và click U → text gạch chân
- ✅ Chọn Heading 1 từ dropdown → text to
- ✅ Keyboard shortcuts: Ctrl+B, Ctrl+I, Ctrl+U

#### Sidebar
- ✅ Input "Tiêu đề hoạt động"
- ✅ Dropdown "Danh mục"
- ✅ Upload ảnh đại diện

### 4. Test các vấn đề đã sửa

#### Thanh chữ không nhảy
1. Nhập text bình thường
2. Chọn Heading 1 từ dropdown
3. ✅ Text to lên nhưng không làm layout nhảy

#### Heading hoạt động
1. Nhập text: "Đây là tiêu đề"
2. Chọn text
3. Chọn "Heading 1" từ dropdown "Văn bản"
4. ✅ Text hiển thị to, đậm

#### Nút B, I, U giữ trạng thái
1. Nhập text: "Hello World"
2. Chọn text
3. Click nút B
4. ✅ Nút B có background xanh (active)
5. ✅ Text đậm
6. Click nút B lại
7. ✅ Nút B mất background xanh
8. ✅ Text không đậm nữa

### 5. Test API (nếu backend chạy)

#### Lưu nháp
1. Nhập tiêu đề và nội dung
2. Click "Lưu nháp"
3. ✅ Gọi POST /api/draft với status="draft"

#### Đăng bài
1. Nhập tiêu đề và nội dung
2. Click "Đăng bài"
3. ✅ Gọi POST /api/posts với status="published"

#### Validation
1. Không nhập nội dung
2. Click "Đăng bài"
3. ✅ Hiển thị alert "Vui lòng nhập nội dung bài viết"

## Troubleshooting

### Lỗi: Cannot find module 'lucide-react'
```bash
cd frontend
npm install lucide-react
```

### Lỗi: API 503
- Backend chưa chạy hoặc chưa có endpoint /api/draft và /api/posts
- Component vẫn hoạt động bình thường, chỉ không lưu được

### Heading không hoạt động
- Kiểm tra file `ActivityEditor.css` đã được tạo
- Kiểm tra import trong `ActivityEditorContent.tsx`

### Nút format không giữ trạng thái
- Kiểm tra state `activeFormats` trong `ActivityEditorToolbar.tsx`
- Kiểm tra hàm `updateActiveFormats()` được gọi

## Giao diện mẫu

```
┌─────────────────────────────────────────────────────────────────┐
│ Thêm hoạt động mới          [Hủy] [Lưu nháp] [Đăng bài]        │
├─────────────────────────────────────────────────────────────────┤
│ [Văn bản ▼] [Thường ▼] | B I U S | A A̲ | ≡ 1. | ⬅ ⬌ ➡ ⬌ | ... │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Editor area - nhập nội dung tại đây]                         │
│                                                                 │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Next Steps

Sau khi test xong, có thể:
1. Thêm nút "Thêm hoạt động mới" vào trang Activities
2. Implement upload ảnh thực tế
3. Thêm auto-save
4. Thêm preview mode
5. Integrate với backend API thực tế
